/**
 * Dead Letter Queue Service
 * Handles failed CLCA ingestion attempts with exponential backoff retry logic
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { logger } from 'src/utils/logger';
import type { ContentDoc } from 'src/schemas/contentdoc';
import type { CLCAIngestError } from './clca-ingest-service';

interface DLQEntry {
  id?: string;
  contentDoc: ContentDoc;
  error: {
    message: string;
    stack?: string;
    statusCode?: number;
    requestId?: string;
  };
  context: {
    eventId: string;
    attempt: number;
    maxRetries: number;
  };
  createdAt: Timestamp;
  retryAfter: Timestamp;
  lastAttemptAt?: Timestamp;
}

export class DeadLetterQueueService {
  private readonly DLQ_COLLECTION = 'clca_ingestion_dlq';
  private readonly DEFAULT_MAX_RETRIES = 5;
  private readonly BASE_RETRY_DELAY = 60000; // 1 minute
  private readonly MAX_RETRY_DELAY = 960000; // 16 minutes

  /**
   * Add failed ingestion to DLQ for retry
   */
  async addToDLQ(
    contentDoc: ContentDoc,
    error: CLCAIngestError,
    context: { eventId: string; attempt: number; maxRetries?: number },
  ): Promise<void> {
    try {
      const maxRetries = context.maxRetries || this.DEFAULT_MAX_RETRIES;
      const retryDelay = this.getRetryDelay(context.attempt);

      const dlqEntry: Omit<DLQEntry, 'id'> = {
        contentDoc,
        error: {
          message: error.message,
          stack: error.stack,
          statusCode: error.statusCode,
          requestId: error.requestId,
        },
        context: {
          eventId: context.eventId,
          attempt: context.attempt,
          maxRetries,
        },
        createdAt: serverTimestamp() as Timestamp,
        retryAfter: new Timestamp(Math.floor((Date.now() + retryDelay) / 1000), 0),
        lastAttemptAt: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(collection(db, this.DLQ_COLLECTION), dlqEntry);

      logger.info('Added to dead letter queue', {
        dlqId: docRef.id,
        eventId: context.eventId,
        attempt: context.attempt,
        retryAfter: new Date(Date.now() + retryDelay).toISOString(),
        errorMessage: error.message,
        statusCode: error.statusCode,
      });
    } catch (dlqError) {
      logger.error('Failed to add to dead letter queue', dlqError as Error, {
        originalError: error.message,
        eventId: context.eventId,
        statusCode: error.statusCode,
      });
    }
  }

  /**
   * Process DLQ items that are ready for retry
   */
  async processDLQ(): Promise<{ processed: number; succeeded: number; failed: number }> {
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      // Get items ready for retry
      const dlqItems = await getDocs(
        query(
          collection(db, this.DLQ_COLLECTION),
          where('retryAfter', '<=', Timestamp.now()),
          orderBy('retryAfter', 'asc'),
          limit(10), // Process 10 items at a time
        ),
      );

      logger.info(`Processing ${dlqItems.size} DLQ items`);

      for (const itemDoc of dlqItems.docs) {
        const data = itemDoc.data() as DLQEntry;
        processed++;

        try {
          // Check if max retries exceeded
          if (data.context.attempt >= data.context.maxRetries) {
            await this.moveToFailedQueue(itemDoc.id, data, 'Max retries exceeded');
            failed++;
            continue;
          }

          // Attempt to re-ingest
          const result = await this.retryIngestion(data);

          if (result.success) {
            // Success - remove from DLQ
            await deleteDoc(itemDoc.ref);
            succeeded++;

            logger.info('DLQ item processed successfully', {
              dlqId: itemDoc.id,
              eventId: data.context.eventId,
              attempt: data.context.attempt,
              clcaId: result.clcaId,
            });
          } else {
            // Failed - update retry info
            await this.updateRetryInfo(
              itemDoc.ref,
              data,
              result.error || new Error('Unknown ingestion error'),
            );
            failed++;
          }
        } catch (retryError) {
          // Update retry info on error
          await this.updateRetryInfo(itemDoc.ref, data, retryError as Error);
          failed++;

          logger.warn('DLQ item retry failed', {
            dlqId: itemDoc.id,
            eventId: data.context.eventId,
            attempt: data.context.attempt,
            error: (retryError as Error).message,
          });
        }
      }

      logger.info('DLQ processing completed', { processed, succeeded, failed });
      return { processed, succeeded, failed };
    } catch (error) {
      logger.error('Failed to process dead letter queue', error as Error);
      return { processed, succeeded, failed };
    }
  }

  /**
   * Retry ingestion for a DLQ item
   */
  private async retryIngestion(data: DLQEntry): Promise<{
    success: boolean;
    clcaId?: string;
    error?: Error;
  }> {
    try {
      // Dynamic import to avoid circular dependency
      const { CLCAIngestService } = await import('./clca-ingest-service');
      const clcaIngestService = new CLCAIngestService();

      const result = await clcaIngestService.publishContent(data.contentDoc);
      return { success: true, clcaId: result.id };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Update retry information for failed attempt
   */
  private async updateRetryInfo(
    docRef: Parameters<typeof updateDoc>[0],
    data: DLQEntry,
    error: Error,
  ): Promise<void> {
    const newAttempt = data.context.attempt + 1;
    const retryDelay = this.getRetryDelay(newAttempt);

    await updateDoc(docRef, {
      'context.attempt': newAttempt,
      'error.message': error.message,
      'error.stack': error.stack,
      retryAfter: new Timestamp(Math.floor((Date.now() + retryDelay) / 1000), 0),
      lastAttemptAt: serverTimestamp(),
    });
  }

  /**
   * Move item to failed queue when max retries exceeded
   */
  private async moveToFailedQueue(dlqId: string, data: DLQEntry, reason: string): Promise<void> {
    try {
      // Add to failed queue
      await addDoc(collection(db, 'clca_ingestion_failed'), {
        ...data,
        failedAt: serverTimestamp(),
        failureReason: reason,
        originalDlqId: dlqId,
      });

      // Remove from DLQ
      await deleteDoc(doc(db, this.DLQ_COLLECTION, dlqId));

      logger.warn('Moved DLQ item to failed queue', {
        dlqId,
        eventId: data.context.eventId,
        attempts: data.context.attempt,
        reason,
      });
    } catch (error) {
      logger.error('Failed to move item to failed queue', error as Error, {
        dlqId,
        eventId: data.context.eventId,
      });
    }
  }

  /**
   * Get DLQ statistics
   */
  async getDLQStats(): Promise<{
    totalItems: number;
    readyForRetry: number;
    pendingRetry: number;
    averageAttempts: number;
  }> {
    try {
      const [allItems, readyItems] = await Promise.all([
        getDocs(collection(db, this.DLQ_COLLECTION)),
        getDocs(
          query(collection(db, this.DLQ_COLLECTION), where('retryAfter', '<=', Timestamp.now())),
        ),
      ]);

      const totalItems = allItems.size;
      const readyForRetry = readyItems.size;
      const pendingRetry = totalItems - readyForRetry;

      // Calculate average attempts
      let totalAttempts = 0;
      allItems.forEach((doc) => {
        const data = doc.data() as DLQEntry;
        totalAttempts += data.context.attempt;
      });
      const averageAttempts = totalItems > 0 ? totalAttempts / totalItems : 0;

      return {
        totalItems,
        readyForRetry,
        pendingRetry,
        averageAttempts: Math.round(averageAttempts * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get DLQ stats', error as Error);
      return {
        totalItems: 0,
        readyForRetry: 0,
        pendingRetry: 0,
        averageAttempts: 0,
      };
    }
  }

  /**
   * Clear all DLQ items (admin function)
   */
  async clearDLQ(): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, this.DLQ_COLLECTION));
      let deletedCount = 0;

      const deletePromises = snapshot.docs.map(async (doc) => {
        await deleteDoc(doc.ref);
        deletedCount++;
      });

      await Promise.all(deletePromises);

      logger.info('Cleared DLQ', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to clear DLQ', error as Error);
      throw error;
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(attempt: number): number {
    // Exponential backoff: 1min, 2min, 4min, 8min, 16min (max)
    const delay = Math.min(this.BASE_RETRY_DELAY * Math.pow(2, attempt - 1), this.MAX_RETRY_DELAY);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Get items from DLQ for debugging/admin purposes
   */
  async getDLQItems(limitCount = 50): Promise<DLQEntry[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, this.DLQ_COLLECTION), orderBy('createdAt', 'desc'), limit(limitCount)),
      );

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DLQEntry[];
    } catch (error) {
      logger.error('Failed to get DLQ items', error as Error);
      return [];
    }
  }
}
