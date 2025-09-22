# TTG ↔ CLCA — Integrated System: comprehensive summary & Cloud Function explanation

Great — below is a complete, actionable document capturing the reconciled, **one-way** TTG → CLCA integration (game/events + RSVP summary + images-as-URLs), the APIs, data model, security model, ingestion behaviour, idempotency, deployment/observability, tests, runbook, and acceptance criteria. At the end I include an expanded, plain-language explanation of the CLCA ingestion Cloud Function skeleton you already have.

---

# 1 — Executive summary

- **Integration model:** One-way, **push** flow. TTG (authoritative for games/events) **pushes** published game-related ContentDocs to CLCA ingestion endpoint(s). CLCA stores, indexes, and surfaces that content (e.g., newsletter).
- **Why:** preserves autonomy, minimizes coupling, gives CLCA access to rich game content without TTG giving up control of RSVP flows or user PII.
- **Scope:** only game-related content (games, events, game announcements, rsvpSummary, photo URLs). No general non-game tasks/events from TTG.
- **Auth & security:** TTG uses a scoped service credential (rotating token, short-lived JWT, or service account) to POST content. CLCA validates, enforces idempotency, and optionally moderates.
- **Data:** `ContentDoc` base with versioned features (`feat:event/v1`, `feat:game/v1`) and ownership/provenance fields (`ownerSystem`, `originalId`, `ownerUrl`).

---

# 2 — Architecture (high level)

```
TTG (separate Firebase project)
  ├─ publishes events in its UI / DB
  ├─ maps event -> ContentDoc
  ├─ uploads images to TTG CDN/Storage (returns CDN URLs)
  ├─ POSTs ContentDoc to CLCA ingest endpoint (push)
  └─ (optional) exposes public GET feed for CLCA polling / discovery

CLCA (separate Firebase project / Cloud Run)
  ├─ /api/ingest/content  (POST)  <-- TTG push (authenticated)
  ├─ validate & idempotency checks
  ├─ store in CLCA content collection
  ├─ index / tag map / optionally moderate
  └─ GET /api/content/published (for newsletter / UI)
```

Key design constraints:

- Separate Firebase projects (no sharing).
- Images are URLs only (TTG-hosted).
- Minimal public payload (no PII).
- Idempotent ingestion by `ownerSystem + originalId`.

---

# 3 — API contract (essential endpoints)

## TTG → CLCA (ingest)

- `POST /api/ingest/content`
  - Auth: `x-service-token` header, short-lived JWT, or OAuth bearer token (recommended).
  - Body: validated `ContentDoc`.
  - Returns:
    - `201 Created` `{ status: 'created', id: '<clca_doc_id>' }`
    - `200 OK` `{ status: 'updated', id: '<clca_doc_id>' }`
    - `200 OK` `{ status: 'noop', id: '<clca_doc_id>' }` (if identical `updatedAt`)
    - `400 Bad Request` (validation errors)
    - `401/403` (auth)

- `POST /api/ingest/content/delete` (or `DELETE /api/ingest/content/:originalId`)
  - Auth required. Archives the CLCA document.

## CLCA public APIs (consumers)

- `GET /api/content/published?tags=...&system=ttg&after=<cursor>&limit=25`
  - Cursor-based pagination, returns array of canonical `ContentDoc` objects (trimmed view).

- `GET /api/content/{id}`
- Optional: `GET /api/content?ownerSystem=ttg&dateRange=...` for newsletter generation.

Notes: include ETag and `Cache-Control` headers on GETs.

---

# 4 — Minimal ContentDoc (game/events) — semantics

Essential fields (must be validated):

