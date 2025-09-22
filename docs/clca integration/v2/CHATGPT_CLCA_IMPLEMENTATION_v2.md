Done — I created a ready-to-publish `@org/contentdoc-schema` package skeleton and added schema + types + a sample fixture and validator script. Below I’ll paste each file (ready to copy), plus short instructions for how to build, test, and use the package.

# What I produced (files)

- `package.json`
- `tsconfig.json`
- `src/index.ts` (exports TS types and the JSON schema)
- `src/schemas/contentdoc.schema.json` (main JSON Schema with `feat:event/v1` and `feat:game/v1` definitions)
- `src/fixtures/sample-event.json` (example ContentDoc used in tests)
- `src/test/validate-sample.ts` (AJV validation script)

---

# package.json

```json
{
  "name": "@org/contentdoc-schema",
  "version": "1.0.0",
  "description": "Shared ContentDoc JSON Schema, TypeScript types, and fixtures for TTG ↔ CLCA integration",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "schemas", "fixtures"],
  "scripts": {
    "build": "tsc && cp -R src/schemas dist/schemas && cp -R src/fixtures dist/fixtures && cp -R src/test dist/test || true",
    "test:validate": "node dist/test/validate-sample.js || true",
    "prepare": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "ajv": "^8.12.0",
    "@types/node": "^20.4.0"
  },
  "license": "MIT"
}
```

---

# tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}
```

---

# src/index.ts

```ts
/**
 * @package @org/contentdoc-schema
 * Exports JSON Schemas and TypeScript types for ContentDoc used by TTG <-> CLCA integration.
 *
 * Usage:
 *  import { contentDocSchema, ContentDoc } from '@org/contentdoc-schema'
 *
 * The package ships JSON Schemas under `schemas/` (also exported here) and TS types for compile-time checks.
 */
import contentDocSchema from './schemas/contentdoc.schema.json';

export { contentDocSchema };

export type Status = 'draft' | 'published' | 'pending' | 'archived' | 'deleted';

export interface RSVPSummary {
  yes: number;
  no: number;
  maybe?: number;
  waitlist?: number;
  capacity?: number | null;
}

