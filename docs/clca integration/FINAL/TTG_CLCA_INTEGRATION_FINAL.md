# TTG Quasar ↔ CLCA Courier Integration - Final Implementation Guide

**Version**: 2.0  
**Status**: Ready for Implementation  
**Last Updated**: Sepetember 2025

## 🎯 **Executive Summary**

This document provides the definitive implementation guide for integrating TTG Quasar with CLCA Courier using a **one-way push architecture**. TTG will push gaming events and content to CLCA's newsletter system while maintaining complete system autonomy and following TTG's established architectural patterns.

### **Integration Goals**

- Enable TTG gaming events to appear on CLCA community website and newsletters
- Adopt ContentDoc architecture within TTG for better content management
- Maintain separate Firebase projects and system independence
- Follow TTG's strict TypeScript, Quasar-only, Firebase-first patterns
- **CRITICAL**: Complete migration from legacy event submission system to unified ContentDoc architecture and remove OLD legacy code and files

---

## 🏗️ **Architecture Principles**

### **TTG Architectural Constraints** ⚡

- **TypeScript Strict Mode**: All code must use strict TypeScript compilation ()
- **Quasar Components Only**: No custom CSS, use `q-*` components exclusively
- **Firebase-Only Stores**: Use `*-firebase-store.ts` pattern exclusively (Pinia + VueFire)
- **Vue 3 Composition API**: Follow established composable patterns with `defineStore`
- **Separation of Concerns**: Keep files under 200-300 lines, use reusable components
- **Accessibility First**: Proper ARIA labels, keyboard navigation, semantic HTML via Quasar
- **Service Pattern**: Use class-based services with dependency injection
- **Model Classes**: Use class-based models with Firebase conversion methods

### **Integration Architecture**

```
TTG Quasar (Firebase Project A)
├── Event Creation/Update → ContentDoc Mapping
├── JWT Authentication → Secret Manager
├── POST /api/ingest/content → CLCA
├── Dead Letter Queue → Failed Retries
└── Monitoring → Error Tracking

CLCA Courier (Firebase Project B)
├── JWT Validation → Secret Manager
├── ContentDoc Validation → JSON Schema
├── Idempotency Check → ownerSystem + originalId
├── Content Storage → Firestore
└── Newsletter Generation → Public API
```

---

## 📦 **Phase 1: ContentDoc Foundation (Week 1)**

### **1.1 Shared Schema Package (`@org/contentdoc-schema`)**

**Package Structure:**

```
@org/contentdoc-schema/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts (exports all types)
│   ├── schemas/
│   │   └── contentdoc.schema.json
│   ├── fixtures/
│   │   └── sample-event.json
│   └── test/
│       └── validate-sample.ts
├── dist/ (compiled output)
└── README.md
```

**Core ContentDoc Interface:**

```typescript
export interface ContentDoc {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'pending' | 'archived' | 'deleted';
  tags: string[]; // ['content-type:event', 'system:ttg', 'game-genre:strategy']
  features: FeatureMap;
  rsvpSummary?: RSVPSummary;
  images?: ImageMeta[];
  ownerSystem: 'ttg' | 'clca';
  originalId?: string; // 'event:4567'
  ownerUrl?: string; // Deep link back to TTG
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface FeatureMap {
  'feat:event/v1'?: {
    startTime: string; // ISO timestamp
    endTime: string; // ISO timestamp
    location: string;
    minPlayers?: number;
    maxPlayers?: number;
  };
  'feat:game/v1'?: {
    gameId: string;
    gameName: string;
    genre?: string;
    playerCount?: number | string;
  };
}

export interface RSVPSummary {
  yes: number;
  no: number;
  maybe?: number;
  waitlist?: number;
  capacity?: number | null;
}
```

### **1.2 TTG ContentDoc Services**

**ContentDoc Mapping Service (TTG Pattern):**

