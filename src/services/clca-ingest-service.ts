/**
 * CLCA Ingest Service
 * Handles publishing ContentDoc data to CLCA Courier with JWT authentication and rate limiting
 */

// Note: Rate limiting and monitoring services may need to be implemented
// import { RateLimitService } from './rate-limit-service';
// import { MonitoringService } from './monitoring-service';
import { logger } from 'src/utils/logger';
import type { ContentDoc } from 'src/schemas/contentdoc';

export interface IngestResult {
  status: 'created' | 'updated' | 'noop';
  id: string;
  ingestRequestId?: string;
}

export interface CLCAIngestError extends Error {
  statusCode?: number;
  retryAfter?: number;
  requestId?: string;
}

export class CLCAIngestService {
  private readonly CLCA_INGEST_URL = process.env.CLCA_INGEST_URL || '';
  private readonly JWT_SECRET = process.env.CLCA_JWT_SECRET || '';
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  constructor() {
    if (!this.CLCA_INGEST_URL) {
      logger.warn('CLCA_INGEST_URL not configured - CLCA integration disabled');
    }
    if (!this.JWT_SECRET) {
      logger.warn('CLCA_JWT_SECRET not configured - CLCA integration disabled');
    }
  }

  /**
   * Publish ContentDoc to CLCA
   */
  async publishContent(contentDoc: ContentDoc): Promise<IngestResult> {
    const startTime = Date.now();

    try {
      // Check configuration
      if (!this.CLCA_INGEST_URL || !this.JWT_SECRET) {
        throw new Error('CLCA integration not properly configured');
      }

      // TODO: Add rate limiting check when RateLimitService is available
      // const rateLimitResult = await this.rateLimitService.checkCLCAIngestLimit(
      //   contentDoc.ownerSystem,
      // );

      // Generate JWT token
      const jwt = await this.generateJWT();

      // Make request to CLCA
      const response = await this.makeRequest(contentDoc, jwt);
      const result: IngestResult = await response.json();
      const latency = Date.now() - startTime;

      // TODO: Add monitoring when MonitoringService is available
      // Track success metrics here

      logger.info('Content published to CLCA successfully', {
        contentDocId: contentDoc.id,
        clcaId: result.id,
        status: result.status,
        latency,
      });

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      const clcaError = error as CLCAIngestError;

      // TODO: Add error tracking when MonitoringService is available

      logger.error('Failed to publish content to CLCA', clcaError, {
        contentDocId: contentDoc.id,
        latency,
        statusCode: clcaError.statusCode,
        retryAfter: clcaError.retryAfter,
      });

      throw clcaError;
    }
  }

  /**
   * Make HTTP request to CLCA with proper error handling
   */
  private async makeRequest(contentDoc: ContentDoc, jwt: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${this.CLCA_INGEST_URL}/api/ingest/content`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TTG-Quasar/1.0',
          'X-Request-ID': this.generateRequestId(),
        },
        body: JSON.stringify(contentDoc),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(
          `Ingestion failed: ${response.status} ${response.statusText}`,
        ) as CLCAIngestError;

        error.statusCode = response.status;

        // Parse retry-after header if available
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          error.retryAfter = parseInt(retryAfter, 10);
        }

        // Include response body for debugging
        try {
          const errorData = JSON.parse(errorText);
          error.message += ` - ${errorData.message || errorText}`;
          error.requestId = errorData.requestId;
        } catch {
          error.message += ` - ${errorText}`;
        }

        throw error;
      }

      return response;
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if ((fetchError as Error).name === 'AbortError') {
        const error = new Error('Request timeout') as CLCAIngestError;
        error.statusCode = 408;
        throw error;
      }

      // Network or other fetch errors
      const error = new Error(
        `Network error: ${(fetchError as Error).message || 'Unknown error'}`,
      ) as CLCAIngestError;
      throw error;
    }
  }

  /**
   * Generate JWT token for CLCA authentication
   */
  private async generateJWT(): Promise<string> {
    try {
      // Dynamic import to avoid bundling issues in browser
      const jwt = await import('jsonwebtoken');

      const payload = {
        scope: 'ingest:content',
        issuer: 'ttg',
        aud: 'clca',
        exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        iat: Math.floor(Date.now() / 1000),
        jti: this.generateRequestId(),
      };

      return jwt.sign(payload, this.JWT_SECRET, {
        algorithm: 'HS256',
      });
    } catch (error) {
      logger.error('Failed to generate JWT token', error as Error);
      throw new Error('Authentication token generation failed');
    }
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `ttg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if CLCA integration is properly configured
   */
  isConfigured(): boolean {
    return !!(this.CLCA_INGEST_URL && this.JWT_SECRET);
  }

  /**
   * Health check for CLCA service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    if (!this.isConfigured()) {
      return { status: 'unhealthy' };
    }

    const startTime = Date.now();

    try {
      const jwt = await this.generateJWT();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.CLCA_INGEST_URL}/api/health`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'User-Agent': 'TTG-Quasar/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        latency,
      };
    } catch (error) {
      logger.warn('CLCA health check failed', { error: (error as Error).message });
      return { status: 'unhealthy' };
    }
  }

  /**
   * Validate ContentDoc before sending to CLCA
   */
  validateContentDoc(contentDoc: ContentDoc): void {
    // Basic validation
    if (!contentDoc.id || !contentDoc.title) {
      throw new Error('ContentDoc missing required fields: id, title');
    }

    if (!contentDoc.ownerSystem || contentDoc.ownerSystem !== 'ttg') {
      throw new Error('ContentDoc must have ownerSystem set to "ttg"');
    }

    if (!contentDoc.features || Object.keys(contentDoc.features).length === 0) {
      throw new Error('ContentDoc must have at least one feature');
    }

    // Validate ISO timestamps
    try {
      new Date(contentDoc.createdAt);
      new Date(contentDoc.updatedAt);
    } catch {
      throw new Error('ContentDoc timestamps must be valid ISO strings');
    }

    // Validate event feature if present
    if (contentDoc.features['feat:event/v1']) {
      const eventFeature = contentDoc.features['feat:event/v1'];
      try {
        new Date(eventFeature.startTime);
        new Date(eventFeature.endTime);
      } catch {
        throw new Error('Event feature timestamps must be valid ISO strings');
      }

      if (!eventFeature.location?.trim()) {
        throw new Error('Event feature must have a location');
      }
    }
  }
}