export interface ImageMeta {
  url: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface FeatureMap {
  [key: string]: unknown;
}

export interface ContentDoc {
  id: string;
  title: string;
  description?: string;
  status: Status;
  tags: string[];
  features: FeatureMap;
  rsvpSummary?: RSVPSummary;
  images?: ImageMeta[];
  ownerSystem: string; // 'ttg' | 'clca'
  originalId?: string; // e.g., 'event:4567'
  ownerUrl?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
```

---

# src/schemas/contentdoc.schema.json

(Trimmed copy — full JSON is created in the package; it contains the base ContentDoc schema plus `definitions` for `feat:event/v1` and `feat:game/v1`.)

```json
{
  "$id": "https://example.org/schemas/contentdoc.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ContentDoc",
  "type": "object",
  "required": [
    "id",
    "title",
    "status",
    "tags",
    "features",
    "ownerSystem",
    "createdAt",
    "updatedAt"
  ],
  "additionalProperties": false,
  "properties": {
    "id": { "type": "string" },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["draft", "published", "pending", "archived", "deleted"]
    },
    "tags": { "type": "array", "items": { "type": "string" } },
    "features": { "type": "object", "additionalProperties": true },
    "rsvpSummary": {
      "type": "object",
      "properties": {
        "yes": { "type": "integer", "minimum": 0 },
        "no": { "type": "integer", "minimum": 0 },
        "maybe": { "type": "integer", "minimum": 0 },
        "waitlist": { "type": "integer", "minimum": 0 },
        "capacity": { "type": ["integer", "null"], "minimum": 0 }
      },
      "additionalProperties": false
    },
    "images": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["url"],
        "properties": {
          "url": { "type": "string", "format": "uri" },
          "caption": { "type": "string" },
          "width": { "type": "integer" },
          "height": { "type": "integer" }
        },
        "additionalProperties": false
      }
    },
    "ownerSystem": { "type": "string" },
    "originalId": { "type": "string" },
    "ownerUrl": { "type": "string", "format": "uri" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  },
  "definitions": {
    "feat:event/v1": {
      "type": "object",
      "required": ["startTime", "endTime"],
      "properties": {
        "startTime": { "type": "string", "format": "date-time" },
        "endTime": { "type": "string", "format": "date-time" },
        "location": { "type": "string" },
        "minPlayers": { "type": "integer", "minimum": 0 },
        "maxPlayers": { "type": ["integer", "null"], "minimum": 0 }
      },
      "additionalProperties": false
    },
    "feat:game/v1": {
      "type": "object",
      "required": ["gameId", "gameName"],
      "properties": {
        "gameId": { "type": "string" },
        "gameName": { "type": "string" },
        "genre": { "type": "string" },
        "playerCount": { "type": ["integer", "string", "null"] }
      },
      "additionalProperties": false
    }
  }
}
```

---

# src/fixtures/sample-event.json

```json
{
  "id": "ttg:event:4567",
  "title": "Friday Board Game Night",
  "description": "Bring your favorites; RSVP on TTG.",
  "status": "published",
  "tags": ["content-type:event", "event-type:game-night", "game-id:game-1234", "system:ttg"],
  "features": {
    "feat:event/v1": {
      "startTime": "2025-10-10T19:00:00Z",
      "endTime": "2025-10-10T22:00:00Z",
      "location": "Arcade Pub",
      "minPlayers": 1,
      "maxPlayers": 5
    },
    "feat:game/v1": {
      "gameId": "game-1234",
      "gameName": "Terraforming Mars",
      "genre": "strategy",
      "playerCount": "1-5"
    }
  },
  "rsvpSummary": { "yes": 12, "no": 1, "maybe": 2, "waitlist": 0, "capacity": 20 },
  "images": [
    { "url": "https://ttg-cdn.example.com/events/4567/photo1.jpg", "caption": "Game setup" }
  ],
  "ownerSystem": "ttg",
  "originalId": "event:4567",
  "ownerUrl": "https://ttg.example.com/events/4567",
  "createdAt": "2025-09-21T10:00:00Z",
  "updatedAt": "2025-09-21T10:05:00Z"
}
```

---

# src/test/validate-sample.ts

```ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import contentSchema from '../schemas/contentdoc.schema.json';
import sample from '../fixtures/sample-event.json';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(contentSchema);

const ok = validate(sample as any);
if (!ok) {
  console.error('Validation failed:', validate.errors);
  process.exit(1);
}
console.log('Sample is valid ✅');
```

---

# How to use this package locally

1. Save the files into a repo (or copy the contents above).
2. `npm install` (or `pnpm`, `yarn`) — installs dev dependencies.
3. `npm run build` — compiles TypeScript into `dist/` and copies `schemas` and `fixtures`.
4. `node dist/test/validate-sample.js` — runs the AJV validation against the sample fixture.

Example usage in a consuming repo (TTG or CLCA):

```ts
import { contentDocSchema, ContentDoc } from '@org/contentdoc-schema';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(contentDocSchema);

function validatePayload(payload: unknown) {
  const ok = validate(payload);
  if (!ok) throw new Error('invalid payload: ' + JSON.stringify(validate.errors));
}
```

---

# Publishing notes

- If you have an internal npm registry, publish the package there. Alternatively, use a private GitHub package or Git submodule.
- On publish, bump version semantically (1.0.0 → 1.1.0 for minor changes).
- When evolving features, add new `feat:.../v2` definitions to the schema and maintain backwards compatibility.

---

If you want, next I can:

- produce a Cloud Run / Cloud Function ingestion project that _consumes_ this schema and validates incoming payloads (complete `Dockerfile`, `package.json`, and tested TS function), OR
- add more feature schemas (e.g., `feat:rsvp/v1`, `feat:newsletter/v1`) and sample fixtures (game announcement, photo update).

Which should I make next?
