Based on the comprehensive implementations you've provided, I'll update my plan to incorporate the best practices and detailed specifications from both documents. Here's my refined integration plan:

# TTG ↔ CLCA Integration Plan - Final Implementation

## �� **Executive Summary**

This plan implements a **one-way push integration** from TTG Quasar to CLCA Courier, adopting the ContentDoc architecture with enhanced security, monitoring, and operational excellence. The integration enables gaming events from TTG to be visible in CLCA's community newsletter while maintaining system autonomy.

## ��️ **Architecture Overview**

```
TTG Quasar (Firebase Project A)
├── Event/Game Creation → ContentDoc Mapping
├── JWT Authentication → Secret Manager
├── POST /api/ingest/content → CLCA
└── Dead Letter Queue → Failed Retries

CLCA Courier (Firebase Project B)
├── JWT Validation → Secret Manager
├── ContentDoc Validation → JSON Schema
├── Idempotency Check → ownerSystem + originalId
├── Moderation Queue → Trust Policy
└── Public API → Newsletter Generation
```

## �� **Phase 1: Foundation & Schema Package (Week 1)**

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

**Key Features:**

- TypeScript interfaces with strict typing
- JSON Schema validation with AJV
- Versioned features (`feat:event/v1`, `feat:game/v1`)
- Sample fixtures for testing
- Comprehensive validation scripts

### **1.2 TTG ContentDoc Integration**

**New Services to Add:**

```typescript
// src/services/contentdoc-mapping-service.ts
export class ContentDocMappingService {
  async mapEventToContentDoc(event: Event): Promise<ContentDoc> {
    return {
      id: `ttg:event:${event.id}`,
      title: event.title,
      description: event.description,
      status: event.status === 'upcoming' ? 'published' : 'archived',
      tags: [
        'content-type:event',
        'system:ttg',
        `event-type:${event.eventType}`,
        `game-id:${event.gameId}`,
        `game-genre:${event.game?.genre}`,
      ],
      features: {
        'feat:event/v1': {
          startTime: event.startDate + 'T' + event.startTime + 'Z',
          endTime: event.endDate + 'T' + event.endTime + 'Z',
          location: event.location,
          minPlayers: event.minPlayers,
          maxPlayers: event.maxPlayers,
        },
        'feat:game/v1': event.gameId
          ? {
              gameId: event.gameId,
              gameName: event.gameName,
              genre: event.game?.genre,
              playerCount: event.maxPlayers,
            }
          : undefined,
      },
      rsvpSummary: {
        yes: event.rsvps.filter((r) => r.status === 'confirmed').length,
        no: event.rsvps.filter((r) => r.status === 'declined').length,
        maybe: event.rsvps.filter((r) => r.status === 'maybe').length,
        capacity: event.maxPlayers,
      },
      images: event.images?.map((img) => ({
        url: img.url,
        caption: img.caption,
        width: img.width,
        height: img.height,
      })),
      ownerSystem: 'ttg',
      originalId: `event:${event.id}`,
      ownerUrl: `https://ttg.example.com/events/${event.id}`,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}
```

**CLCA Ingestion Client:**

```typescript
// src/services/clca-ingest-service.ts
export class CLCAIngestService {
  private readonly CLCA_INGEST_URL = process.env.CLCA_INGEST_URL;
  private readonly JWT_SECRET = process.env.CLCA_JWT_SECRET;

