# Updated Comprehensive Plan: TTG → CLCA One-Way Integration

## Executive Summary

This updated plan refines the one-way integration from TTG Quasar to CLCA Courier, incorporating your feedback and our agreed-upon enhancements. The integration will enable game events from TTG to be visible on CLCA while maintaining system autonomy, security, and scalability.

## Key Changes from Original Plan

- **Authentication**: Enhanced with short-lived JWTs and Secret Manager integration
- **Error Handling**: Added dead-letter queue and improved logging
- **Moderation**: Configurable trust policy with webhook notifications
- **APIs**: Enhanced filtering and pagination for CLCA's public API
- **Testing**: Added end-to-end tests and contract validation
- **Documentation**: Expanded with sequence diagrams and code examples

## Phase 1: Foundation & Schema Definition (Week 0-1)

### Deliverables:

1. **Shared Schema Package (`@org/contentdoc-schema`)**
   - TypeScript interfaces for `ContentDoc`, `FeatEventV1`, `FeatGameV1`
   - JSON Schema for validation
   - Sample fixtures for testing
   - Documentation on usage and extension

2. **CLCA Ingestion API Skeleton**
   - Cloud Run service structure
   - Basic authentication middleware
   - Project setup with Dockerfile and deployment config

### Implementation Details:

**Schema Package Structure:**

```
@org/contentdoc-schema/
├── package.json
├── src/
│   ├── index.ts (exports all types)
│   ├── contentdoc.ts (main interface)
│   ├── features/
│   │   ├── event-v1.ts
│   │   └── game-v1.ts
│   └── validation/
│       └── schema.json (JSON Schema)
├── test/
│   └── fixtures.ts (sample data)
└── README.md (usage instructions)
```

**CLCA Cloud Run Skeleton:**

- Dockerfile with Node.js runtime
- package.json with dependencies for Express, Firebase Admin, JWT validation
- Basic server setup with health check endpoint
- Environment configuration for secrets and Firebase project

## Phase 2: CLCA Ingestion Implementation (Week 2-3)

### Deliverables:

1. **Complete Ingestion Endpoint** (`POST /api/ingest/content`)
   - JWT authentication with Secret Manager integration
   - Payload validation against JSON Schema
   - Idempotency handling with `ownerSystem + originalId`
   - Moderation workflow with configurable trust policy
   - Comprehensive error handling and logging

2. **Public Read API** (`GET /api/content/published`)
   - Filtering by tags, content-type, date ranges
   - Cursor-based pagination with metadata
   - Caching implementation with CDN or Redis

3. **Admin Endpoints**
   - Moderation queue management
   - Status update endpoints with webhook notifications to TTG

### Implementation Details:

**JWT Authentication Flow:**

1. TTG generates JWT using private key from Secret Manager
2. CLCA validates JWT using public key from Secret Manager
3. Tokens include scope claims (`ingest:content`) and expiration (short-lived)

**Idempotency Implementation:**

```typescript
// Pseudo-code for idempotency check
async function handleIngestion(payload: ContentDoc) {
  const existingDoc = await firestore
    .collection('content')
    .where('ownerSystem', '==', payload.ownerSystem)
    .where('originalId', '==', payload.originalId)
    .limit(1)
    .get();

  if (existingDoc.empty) {
    // Create new document
    return createContent(payload);
  } else {
    // Compare updatedAt with tolerance for clock skew
    const existing = existingDoc.docs[0].data();
    if (isNewer(payload.updatedAt, existing.updatedAt)) {
      return updateContent(existingDoc.docs[0].id, payload);
    } else {
      return { status: 'noop', id: existingDoc.docs[0].id };
    }
  }
}
```

## Phase 3: TTG Integration (Week 4-5)

### Deliverables:

1. **Content Mapping Service**
   - Conversion from TTG's internal models to ContentDoc format
   - Image upload to TTG CDN with URL generation
   - Addition of ownership metadata (`ownerSystem`, `originalId`, `ownerUrl`)

2. **Ingestion Client**
   - JWT generation and signing
   - Retry mechanism with exponential backoff
   - Dead-letter queue for failed requests
   - Telemetry and monitoring integration

3. **Event Triggers**
   - Cloud Functions triggered on Firestore writes
   - Detection of publish/update/delete events
   - Conditional ingestion based on content type