- `id` (string) — internal CLCA id or can mirror `ownerSystem:originalId`
- `title`, `description`, `status` (`draft|published|pending|archived|deleted`)
- `tags` — array of `namespace:value` strings (e.g., `content-type:event`, `system:ttg`)
- `features` — object of feature blocks (keys are versioned strings such as `feat:event/v1`, `feat:game/v1`)
- `rsvpSummary` — aggregated counts (`yes`, `no`, `maybe`, `waitlist`, `capacity`)
- `images` — array of `{ url, caption?, width?, height? }` — **URL only**; no binary
- `ownerSystem` — `'ttg'`
- `originalId` — `'event:4567'` (for idempotency)
- `ownerUrl` — deep link back to TTG
- `createdAt`, `updatedAt` — ISO timestamps

Feature examples:

- `feat:event/v1`: `{ startTime: ISOString, endTime: ISOString, location: string, minPlayers?: number, maxPlayers?: number }`
- `feat:game/v1`: `{ gameId: string, gameName: string, genre?: string }`

Versioning: always use `feat:.../v1` so future changes use `/v2`.

---

# 5 — Ingestion flow (step-by-step)

1. TTG detects publish/update/delete of a game-related item.
2. TTG maps internal data -> `ContentDoc` using a mapping function (ensures feature keys are `v1` and images are CDN URLs).
3. TTG POSTs `ContentDoc` to CLCA `POST /api/ingest/content` with the service token.
4. CLCA ingestion:
   - Verify auth (service credential → check scope).
   - Validate payload against JSON Schema.
   - Look up by (`ownerSystem`, `originalId`) in CLCA content collection.
     - If not found → create new doc (set `createdAt` if missing).
     - If found → compare `updatedAt`. If identical → return noop; if different → update.

   - Add `lastIngestedAt` server timestamp for auditing.
   - Set status:
     - If TTG is trusted → set `status` to TTG supplied `status` (`published` etc).
     - Otherwise → set `status: pending`.

   - Emit webhook/event for internal indexing and newsletter workflows.

5. CLCA makes content available to its UIs and newsletter generator by reading `status=published` items.

---

# 6 — Idempotency & dedupe design

- **Primary idempotency key:** `ownerSystem + originalId` (e.g., `ttg:event:4567`).
- **Change detection:** compare `updatedAt` from payload with stored doc. If identical → noop.
- **Concurrent / out-of-order updates:** record `lastIngestedAt` and process updates by `updatedAt` monotonicity (only apply if payload `updatedAt` is newer than stored).
- **Deletes:** TTG can either send `status: deleted` in a POST or call `POST /api/ingest/content/delete` or `DELETE`. CLCA archives the doc and keeps provenance.

---

# 7 — Security & auth (recommendation)

- **Use separate Firebase projects.** TTG and CLCA each use their own Firebase.
- **Service account / token model:**
  - Create a CLCA service account or API key for TTG ingestion. Prefer **short-lived signed tokens** (JWT) or a rotating secret stored in Secret Manager.
  - Use `x-service-token` initially in dev; production: use signed JWT or Google IAM-based service account auth if you deploy to Cloud Run/Cloud Functions with IAM authentication.

- **Scopes/Claims:** token should carry `scope: 'ingest:content'` and `issuer: 'ttg'`.
- **Defense in depth:** enforce both API layer checks and Firestore security rules (for e.g., any direct writes to content collection).
- **Rate limiting & WAF:** limit requests per token IP, especially for the ingestion endpoint.
- **Secrets management:** store tokens in Secret Manager; rotate regularly.

---

# 8 — Moderation & trust

- **Phase 0:** Treat TTG org as trusted. Auto-publish TTG-origin items.
- **Phase 1:** If spam occurs, CLCA switches to `status: pending` for TTG-origin items until manual/automated moderation approves.
- **Trust policy:** maintain `trustedOrganizations` list. Associate `ownerSystem` with a trust level.
- **Moderation queue:** a small UI for moderators to approve pending TTG items (minimal workflow).

---

# 9 — Images & media

- TTG uploads images to its storage/CDN and provides CDN URLs in `images[]`.
- CLCA should:
  - Validate image URL domain (allowlist TTG CDN domains).
  - Optionally proxy images to avoid hotlinking or for resizing / caching (recommended).
  - Store only metadata + URL, not binary content.