```typescript
// src/services/contentdoc-mapping-service.ts
import { ValidationService } from './validation-service';
import { logger } from 'src/utils/logger';
import type { Event } from 'src/models/Event';
import type { Game } from 'src/models/Game';
import type { ContentDoc } from '@org/contentdoc-schema';

export class ContentDocMappingService {
  constructor(private validationService = new ValidationService()) {}

  async mapEventToContentDoc(event: Event): Promise<ContentDoc> {
    try {
      const contentDoc: ContentDoc = {
        id: `ttg:event:${event.id}`,
        title: event.title,
        description: event.description,
        status: this.mapEventStatus(event.status),
        tags: this.buildEventTags(event),
        features: {
          'feat:event/v1': {
            startTime: this.buildISOTimestamp(event.date, event.time),
            endTime: this.buildISOTimestamp(event.date, event.endTime || event.time),
            location: event.location,
            minPlayers: event.minPlayers,
            maxPlayers: event.maxPlayers,
          },
          ...(event.gameId && {
            'feat:game/v1': {
              gameId: event.gameId.toString(),
              gameName: event.gameName || 'Unknown Game',
              genre: event.game?.genre,
              playerCount: event.maxPlayers,
            },
          }),
        },
        rsvpSummary: this.buildRSVPSummary(event),
        images: event.images?.map((img) => ({
          url: img.url,
          caption: img.caption,
          width: img.width,
          height: img.height,
        })),
        ownerSystem: 'ttg',
        originalId: `event:${event.id}`,
        ownerUrl: `${process.env.VITE_APP_BASE_URL}/events/${event.id}`,
        createdAt: event.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: event.updatedAt?.toISOString() || new Date().toISOString(),
      };

      // Validate the ContentDoc
      await this.validationService.validateContentDoc(contentDoc);

      logger.info('ContentDoc mapped successfully', {
        eventId: event.id,
        contentDocId: contentDoc.id,
      });

      return contentDoc;
    } catch (error) {
      logger.error('Failed to map event to ContentDoc', error as Error, {
        eventId: event.id,
      });
      throw error;
    }
  }

  private mapEventStatus(status: string): ContentDoc['status'] {
    switch (status) {
      case 'upcoming':
        return 'published';
      case 'completed':
        return 'archived';
      case 'cancelled':
        return 'deleted';
      default:
        return 'draft';
    }
  }

  private buildEventTags(event: Event): string[] {
    return [
      'content-type:event',
      'system:ttg',
      `event-type:${event.eventType || 'game_night'}`,
      ...(event.gameId ? [`game-id:${event.gameId}`] : []),
      ...(event.game?.genre ? [`game-genre:${event.game.genre}`] : []),
      `status:${event.status}`,
    ].filter(Boolean);
  }

  private buildISOTimestamp(date: string, time: string): string {
    return new Date(`${date}T${time}`).toISOString();
  }

  private buildRSVPSummary(event: Event): RSVPSummary {
    const rsvps = event.rsvps || [];
    return {
      yes: rsvps.filter((r) => r.status === 'confirmed').length,
      no: rsvps.filter((r) => r.status === 'declined').length,
      maybe: rsvps.filter((r) => r.status === 'maybe').length,
      waitlist: rsvps.filter((r) => r.status === 'waitlist').length,
      capacity: event.maxPlayers,
    };
  }

  async mapGameToContentDoc(game: Game): Promise<ContentDoc> {
    try {
      const contentDoc: ContentDoc = {
        id: `ttg:game:${game.id}`,
        title: game.title,
        description: game.description,
        status: game.approved ? 'published' : 'draft',
        tags: this.buildGameTags(game),
        features: {
          'feat:game/v1': {
            gameId: game.id,
            gameName: game.title,
            genre: game.genre,
            playerCount: game.numberOfPlayers,
          },
        },
        ownerSystem: 'ttg',
        originalId: `game:${game.id}`,
        ownerUrl: `${process.env.VITE_APP_BASE_URL}/games/${game.id}`,
        createdAt: game.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: game.updatedAt?.toISOString() || new Date().toISOString(),
      };

      await this.validationService.validateContentDoc(contentDoc);
      return contentDoc;
    } catch (error) {
      logger.error('Failed to map game to ContentDoc', error as Error, {
        gameId: game.id,
      });
      throw error;
    }
  }

  private buildGameTags(game: Game): string[] {
    return [
      'content-type:game',
      'system:ttg',
      `genre:${game.genre}`,
      `difficulty:${game.difficulty || 'medium'}`,
      `status:${game.status}`,
      ...(game.tags || []),
    ].filter(Boolean);
  }
}
```

---

## 🔌 **Phase 2: TTG Integration Services (Week 2)**

### **2.1 CLCA Ingestion Client (TTG Pattern)**

```typescript
// src/services/clca-ingest-service.ts
import { RateLimitService } from './rate-limit-service';
import { MonitoringService } from './monitoring-service';
import { logger } from 'src/utils/logger';
import type { ContentDoc } from '@org/contentdoc-schema';

export interface IngestResult {
  status: 'created' | 'updated' | 'noop';
  id: string;
  ingestRequestId?: string;
}

export class CLCAIngestService {
  private readonly CLCA_INGEST_URL = process.env.CLCA_INGEST_URL;
  private readonly JWT_SECRET = process.env.CLCA_JWT_SECRET;

  constructor(
    private rateLimitService = new RateLimitService(),
    private monitoringService = new MonitoringService(),
  ) {}

  async publishContent(contentDoc: ContentDoc): Promise<IngestResult> {
    const startTime = Date.now();

    try {
      // Rate limiting check
      const rateLimitResult = await this.rateLimitService.checkCLCAIngestLimit(
        contentDoc.ownerSystem,
      );

      if (!rateLimitResult.allowed) {
        throw new Error(`Rate limit exceeded. Retry after ${rateLimitResult.retryAfter}s`);
      }

      // Generate JWT token
      const jwt = await this.generateJWT();

      // Make request to CLCA
      const response = await fetch(`${this.CLCA_INGEST_URL}/api/ingest/content`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TTG-Quasar/1.0',
        },
        body: JSON.stringify(contentDoc),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ingestion failed: ${response.status} ${errorText}`);
      }

      const result: IngestResult = await response.json();
      const latency = Date.now() - startTime;

      // Track success
      this.monitoringService.trackCLCAIngestion({
        eventId: contentDoc.originalId || contentDoc.id,
        status: 'success',
        latency,
        resultStatus: result.status,
      });

      logger.info('Content published to CLCA successfully', {
        contentDocId: contentDoc.id,
        clcaId: result.id,
        status: result.status,
        latency,
      });

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      // Track error
      this.monitoringService.trackCLCAIngestionError(error as Error, {
        eventId: contentDoc.originalId || contentDoc.id,
        attempt: 1,
      });

      logger.error('Failed to publish content to CLCA', error as Error, {
        contentDocId: contentDoc.id,
        latency,
      });

      throw error;
    }
  }

  private async generateJWT(): Promise<string> {
    // Import jwt only when needed to avoid bundling issues
    const jwt = await import('jsonwebtoken');

    return jwt.sign(
      {
        scope: 'ingest:content',
        issuer: 'ttg',
        exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      },
      this.JWT_SECRET!,
    );
  }
}
```

### **2.2 Enhanced Events Firebase Store**

```typescript
// src/stores/events-firebase-store.ts (additions)
import { CLCAIngestService } from 'src/services/clca-ingest-service';
import { ContentDocMappingService } from 'src/services/contentdoc-mapping-service';
import { DeadLetterQueueService } from 'src/services/dead-letter-queue-service';
import { logger } from 'src/utils/logger';