### Implementation Details:

**TTG Event Trigger:**

```typescript
// Cloud Function triggered on event creation/update
exports.onEventUpdate = functions.firestore
  .document('events/{eventId}')
  .onWrite(async (change, context) => {
    const eventData = change.after.data();

    // Only process published events
    if (eventData.status !== 'published') return null;

    // Map to ContentDoc format
    const contentDoc = await mapEventToContentDoc(eventData);

    // Submit to CLCA ingestion
    try {
      const result = await postToCLCA(contentDoc);
      console.log(`Ingestion successful: ${result.id}`);
    } catch (error) {
      // Retry logic with exponential backoff
      await retryWithBackoff(() => postToCLCA(contentDoc));

      // If still failing, add to dead-letter queue
      await addToDLQ(contentDoc, error);
    }
  });
```

## Phase 4: Testing & Validation (Week 6)

### Deliverables:

1. **Contract Tests**
   - Validation that TTG's ContentDoc generation matches the schema
   - Compatibility testing between schema versions

2. **End-to-End Tests**
   - Test pipeline from TTG event creation to CLCA API visibility
   - Authentication and error scenario testing

3. **Performance Testing**
   - Load testing on ingestion endpoint
   - Cache effectiveness validation
   - Database query optimization

4. **Security Validation**
   - JWT authentication testing
   - Rate limiting verification
   - Secret Manager integration testing

### Implementation Details:

**E2E Test Scenario:**

1. Create test event in TTG
2. Verify Cloud Function trigger
3. Confirm successful ingestion to CLCA
4. Validate content appears in public API
5. Verify idempotency with duplicate request
6. Test moderation workflow if applicable

## Phase 5: Deployment & Monitoring (Week 7)

### Deliverables:

1. **Staging Deployment**
   - Full deployment to staging environment
   - End-to-end validation with real data
   - Performance benchmarking

2. **Production Deployment Plan**
   - Gradual rollout with feature flags
   - Blue-green deployment strategy
   - Rollback procedures

3. **Monitoring & Alerting**
   - Dashboard for ingestion metrics
   - Alert rules for error rates and latency
   - Logging and tracing configuration

4. **Documentation**
   - API documentation with examples
   - Sequence diagrams of integration flow
   - Operational runbook for support

### Implementation Details:

**Monitoring Metrics:**

- Ingestion request rate (success/failure)
- Processing latency (p50, p90, p99)
- Cache hit rate for public API
- Moderation queue size
- Error rates by type (validation, auth, etc.)

**Alerting Rules:**

- High error rate (>5% for 5 minutes)
- High latency (>1s for p90)
- Authentication failures spike
- Moderation queue backlog (>100 items)

## Phase 6: Maintenance & Optimization (Ongoing)

### Deliverables:

1. **Performance Optimization**
   - Query optimization based on usage patterns
   - Caching strategy refinement
   - Database indexing optimization

2. **Feature Enhancements**
   - Additional content types and features
   - Enhanced moderation capabilities
   - Analytics and reporting integration

3. **Schema Evolution**
   - Versioned feature updates
   - Backward compatibility maintenance
   - Automated migration tools

## Risk Mitigation

1. **Data Loss Prevention**
   - Dead-letter queue with manual reprocessing capability
   - Comprehensive logging of all ingestion attempts
   - Regular backups of Firestore data

2. **Performance Risks**
   - Rate limiting on ingestion API
   - Auto-scaling configuration for Cloud Run
   - Database performance monitoring

3. **Security Risks**
   - Regular secret rotation
   - Security audit of authentication flow
   - Penetration testing of public APIs

## Timeline Summary

- Week 1-2: Schema package and ingestion skeleton
- Week 3-4: CLCA implementation and TTG integration
- Week 5: Testing and validation
- Week 6: Staging deployment and final validation
- Week 7: Production deployment and monitoring setup
- Ongoing: Maintenance and optimization

## Next Steps

I'll begin implementing the `@org/contentdoc-schema` package with the following structure:

1. TypeScript interfaces for ContentDoc and all features
2. JSON Schema for validation
3. Sample fixtures for testing
4. Comprehensive documentation

Would you like me to proceed with creating this package, or would you like to review any specific aspects of the updated plan first?