- Include `width/height` where available for layout.

---

# 10 — Firestore / Data storage (CLCA)

- CLCA `content` collection documents:
  - Fields: `title`, `description`, `status`, `tags`, `features`, `rsvpSummary`, `images`, `ownerSystem`, `originalId`, `ownerUrl`, `createdAt`, `updatedAt`, `lastIngestedAt`, `provenance` (object with `source`, `ingestRequestId`, etc).

- Recommended composite indexes:
  - `status + tags`
  - `tags + features.feat:event/v1.startTime`
  - `ownerSystem + originalId` (unique lookup)

- Keep documents < 1 MiB (Firestore limit). If `features` become large, store heavy blobs in separate `content_payloads` or in Cloud Storage.

---

# 11 — Cloud Function detailed explanation (plain language)

Below I expand the skeleton you saw earlier into a clear, step-by-step behaviour description:

### Purpose

An HTTP endpoint that _safely accepts ContentDocs from TTG_, validates them, ensures we don't create duplicates, optionally sets moderation status, and writes them to CLCA's `content` collection.

### Main steps the function performs

1. **Authentication**
   - Check `x-service-token` or bearer token in header.
   - Verify the token against a secret or via JWT validation.
   - Deny requests without valid credentials (401 or 403).

2. **Payload validation**
   - Use AJV (JSON Schema validator) with the shared `contentdoc.schema.json`.
   - If the schema validation fails, return `400 Bad Request` listing errors.

3. **Extract identity fields**
   - Ensure `ownerSystem` and `originalId` exist. These are mandatory for idempotency and provenance.

4. **Idempotency & lookup**
   - Query `content` collection where `ownerSystem == payload.ownerSystem && originalId == payload.originalId`.
   - If found:
     - Compare stored `updatedAt` vs payload `updatedAt`.
     - If equal → return `200 noop`.
     - If payload `updatedAt` is older than stored → return `409 conflict` or ignore (depends on policy).
     - If payload `updatedAt` is newer → update stored doc fields, set `lastIngestedAt` to server timestamp.

   - If not found:
     - Insert new document (set `createdAt` if not present on payload).
     - Set `provenance` metadata like `ingestRequestId` (UUID), `receivedAt`, `ingestedBy: 'ttg'`.

5. **Moderation & status**
   - If the organization is trusted → accept the `status` from payload (e.g., `published`).
   - If not trusted → set `status: pending` and add to moderation queue.

6. **Return response**
   - `201 Created` with CLCA document id for new inserts.
   - `200 OK` for updates or no-ops.
   - Include a small JSON with status and id, and optionally the ETag/last-modified.

7. **Telemetry & retries**
   - Log ingest attempts, validation errors, and processing times.
   - Provide an ingest request ID in response for tracing.

### Error handling & retries (guidance)

- For authentication or payload errors → 4xx and do not retry.
- For transient errors (DB timeout, network) → 5xx. TTG should retry with exponential backoff and jitter.
- Implement idempotency so repeated retries do not create duplicates.

### Scaling & deployment choices

- Cloud Run is preferred (stateless, autoscaling, easy custom auth). Cloud Functions works too for simpler deployments.
- Use Secret Manager to store ingestion tokens.
- Add Cloud Armor/WAF for rate limiting and IP-based protections if needed.

---

# 12 — CI, contract testing & automation

- **Shared package** `@org/contentdoc-schema` that includes:
  - JSON Schema, TypeScript types, sample fixtures, and changelog.
  - Published via internal npm registry or git tag.

- **Consumer-driven contract tests:**
  - CLCA publishes provider schema/fixtures as part of its repo.
  - TTG consumer test suite validates the mapping function produces payloads that pass the schema.