export const useEventsFirebaseStore = defineStore('eventsFirebase', () => {
  // ... existing store code from current implementation

  // CLCA Integration Services
  const clcaIngestService = new CLCAIngestService();
  const contentDocMappingService = new ContentDocMappingService();
  const dlqService = new DeadLetterQueueService();

  // CLCA sync status tracking
  const clcaSyncStatus = ref<
    Map<
      string,
      {
        synced: boolean;
        syncedAt?: Date;
        error?: string;
      }
    >
  >(new Map());

  const publishEventToCLCA = async (eventId: string): Promise<void> => {
    const event = events.value.find((e) => e.id === eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    try {
      // Map to ContentDoc
      const contentDoc = await contentDocMappingService.mapEventToContentDoc(event);

      // Publish to CLCA
      const result = await clcaIngestService.publishContent(contentDoc);

      // Update sync status
      clcaSyncStatus.value.set(eventId, {
        synced: true,
        syncedAt: new Date(),
      });

      // Update event in Firestore with CLCA metadata
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        clcaSynced: true,
        clcaSyncedAt: serverTimestamp(),
        clcaContentId: result.id,
        updatedAt: serverTimestamp(),
      });

      logger.info('Event published to CLCA', { eventId, clcaId: result.id });
    } catch (error) {
      // Update sync status with error
      clcaSyncStatus.value.set(eventId, {
        synced: false,
        error: (error as Error).message,
      });

      // Add to dead letter queue for retry
      await dlqService.addToDLQ(
        await contentDocMappingService.mapEventToContentDoc(event),
        error as Error,
        { eventId, attempt: 1 },
      );

      throw error;
    }
  };

  const getCLCASyncStatus = computed(() => {
    return (eventId: string) => clcaSyncStatus.value.get(eventId);
  });

  // Enhanced createEvent method with automatic CLCA publishing
  const createEventWithCLCA = async (eventData: Partial<Event>): Promise<string> => {
    try {
      // Create event using existing method
      const eventId = await createEvent(eventData);

      // Get the created event
      const event = events.value.find((e) => e.id === eventId);
      if (event && event.status === 'upcoming') {
        // Automatically publish to CLCA for upcoming events
        await publishEventToCLCA(eventId);
      }

      return eventId;
    } catch (error) {
      logger.error('Failed to create event with CLCA sync', error as Error, { eventData });
      throw error;
    }
  };

  return {
    // ... existing exports
    publishEventToCLCA,
    getCLCASyncStatus,
    createEventWithCLCA,
  };
});
```

---

## 🛡️ **Phase 3: Security & Error Handling (Week 3)**

### **3.1 Dead Letter Queue Service (TTG Pattern)**

```typescript
// src/services/dead-letter-queue-service.ts
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { logger } from 'src/utils/logger';
import type { ContentDoc } from '@org/contentdoc-schema';

interface DLQEntry {
  contentDoc: ContentDoc;
  error: {
    message: string;
    stack?: string;
  };
  context: {
    eventId: string;
    attempt: number;
  };
  createdAt: Date;
  retryAfter: Date;
}

export class DeadLetterQueueService {
  private readonly DLQ_COLLECTION = 'clca_ingestion_dlq';
  private readonly MAX_RETRIES = 5;

  async addToDLQ(
    contentDoc: ContentDoc,
    error: Error,
    context: { eventId: string; attempt: number },
  ): Promise<void> {
    try {
      const dlqEntry: Omit<DLQEntry, 'id'> = {
        contentDoc,
        error: {
          message: error.message,
          stack: error.stack,
        },
        context,
        createdAt: serverTimestamp() as any,
        retryAfter: new Date(Date.now() + this.getRetryDelay(context.attempt)),
      };

      await addDoc(collection(db, this.DLQ_COLLECTION), dlqEntry);

      logger.info('Added to dead letter queue', {
        eventId: context.eventId,
        attempt: context.attempt,
      });
    } catch (dlqError) {
      logger.error('Failed to add to dead letter queue', dlqError as Error, {
        originalError: error.message,
        eventId: context.eventId,
      });
    }
  }