  async publishContent(contentDoc: ContentDoc): Promise<IngestResult> {
    const jwt = this.generateJWT();

    const response = await fetch(`${this.CLCA_INGEST_URL}/api/ingest/content`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contentDoc),
    });

    if (!response.ok) {
      throw new Error(`Ingestion failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private generateJWT(): string {
    return jwt.sign(
      {
        scope: 'ingest:content',
        issuer: 'ttg',
        exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      },
      this.JWT_SECRET,
    );
  }
}
```

## �� **Phase 2: TTG Integration Implementation (Week 2)**

### **2.1 Event Trigger Integration**

**Cloud Function for Event Updates:**

```typescript
// functions/src/event-ingestion.ts
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { ContentDocMappingService } from '../services/contentdoc-mapping-service';
import { CLCAIngestService } from '../services/clca-ingest-service';

export const onEventUpdate = onDocumentWritten('events/{eventId}', async (event) => {
  const eventData = event.data?.after.data();
  if (!eventData) return;

  // Only process published events
  if (eventData.status !== 'upcoming') return;

  const mappingService = new ContentDocMappingService();
  const ingestService = new CLCAIngestService();

  try {
    const contentDoc = await mappingService.mapEventToContentDoc(eventData);
    const result = await ingestService.publishContent(contentDoc);

    console.log(`Event ${eventData.id} ingested successfully: ${result.id}`);
  } catch (error) {
    console.error(`Failed to ingest event ${eventData.id}:`, error);

    // Add to dead letter queue for retry
    await addToDeadLetterQueue(eventData, error);
  }
});
```

### **2.2 Store Integration**

**Enhanced Events Store:**

```typescript
// src/stores/events-firebase-store.ts (additions)
export const useEventsFirebaseStore = defineStore('events-firebase', () => {
  // ... existing code

  const publishEventToCLCA = async (eventId: string): Promise<void> => {
    const event = getEventById(eventId);
    if (!event) throw new Error('Event not found');

    const mappingService = new ContentDocMappingService();
    const ingestService = new CLCAIngestService();

    try {
      const contentDoc = await mappingService.mapEventToContentDoc(event);
      await ingestService.publishContent(contentDoc);

      // Update event with CLCA sync status
      await updateEvent(eventId, {
        clcaSynced: true,
        clcaSyncedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to publish event to CLCA:', error);
      throw error;
    }
  };

  return {
    // ... existing exports
    publishEventToCLCA,
  };
});
```

## 🛡️ **Phase 3: Security & Authentication (Week 3)**

### **3.1 JWT Authentication Setup**

**Secret Manager Integration:**

```typescript
// src/services/jwt-service.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export class JWTService {
  private client = new SecretManagerServiceClient();
  private secretCache = new Map<string, string>();

  async getSecret(secretName: string): Promise<string> {
    if (this.secretCache.has(secretName)) {
      return this.secretCache.get(secretName)!;
    }

    const [version] = await this.client.accessSecretVersion({
      name: `projects/${process.env.FIREBASE_PROJECT_ID}/secrets/${secretName}/versions/latest`,
    });

    const secret = version.payload?.data?.toString();
    if (!secret) throw new Error(`Secret ${secretName} not found`);

    this.secretCache.set(secretName, secret);
    return secret;
  }

  async generateIngestJWT(): Promise<string> {
    const secret = await this.getSecret('clca-ingest-jwt-secret');

    return jwt.sign(
      {
        scope: 'ingest:content',
        issuer: 'ttg',
        exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      },
      secret,
    );
  }
}
```

### **3.2 Rate Limiting & Monitoring**

**Enhanced Rate Limiting:**

```typescript
// src/services/rate-limit-service.ts (additions)
export class RateLimitService {
  // ... existing code

  addCLCAIngestConfig(): void {
    this.addConfig('clca-ingest', {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      keyGenerator: (userId: string) => `clca-ingest:${userId}`,
    });
  }

  async checkCLCAIngestLimit(userId: string): Promise<RateLimitResult> {
    return this.isAllowed('clca-ingest', userId);
  }
}
```

## 📊 **Phase 4: Monitoring & Observability (Week 4)**

### **4.1 Enhanced Monitoring Service**

**CLCA Integration Monitoring:**

```typescript
// src/services/monitoring-service.ts (additions)
export class MonitoringService {
  // ... existing code

  trackCLCAIngestion(event: {
    eventId: string;
    status: 'success' | 'failure' | 'retry';
    latency: number;
    error?: string;
  }): void {
    this.trackEvent('clca_ingestion', {
      eventId: event.eventId,
      status: event.status,
      latency: event.latency,
      error: event.error,
    });
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
    });
  }
}
```

### **4.2 Dead Letter Queue**

**Failed Request Handling:**

```typescript
// src/services/dead-letter-queue-service.ts
export class DeadLetterQueueService {
  private readonly DLQ_COLLECTION = 'clca_ingestion_dlq';

  async addToDLQ(
    contentDoc: ContentDoc,
    error: Error,
    context: {
      eventId: string;
      attempt: number;
    },
  ): Promise<void> {
    await addDoc(collection(db, this.DLQ_COLLECTION), {
      contentDoc,
      error: {
        message: error.message,
        stack: error.stack,
      },
      context,
      createdAt: serverTimestamp(),
      retryAfter: new Date(Date.now() + this.getRetryDelay(context.attempt)),
    });
  }

  async processDLQ(): Promise<void> {
    const dlqItems = await getDocs(
      query(collection(db, this.DLQ_COLLECTION), where('retryAfter', '<=', new Date()), limit(10)),
    );

    for (const item of dlqItems.docs) {
      const data = item.data();
      try {
        await this.retryIngestion(data.contentDoc);
        await deleteDoc(item.ref);
      } catch (error) {
        await updateDoc(item.ref, {
          attempt: data.context.attempt + 1,
          retryAfter: new Date(Date.now() + this.getRetryDelay(data.context.attempt + 1)),
        });
      }
    }
  }

  private getRetryDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 300000); // Max 5 minutes
  }
}
```

## 🧪 **Phase 5: Testing & Validation (Week 5)**

### **5.1 Contract Testing**

**Schema Validation Tests:**

```typescript
// test/contract/clca-integration.test.ts
import { describe, it, expect } from 'vitest';
import { ContentDocMappingService } from 'src/services/contentdoc-mapping-service';
import { contentDocSchema } from '@org/contentdoc-schema';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

describe('CLCA Integration Contract Tests', () => {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(contentDocSchema);

  it('should generate valid ContentDoc from TTG event', async () => {
    const mappingService = new ContentDocMappingService();
    const mockEvent = createMockEvent();

    const contentDoc = await mappingService.mapEventToContentDoc(mockEvent);
    const isValid = validate(contentDoc);

    expect(isValid).toBe(true);
    if (!isValid) {
      console.error('Validation errors:', validate.errors);
    }
  });

  it('should handle all required fields', () => {
    const contentDoc = createValidContentDoc();
    const isValid = validate(contentDoc);

    expect(isValid).toBe(true);
    expect(contentDoc.ownerSystem).toBe('ttg');
    expect(contentDoc.originalId).toMatch(/^event:/);
  });
});
```

### **5.2 End-to-End Testing**

**Integration Test Suite:**

```typescript
// test/integration/clca-e2e.test.ts
describe('CLCA E2E Integration', () => {
  it('should successfully ingest event from TTG to CLCA', async () => {
    // 1. Create event in TTG
    const event = await createTestEvent();

    // 2. Trigger ingestion
    await publishEventToCLCA(event.id);

    // 3. Verify in CLCA API
    const clcaContent = await fetchCLCAContent(event.id);
    expect(clcaContent).toBeDefined();
    expect(clcaContent.ownerSystem).toBe('ttg');
    expect(clcaContent.originalId).toBe(`event:${event.id}`);
  });

  it('should handle idempotency correctly', async () => {
    const event = await createTestEvent();

    // First ingestion
    await publishEventToCLCA(event.id);

    // Second ingestion (should be noop)
    const result = await publishEventToCLCA(event.id);
    expect(result.status).toBe('noop');
  });
});
```

## 🚀 **Phase 6: Deployment & Go-Live (Week 6)**

### **6.1 Environment Configuration**

**Environment Variables:**

```env
# TTG Environment
CLCA_INGEST_URL=https://clca-ingest.example.com
CLCA_JWT_SECRET=projects/ttg-project/secrets/clca-ingest-jwt-secret
CLCA_RATE_LIMIT_ENABLED=true
CLCA_INGESTION_ENABLED=true

# Monitoring
CLCA_MONITORING_ENABLED=true
CLCA_DLQ_ENABLED=true
```

### **6.2 Feature Flags**

**Gradual Rollout:**

```typescript
// src/services/feature-flag-service.ts
export class FeatureFlagService {
  async isCLCAIngestionEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return config.clcaIngestionEnabled && config.clcaIngestionPercentage > Math.random() * 100;
  }

  async getCLCAIngestionPercentage(): Promise<number> {
    const config = await this.getConfig();
    return config.clcaIngestionPercentage || 0;
  }
}
```

## �� **Implementation Checklist**

### **Week 1: Foundation**

- [ ] Create `@org/contentdoc-schema` package
- [ ] Implement ContentDoc mapping service
- [ ] Set up JWT authentication
- [ ] Create CLCA ingestion client

### **Week 2: Integration**

- [ ] Implement Cloud Function triggers
- [ ] Add store integration methods
- [ ] Set up dead letter queue
- [ ] Implement retry logic

### **Week 3: Security**

- [ ] Configure Secret Manager
- [ ] Implement rate limiting
- [ ] Add monitoring and alerting
- [ ] Set up error handling

### **Week 4: Testing**

- [ ] Write contract tests
- [ ] Implement E2E tests
- [ ] Performance testing
- [ ] Security validation

### **Week 5: Deployment**

- [ ] Staging deployment
- [ ] Feature flag configuration
- [ ] Monitoring setup
- [ ] Documentation

### **Week 6: Go-Live**

- [ ] Production deployment
- [ ] Gradual rollout
- [ ] Monitoring validation
- [ ] Support documentation

## �� **Success Metrics**

- **Ingestion Success Rate**: >99%
- **Processing Latency**: <2 seconds (p95)
- **Error Rate**: <1%
- **Idempotency**: 100% (no duplicates)
- **Schema Validation**: 100% (all payloads valid)

This plan provides a comprehensive, production-ready integration that maintains TTG's autonomy while enabling rich content sharing with CLCA. The phased approach ensures minimal risk while delivering maximum value.