- **Cross-repo CI job** (GitHub Actions):
  - Checkout both repos, run `npm ci` for both.
  - Run `clca` provider tests and `ttg` consumer tests.
  - Optionally run a smoke test: TTG sends a sample payload to a CLCA staging ingest endpoint, then CLCA GETs it back.

- **Secrets in CI:** service tokens stored in secrets; rotate regularly.

---

# 13 — Monitoring & alerting

- Track metrics:
  - ingestion request rate, 2xx vs 4xx vs 5xx, validation error rate
  - processing latency (ingest → indexed)
  - moderation queue size
  - failure spike alarm threshold (e.g., > 5% validation errors over 10m)

- Logs:
  - Ingest request ID, ownerSystem, originalId, payload size, result status

- Alerts:
  - ingestion endpoint down or 5xx spike
  - ingestion auth failures beyond threshold

---

# 14 — Runbook (short)

- **Validation errors escalate**: inspect sample payload, check schema version mismatch.
- **Duplicate docs appearing**: check whether `ownerSystem + originalId` is unique query index; check update logic comparing `updatedAt`.
- **Images broken**: verify TTG image CDN is up; check CLCA image allowlist; consider proxying.
- **Moderation backlog**: add temporary auto-approve if backlog small and trusted.

---

# 15 — Acceptance criteria (concrete)

- TTG POST → CLCA returns `201` and doc appears in CLCA `GET /api/content/published?system=ttg`.
- Idempotency: repeated identical POST returns `200 noop` and no duplicate record.
- CLCA stores `ownerSystem`, `originalId`, `ownerUrl`.
- CLCA `GET` endpoints return only `status=published` items for public consumers.
- Images included are only URLs; binary data is never passed in ContentDoc ingest payloads.

---

# 16 — Minimal implementation timeline & checklist

**Week 0 (setup)**

- Create `@org/contentdoc-schema` package and publish in internal registry (or git).

**Week 1** — TTG side

- Implement mapping function and `postToCLCA` with retries/backoff.
- Ensure images upload to CDN/TTG storage and mapping uses the CDN URLs.
- Add `originalId`, `ownerSystem`, `ownerUrl`, `updatedAt` in payloads.

**Week 2** — CLCA ingest & public read

- Implement CLCA ingestion endpoint (Cloud Run).
- Add schema validation, idempotency logic, and Firestore storage.
- Implement `GET /api/content/published` for newsletter consumer.

**Week 3** — Testing & hardening

- Add contract tests and cross-repo CI smoke test.
- Add monitoring/alerting and secret rotation for tokens.

**Go-live**

- Flip TTG to call CLCA ingest on publish; CLCA auto-publishes the TTG-origin items.

---

# 17 — Appendix: example responses & snippets

### Example successful ingest response

```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "status": "created",
  "id": "clca:content:0x9a1b",
  "ingestRequestId": "ingest-20250922-93b4"
}
```

### Example noop response

```json
HTTP/1.1 200 OK
{
  "status": "noop",
  "id": "clca:content:0x9a1b"
}
```

### Example validation error

```json
HTTP/1.1 400 Bad Request
{
  "error": "invalid payload",
  "details": [
    { "path": "/features/feat:event", "message": "startTime is required" }
  ]
}
```

---

# 18 — Follow-ups I can produce immediately (pick one or more)

- Full Cloud Run project skeleton with `package.json`, TypeScript function, test harness, Dockerfile, and deployment notes.
- A complete `@org/contentdoc-schema` npm-style package with `index.ts`, `contentdoc.schema.json`, and sample fixtures.
- TTG `content-publisher` Node module code (mapping + robust retries + exponential backoff + telemetry).
- GitHub Actions YAML for a cross-repo contract test (checks both repos).
- Sample moderation UI prototype (very small) for CLCA moderators.

---

If you want, I can start by producing the **full `@org/contentdoc-schema` package** (JSON Schema + TypeScript types + fixtures) and the **Cloud Run ingestion project skeleton** — drop-in ready for CLCA. Which one should I generate first?