  async processDLQ(): Promise<void> {
    try {
      const dlqItems = await getDocs(
        query(
          collection(db, this.DLQ_COLLECTION),
          where('retryAfter', '<=', new Date()),
          limit(10),
        ),
      );

      for (const item of dlqItems.docs) {
        const data = item.data() as DLQEntry;

        if (data.context.attempt >= this.MAX_RETRIES) {
          logger.warn('Max retries exceeded, removing from DLQ', {
            eventId: data.context.eventId,
          });
          await deleteDoc(item.ref);
          continue;
        }

        try {
          const clcaIngestService = new (await import('./clca-ingest-service')).CLCAIngestService();
          await clcaIngestService.publishContent(data.contentDoc);

          // Success - remove from DLQ
          await deleteDoc(item.ref);

          logger.info('DLQ item processed successfully', {
            eventId: data.context.eventId,
          });
        } catch (error) {
          // Update retry info
          await updateDoc(item.ref, {
            'context.attempt': data.context.attempt + 1,
            retryAfter: new Date(Date.now() + this.getRetryDelay(data.context.attempt + 1)),
          });

          logger.warn('DLQ item retry failed', {
            eventId: data.context.eventId,
            attempt: data.context.attempt + 1,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process dead letter queue', error as Error);
    }
  }

  private getRetryDelay(attempt: number): number {
    // Exponential backoff: 1min, 2min, 4min, 8min, 16min
    return Math.min(60000 * Math.pow(2, attempt - 1), 960000); // Max 16 minutes
  }
}
```

### **3.2 Enhanced Monitoring Service**

```typescript
// src/services/monitoring-service.ts (additions)
export class MonitoringService {
  // ... existing code

  trackCLCAIngestion(event: {
    eventId: string;
    status: 'success' | 'failure' | 'retry';
    latency: number;
    error?: string;
    resultStatus?: string;
  }): void {
    this.trackEvent('clca_ingestion', {
      eventId: event.eventId,
      status: event.status,
      latency: event.latency,
      error: event.error,
      resultStatus: event.resultStatus,
    });

    // Track specific metrics for alerting
    if (event.status === 'failure') {
      this.trackEvent('clca_ingestion_failure', {
        eventId: event.eventId,
        error: event.error,
      });
    }

    if (event.latency > 5000) {
      // > 5 seconds
      this.trackEvent('clca_ingestion_slow', {
        eventId: event.eventId,
        latency: event.latency,
      });
    }
  }

  trackCLCAIngestionError(
    error: Error,
    context: {
      eventId: string;
      attempt: number;
    },
  ): void {
    this.trackError(error, 'clca_ingestion', {
      eventId: context.eventId,
      attempt: context.attempt,
      errorType: error.constructor.name,
    });
  }
}
```

---

## 🧪 **Phase 4: Testing & Validation (Week 4)**

### **4.1 Contract Testing (TTG Pattern)**

```typescript
// test/integration/clca-integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ContentDocMappingService } from 'src/services/contentdoc-mapping-service';
import { CLCAIngestService } from 'src/services/clca-ingest-service';
import { contentDocSchema } from '@org/contentdoc-schema';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createMockEvent } from '../mocks/event-mock';

describe('CLCA Integration Contract Tests', () => {
  let mappingService: ContentDocMappingService;
  let ingestService: CLCAIngestService;
  let ajv: Ajv;
  let validate: any;

  beforeEach(() => {
    mappingService = new ContentDocMappingService();
    ingestService = new CLCAIngestService();
    ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    validate = ajv.compile(contentDocSchema);
  });

  it('should generate valid ContentDoc from TTG event', async () => {
    const mockEvent = createMockEvent({
      title: 'Board Game Night',
      eventType: 'game_night',
      gameId: 'game-123',
      maxPlayers: 6,
    });

    const contentDoc = await mappingService.mapEventToContentDoc(mockEvent);
    const isValid = validate(contentDoc);

    expect(isValid).toBe(true);
    if (!isValid) {
      console.error('Validation errors:', validate.errors);
    }

    // Verify TTG-specific requirements
    expect(contentDoc.ownerSystem).toBe('ttg');
    expect(contentDoc.originalId).toBe(`event:${mockEvent.id}`);
    expect(contentDoc.tags).toContain('system:ttg');
    expect(contentDoc.tags).toContain('content-type:event');
    expect(contentDoc.features['feat:event/v1']).toBeDefined();
  });

  it('should handle events without games', async () => {
    const mockEvent = createMockEvent({
      title: 'Social Meetup',
      eventType: 'social',
      gameId: undefined,
    });

    const contentDoc = await mappingService.mapEventToContentDoc(mockEvent);
    const isValid = validate(contentDoc);

    expect(isValid).toBe(true);
    expect(contentDoc.features['feat:game/v1']).toBeUndefined();
  });

  it('should properly map RSVP summary', async () => {
    const mockEvent = createMockEvent({
      rsvps: [
        { status: 'confirmed', userId: 'user1' },
        { status: 'confirmed', userId: 'user2' },
        { status: 'declined', userId: 'user3' },
        { status: 'maybe', userId: 'user4' },
      ],
    });

    const contentDoc = await mappingService.mapEventToContentDoc(mockEvent);

    expect(contentDoc.rsvpSummary).toEqual({
      yes: 2,
      no: 1,
      maybe: 1,
      waitlist: 0,
      capacity: mockEvent.maxPlayers,
    });
  });
});
```

### **4.2 End-to-End Testing**

```typescript
// test/e2e/clca-integration-e2e.test.ts
import { describe, it, expect } from 'vitest';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { createTestEvent } from '../helpers/test-helpers';

describe('CLCA E2E Integration', () => {
  it('should successfully publish event to CLCA', async () => {
    const eventsStore = useEventsFirebaseStore();

    // Create test event
    const event = await createTestEvent({
      title: 'E2E Test Event',
      eventType: 'game_night',
    });

    // Publish to CLCA
    await eventsStore.publishEventToCLCA(event.id);

    // Verify sync status
    const syncStatus = eventsStore.getCLCASyncStatus(event.id);
    expect(syncStatus?.synced).toBe(true);
    expect(syncStatus?.syncedAt).toBeDefined();
  });

  it('should handle publication failures gracefully', async () => {
    const eventsStore = useEventsFirebaseStore();

    // Mock CLCA service to fail
    vi.mock('src/services/clca-ingest-service', () => ({
      CLCAIngestService: class {
        async publishContent() {
          throw new Error('Network error');
        }
      },
    }));

    const event = await createTestEvent();

    await expect(eventsStore.publishEventToCLCA(event.id)).rejects.toThrow('Network error');

    // Verify error is tracked
    const syncStatus = eventsStore.getCLCASyncStatus(event.id);
    expect(syncStatus?.synced).toBe(false);
    expect(syncStatus?.error).toBe('Network error');
  });
});
```

---

## 🎨 **Phase 5: UI Components (Week 5)**

### **5.1 CLCA Sync Status Component (Quasar Pattern)**

```vue
<!-- src/components/events/CLCASyncStatus.vue -->
<template>
  <q-card flat bordered class="clca-sync-status">
    <q-card-section>
      <div class="row items-center q-gutter-sm">
        <q-icon :name="syncIcon" :color="syncColor" size="sm" :aria-label="$t('clca.syncStatus')" />

        <div class="col">
          <div class="text-body2 text-weight-medium">
            {{ $t('clca.newsletterSync') }}
          </div>
          <div class="text-caption text-grey-6">
            {{ syncStatusText }}
          </div>
        </div>

        <q-btn
          v-if="canRetry"
          flat
          dense
          icon="refresh"
          :loading="syncing"
          :aria-label="$t('clca.retrySync')"
          @click="retrySync"
        >
          <q-tooltip>{{ $t('clca.retrySync') }}</q-tooltip>
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useQuasar } from 'quasar';

interface Props {
  eventId: string;
}

const props = defineProps<Props>();
const { t } = useI18n();
const $q = useQuasar();
const eventsStore = useEventsFirebaseStore();

const syncing = ref(false);

// Computed properties for sync status
const syncStatus = computed(() => eventsStore.getCLCASyncStatus(props.eventId));

const syncIcon = computed(() => {
  if (!syncStatus.value) return 'help_outline';
  if (syncStatus.value.synced) return 'cloud_done';
  if (syncStatus.value.error) return 'cloud_off';
  return 'cloud_queue';
});

const syncColor = computed(() => {
  if (!syncStatus.value) return 'grey-5';
  if (syncStatus.value.synced) return 'positive';
  if (syncStatus.value.error) return 'negative';
  return 'warning';
});

const syncStatusText = computed(() => {
  if (!syncStatus.value) {
    return t('clca.notSynced');
  }
  if (syncStatus.value.synced && syncStatus.value.syncedAt) {
    return t('clca.syncedAt', {
      date: syncStatus.value.syncedAt.toLocaleString(),
    });
  }
  if (syncStatus.value.error) {
    return t('clca.syncError', { error: syncStatus.value.error });
  }
  return t('clca.syncPending');
});

const canRetry = computed(() => {
  return syncStatus.value?.error && !syncing.value;
});

// Actions
const retrySync = async (): Promise<void> => {
  syncing.value = true;

  try {
    await eventsStore.publishEventToCLCA(props.eventId);

    $q.notify({
      type: 'positive',
      message: t('clca.syncSuccess'),
      icon: 'cloud_done',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('clca.syncFailed'),
      caption: (error as Error).message,
      icon: 'cloud_off',
    });
  } finally {
    syncing.value = false;
  }
};
</script>
```

### **5.2 Admin CLCA Management Component**

```vue
<!-- src/components/admin/CLCAManagement.vue -->
<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon name="cloud_sync" class="q-mr-sm" />
        {{ $t('admin.clcaIntegration') }}
      </div>

      <!-- Sync Statistics -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4 text-positive">{{ syncStats.synced }}</div>
              <div class="text-caption">{{ $t('admin.eventsSynced') }}</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4 text-negative">{{ syncStats.failed }}</div>
              <div class="text-caption">{{ $t('admin.syncFailures') }}</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4 text-warning">{{ dlqCount }}</div>
              <div class="text-caption">{{ $t('admin.dlqItems') }}</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4">{{ syncStats.lastSync }}</div>
              <div class="text-caption">{{ $t('admin.lastSync') }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Actions -->
      <div class="row q-gutter-sm">
        <q-btn
          color="primary"
          icon="cloud_sync"
          :label="$t('admin.syncAllEvents')"
          :loading="bulkSyncing"
          @click="syncAllEvents"
        />

        <q-btn
          color="warning"
          icon="refresh"
          :label="$t('admin.processDLQ')"
          :loading="processingDLQ"
          @click="processDLQ"
        />

        <q-btn flat icon="settings" :label="$t('admin.clcaSettings')" @click="openSettings" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { DeadLetterQueueService } from 'src/services/dead-letter-queue-service';

const { t } = useI18n();
const $q = useQuasar();
const eventsStore = useEventsFirebaseStore();
const dlqService = new DeadLetterQueueService();

const bulkSyncing = ref(false);
const processingDLQ = ref(false);
const dlqCount = ref(0);

// Computed sync statistics
const syncStats = computed(() => {
  const events = eventsStore.events;
  const syncStatuses = events.map((e) => eventsStore.getCLCASyncStatus(e.id));

  return {
    synced: syncStatuses.filter((s) => s?.synced).length,
    failed: syncStatuses.filter((s) => s?.error).length,
    lastSync:
      syncStatuses
        .filter((s) => s?.syncedAt)
        .sort((a, b) => b!.syncedAt!.getTime() - a!.syncedAt!.getTime())[0]
        ?.syncedAt?.toLocaleString() || t('common.never'),
  };
});

// Actions
const syncAllEvents = async (): Promise<void> => {
  bulkSyncing.value = true;

  try {
    const events = eventsStore.events.filter((e) => e.status === 'upcoming');
    let successCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        await eventsStore.publishEventToCLCA(event.id);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    $q.notify({
      type: successCount > errorCount ? 'positive' : 'warning',
      message: t('admin.bulkSyncComplete'),
      caption: t('admin.bulkSyncResults', { success: successCount, errors: errorCount }),
    });
  } finally {
    bulkSyncing.value = false;
  }
};

const processDLQ = async (): Promise<void> => {
  processingDLQ.value = true;

  try {
    await dlqService.processDLQ();

    $q.notify({
      type: 'positive',
      message: t('admin.dlqProcessed'),
      icon: 'refresh',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('admin.dlqProcessFailed'),
      caption: (error as Error).message,
    });
  } finally {
    processingDLQ.value = false;
  }
};

const openSettings = (): void => {
  $q.dialog({
    title: t('admin.clcaSettings'),
    message: t('admin.clcaSettingsDesc'),
    ok: t('common.close'),
  });
};

onMounted(async () => {
  // Load DLQ count (implement in service)
  // dlqCount.value = await dlqService.getDLQCount();
});
</script>
```

---

## 📋 **Implementation Checklist**

### **Week 1: Foundation**

- [ ] Create `@org/contentdoc-schema` package with TypeScript strict mode
- [ ] Implement `ContentDocMappingService` following TTG patterns
- [ ] Set up JWT authentication with Secret Manager
- [ ] Create `CLCAIngestService` with rate limiting

### **Week 2: Integration**

- [ ] Enhance `events-firebase-store.ts` with CLCA methods
- [ ] Implement Cloud Function triggers (optional)
- [ ] Set up dead letter queue service
- [ ] Add retry logic with exponential backoff

### **Week 3: Security & Monitoring**

- [ ] Configure Secret Manager integration
- [ ] Enhance monitoring service with CLCA metrics
- [ ] Implement comprehensive error handling
- [ ] Set up alerting for failure rates

### **Week 4: Testing**

- [ ] Write contract tests with AJV schema validation
- [ ] Implement E2E tests using Vitest
- [ ] Performance testing for ingestion latency
- [ ] Security validation of JWT flow

### **Week 5: UI Components**

- [ ] Create `CLCASyncStatus.vue` component (Quasar-only)
- [ ] Build admin management interface
- [ ] Add internationalization keys
- [ ] Ensure accessibility compliance

### **Week 6: Deployment**

- [ ] Configure environment variables
- [ ] Set up feature flags for gradual rollout
- [ ] Deploy to staging environment
- [ ] Production deployment with monitoring

---

## 🎯 **Success Metrics**

- **Ingestion Success Rate**: >99%
- **Processing Latency**: <2 seconds (p95)
- **Error Rate**: <1%
- **Schema Validation**: 100% (all payloads valid)
- **UI Accessibility**: WCAG 2.1 AA compliance
- **Test Coverage**: >95% for new integration code

---

## 🔧 **TTG Development Guidelines**

### **Code Quality Standards**

- All TypeScript code must compile with strict mode
- Use Quasar components exclusively (`q-*`)
- Follow Vue 3 Composition API patterns
- Implement proper error handling and logging
- Keep service files under 300 lines
- Use dependency injection for testability

### **Accessibility Requirements**

- Proper ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance (WCAG AA)
- Focus management in modal dialogs

### **Performance Considerations**

- Lazy load components where appropriate
- Use computed properties for derived state
- Implement proper caching strategies
- Monitor bundle size impact
- Optimize Firebase queries

---

## 🔄 **Legacy Code Migration & Removal Plan**

### **Critical: Complete Migration to ContentDoc Architecture**

As part of this integration, **ALL legacy event and game management code must be migrated to the new ContentDoc architecture**. This ensures consistency, eliminates technical debt, and provides a unified content management system.

### **Legacy Systems to Remove/Update**

#### **1. Event Submission Service Migration**

**Current Legacy:** `src/services/event-submission-service.ts`

- Uses legacy `EventSubmission` model with separate approval workflow
- Dual workflow: submissions → approval → events
- Manual notification system
- Separate `eventSubmissions` collection

**New ContentDoc Approach:**

```typescript
// Replace event-submission-service.ts with contentdoc-event-service.ts
export class ContentDocEventService {
  constructor(
    private mappingService = new ContentDocMappingService(),
    private clcaIngestService = new CLCAIngestService(),
    private validationService = new ValidationService(),
    private eventsStore = useEventsFirebaseStore(),
  ) {}

  async createEvent(eventData: CreateEventData): Promise<string> {
    // 1. Create event directly in events collection (no submission step)
    const eventId = await this.eventsStore.createEventWithCLCA(eventData);

    // 2. Get the created event and map to ContentDoc
    const event = this.eventsStore.events.find((e) => e.id === eventId);
    if (!event) throw new Error('Event creation failed');

    const contentDoc = await this.mappingService.mapEventToContentDoc(event);

    // 3. Automatically push to CLCA (no manual approval needed)
    await this.clcaIngestService.publishContent(contentDoc);

    // 4. Sync to Google Calendar (existing service)
    await this.syncToCalendar(event);

    return eventId;
  }

  // REMOVE: All approval workflow - events are created directly
  // REMOVE: Separate submission/published states - use Event.status
  // REMOVE: eventSubmissions collection entirely
}
```

#### **2. Events Firebase Store Consolidation**

**Legacy Issues:**

- Dual event creation paths (direct + submission)
- Mixed data models (Event vs EventSubmission)
- Inconsistent status management
- Separate approval workflows

**ContentDoc Migration:**

```typescript
// Update src/stores/events-firebase-store.ts
export const useEventsFirebaseStore = defineStore('eventsFirebase', () => {
  // REMOVE: Legacy event creation methods that use submissions
  // REMOVE: Separate submission tracking
  // REMOVE: Manual approval workflows

  // ADD: ContentDoc-based event management
  const contentDocService = new ContentDocEventService();

  const createEventAsContentDoc = async (eventData: Partial<Event>): Promise<string> => {
    // Single path for all event creation - no submissions, direct to events collection
    return await contentDocService.createEvent(eventData);
  };

  const updateEventContentDoc = async (eventId: string, updates: Partial<Event>): Promise<void> => {
    // Update local Firebase
    await updateEvent(eventId, updates);

    // Auto-sync to CLCA if event is published
    const event = events.value.find((e) => e.id === eventId);
    if (event && event.status === 'upcoming') {
      await publishEventToCLCA(eventId);
    }
  };

  // ENHANCE: Existing RSVP methods to work with ContentDoc structure
  // ENHANCE: Status management to sync with CLCA
});
```

#### **3. Game Management Consolidation**

**Legacy Issues:**

- Separate game submission workflow
- Manual approval process
- Inconsistent data models
- Dual creation paths (direct + submission)

**ContentDoc Migration:**

```typescript
// Update src/stores/games-firebase-store.ts
export const useGamesFirebaseStore = defineStore('gamesFirebase', () => {
  // REMOVE: Legacy submitGame method
  // REMOVE: Manual approval workflow
  // REMOVE: Separate submission collection
  // REMOVE: Dual creation paths

  // ADD: ContentDoc-based game management
  const createGameAsContentDoc = async (gameData: Partial<Game>): Promise<string> => {
    // Create game directly in games collection
    const gameId = await addGame(gameData);

    // Map to ContentDoc and publish to CLCA if approved
    const game = games.value.find((g) => g.id === gameId);
    if (game && game.approved) {
      const contentDoc = await contentDocMappingService.mapGameToContentDoc(game);
      await clcaIngestService.publishContent(contentDoc);
    }

    return gameId;
  };

  // ENHANCE: Existing addGame method to support CLCA publishing
  // ENHANCE: Approval workflow to trigger CLCA sync
});
```

#### **4. Notification System Updates**

**Legacy:** `src/services/game-event-notification-service.ts`

- Coupled to old Event model
- Manual notification triggers

**ContentDoc Migration:**

```typescript
// Update game-event-notification-service.ts
export class ContentDocNotificationService {
  async notifyUsersAboutContentDoc(
    contentDoc: ContentDoc,
    notificationType: 'new_content' | 'content_update',
  ): Promise<void> {
    // Extract game/event info from ContentDoc features
    const eventFeature = contentDoc.features['feat:event/v1'];
    const gameFeature = contentDoc.features['feat:game/v1'];

    if (eventFeature && gameFeature) {
      // Handle game event notifications using ContentDoc data
      await this.notifyGameEventUsers(contentDoc, eventFeature, gameFeature);
    }
  }

  // REMOVE: Legacy Event/Game model dependencies
  // ADD: ContentDoc-aware notification logic
}
```

### **Files to Modify/Remove**

#### **Remove Completely:**

- `src/services/event-submission-service.ts` ❌
- `src/stores/events-store.ts` (legacy non-Firebase store) ❌
- `src/stores/messages-store.ts` (legacy non-Firebase store) ❌
- `src/stores/players-store.ts` (legacy non-Firebase store) ❌
- Any remaining non-Firebase stores ❌
- `eventSubmissions` Firestore collection ❌
- `gameSubmissions` Firestore collection ❌

#### **Major Refactoring Required:**

- `src/stores/events-firebase-store.ts` ✏️
  - Remove dual creation paths
  - Implement ContentDoc methods
  - Remove legacy approval workflows
  - Add CLCA integration methods
- `src/stores/games-firebase-store.ts` ✏️
  - Consolidate submission and creation flows
  - Implement ContentDoc mapping
  - Remove manual approval steps
  - Add CLCA integration methods

- `src/services/game-event-notification-service.ts` ✏️
  - Update to use ContentDoc structure
  - Remove Event/Game model dependencies
  - Add ContentDoc-aware notifications

- `src/services/ttg-event-sync-service.ts` ✏️
  - Update to work with ContentDoc events
  - Remove legacy Event model dependencies
  - Integrate with CLCA publishing

#### **Component Updates Required:**

- All event creation forms → Use new ContentDoc creation
- Admin approval interfaces → Remove or simplify to ContentDoc status updates
- Event display components → Work with ContentDoc structure
- RSVP components → Extract data from ContentDoc.rsvpSummary

### **Migration Timeline**

#### **Week 1: Foundation + Cleanup**

- [ ] Implement ContentDoc services (`ContentDocMappingService`, `CLCAIngestService`)
- [ ] Remove `event-submission-service.ts`
- [ ] Remove all legacy non-Firebase stores (`events-store.ts`, `messages-store.ts`, `players-store.ts`)
- [ ] Update imports across codebase
- [ ] Create dead letter queue service

#### **Week 2: Store Migration**

- [ ] Refactor `events-firebase-store.ts` for ContentDoc
- [ ] Refactor `games-firebase-store.ts` for ContentDoc
- [ ] Update notification service for ContentDoc
- [ ] Test store functionality
- [ ] Add CLCA integration methods to stores

#### **Week 3: Component Updates**

- [ ] Update event creation forms to use new ContentDoc creation
- [ ] Update admin interfaces to remove approval workflows
- [ ] Update display components to work with ContentDoc structure
- [ ] Remove approval workflow UIs
- [ ] Add CLCA sync status components

#### **Week 4: Integration Testing**

- [ ] End-to-end testing of new flows
- [ ] Performance validation
- [ ] CLCA integration testing
- [ ] Data migration scripts for existing events/games
- [ ] Clean up legacy Firestore collections

### **Data Migration Strategy**

#### **Existing Event Data**

```typescript
// Migration script for existing events
export class EventDataMigrator {
  constructor(
    private eventsStore = useEventsFirebaseStore(),
    private mappingService = new ContentDocMappingService(),
    private clcaIngestService = new CLCAIngestService(),
  ) {}

  async migrateEventsToContentDoc(): Promise<void> {
    // 1. Read existing events from Firebase
    const events = await this.eventsStore.events;

    // 2. Convert to ContentDoc format and push to CLCA
    for (const event of events) {
      try {
        const contentDoc = await this.mappingService.mapEventToContentDoc(event);

        // 3. Push to CLCA if event is published/upcoming
        if (contentDoc.status === 'published') {
          await this.clcaIngestService.publishContent(contentDoc);
        }
      } catch (error) {
        logger.error('Failed to migrate event to ContentDoc', error as Error, {
          eventId: event.id,
        });
      }
    }
  }
}
```

#### **EventSubmission Collection Cleanup**

```typescript
// Clean up legacy eventSubmissions collection
export class SubmissionCleanupService {
  async cleanupLegacySubmissions(): Promise<void> {
    // 1. Migrate approved submissions to events collection
    const submissions = await this.getEventSubmissions();

    for (const submission of submissions) {
      if (submission.status === 'approved') {
        // Convert submission to event and create in events collection
        const eventData = this.convertSubmissionToEvent(submission);
        await this.eventsStore.createEventWithCLCA(eventData);
      }
    }

    // 2. Delete eventSubmissions collection
    await this.deleteEventSubmissionsCollection();
  }
}
```

### **Testing Legacy Removal**

#### **Validation Checklist:**

- [ ] No references to removed services exist (`event-submission-service.ts`, legacy stores)
- [ ] All imports updated to new ContentDoc services
- [ ] No legacy data models in use (`EventSubmission`, `GameSubmission`)
- [ ] All event/game operations use ContentDoc format
- [ ] CLCA integration works with all content types
- [ ] Google Calendar sync works with ContentDoc events
- [ ] Notifications work with ContentDoc structure
- [ ] All Firebase stores use `*-firebase-store.ts` pattern
- [ ] No non-Firebase stores remain
- [ ] Legacy Firestore collections cleaned up

#### **Performance Verification:**

- [ ] ContentDoc operations are as fast as legacy
- [ ] No memory leaks from old service references
- [ ] Bundle size reduced (removed code)
- [ ] Database queries optimized for ContentDoc structure
- [ ] CLCA ingestion latency < 2 seconds
- [ ] Dead letter queue processing efficient

#### **Security Verification:**

- [ ] All ContentDoc data properly validated
- [ ] JWT authentication working for CLCA
- [ ] No sensitive data in CLCA payloads
- [ ] Rate limiting prevents abuse
- [ ] Error handling doesn't expose internals

This comprehensive migration ensures **zero legacy code remains** and all TTG features work through the unified ContentDoc architecture, providing consistency and enabling seamless CLCA integration while maintaining TTG's production-ready security and performance standards.

---

This comprehensive guide provides everything needed to implement the TTG ↔ CLCA integration while maintaining TTG's architectural principles and code quality standards.
