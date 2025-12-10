Your critique is spot-on. The proposal was thinking like an architect, not someone who has to debug production issues at 2am. Let me provide corrected models and a prioritized plan.

---

# Corrected Core Implementation

## Directory Structure (with API abstraction)

```
src/
├── core/
│   ├── models/
│   │   ├── BaseNode.ts
│   │   ├── Relationship.ts
│   │   └── types.ts              # Shared types
│   ├── validation/
│   │   ├── validators.ts         # Sync validators
│   │   ├── async-validators.ts   # Async validators
│   │   └── schemas.ts            # Node-type schemas
│   └── cache/
│       └── memory-cache.ts       # Simple in-memory cache
├── api/                          # ABSTRACTION LAYER
│   ├── index.ts                  # Export interface
│   ├── types.ts                  # API contracts
│   ├── firebase/                 # Firebase implementation
│   │   ├── node-api.ts
│   │   ├── relationship-api.ts
│   │   └── converters.ts
│   └── mock/                     # For testing
│       ├── node-api.ts
│       └── relationship-api.ts
├── stores/
│   ├── nodes.ts                  # With realtime subscriptions
│   └── relationships.ts
└── contexts/
    └── activity-resource.ts
```

---

## API Contract (Abstract Layer)

```typescript
// api/types.ts
import { BaseNode } from '@/core/models/BaseNode';
import { Relationship } from '@/core/models/Relationship';

export interface QueryOptions {
  pageSize?: number;
  cursor?: unknown;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface QueryResult<T> {
  items: T[];
  cursor: unknown | null;
  hasMore: boolean;
}

export interface BatchResult {
  success: boolean;
  successCount: number;
  failedIds: string[];
  errors: Array<{ id: string; error: string }>;
}

export type UnsubscribeFn = () => void;

// Node API contract
export interface INodeApi {
  create(data: Partial<BaseNode>): Promise<BaseNode>;
  get(id: string): Promise<BaseNode | null>;
  update(id: string, updates: Partial<BaseNode>): Promise<BaseNode>;
  delete(id: string): Promise<void>;

  query(
    filters: { context?: string; type?: string; createdBy?: string; visibility?: string },
    options?: QueryOptions,
  ): Promise<QueryResult<BaseNode>>;

  getBatch(ids: string[]): Promise<Map<string, BaseNode>>;
  createBatch(nodes: Partial<BaseNode>[]): Promise<BatchResult>;
  deleteBatch(ids: string[]): Promise<BatchResult>;

  // Realtime
  subscribe(id: string, callback: (node: BaseNode | null) => void): UnsubscribeFn;
  subscribeQuery(
    filters: { context?: string; type?: string },
    callback: (nodes: BaseNode[]) => void,
  ): UnsubscribeFn;
}

// Relationship API contract
export interface IRelationshipApi {
  create(data: Partial<Relationship>): Promise<Relationship>;
  get(id: string): Promise<Relationship | null>;
  delete(id: string): Promise<void>;

  getBySource(
    sourceId: string,
    types?: string[],
    options?: QueryOptions,
  ): Promise<QueryResult<Relationship>>;
  getByTarget(
    targetId: string,
    types?: string[],
    options?: QueryOptions,
  ): Promise<QueryResult<Relationship>>;
  getBySourceBatch(sourceIds: string[], types?: string[]): Promise<Map<string, Relationship[]>>;

  createBatch(relationships: Partial<Relationship>[]): Promise<BatchResult>;

  // Realtime
  subscribeBySource(
    sourceId: string,
    types: string[] | undefined,
    callback: (relationships: Relationship[]) => void,
  ): UnsubscribeFn;
}
```

```typescript
// api/index.ts
import { INodeApi, IRelationshipApi } from './types';
import { FirebaseNodeApi } from './firebase/node-api';
import { FirebaseRelationshipApi } from './firebase/relationship-api';
// import { MockNodeApi } from './mock/node-api'; // For testing

const USE_MOCK = false; // Or check import.meta.env.MODE === 'test'

export const nodeApi: INodeApi = USE_MOCK ? new MockNodeApi() : new FirebaseNodeApi();

export const relationshipApi: IRelationshipApi = USE_MOCK
  ? new MockRelationshipApi()
  : new FirebaseRelationshipApi();
```

---

## Corrected Models

### BaseNode.ts (unchanged, was good)

```typescript
// core/models/BaseNode.ts
export interface BaseNode {
  id: string;
  type: string;
  context: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  attributes: Record<string, any>; // Includes '_meta:*' prefixed keys
  visibility: 'public' | 'private' | 'group' | 'selected';
}

export const NodeHelpers = {
  getAttribute<T>(node: BaseNode, key: string, defaultValue?: T): T {
    return (node.attributes[key] ?? defaultValue) as T;
  },

  getMeta<T>(node: BaseNode, key: string, defaultValue?: T): T {
    return (node.attributes[`_meta:${key}`] ?? defaultValue) as T;
  },

  setAttribute(node: BaseNode, key: string, value: any): BaseNode {
    return {
      ...node,
      attributes: { ...node.attributes, [key]: value },
      updatedAt: new Date(),
    };
  },

  setMeta(node: BaseNode, key: string, value: any): BaseNode {
    return {
      ...node,
      attributes: { ...node.attributes, [`_meta:${key}`]: value },
      updatedAt: new Date(),
    };
  },

  getPublicAttributes(node: BaseNode): Record<string, any> {
    return Object.fromEntries(
      Object.entries(node.attributes).filter(([key]) => !key.startsWith('_meta:')),
    );
  },

  matches(
    node: BaseNode,
    pattern: {
      type?: string;
      context?: string;
      attributes?: Record<string, any>;
    },
  ): boolean {
    if (pattern.type && node.type !== pattern.type) return false;
    if (pattern.context && !node.context.startsWith(pattern.context)) return false;
    if (pattern.attributes) {
      for (const [key, value] of Object.entries(pattern.attributes)) {
        if (node.attributes[key] !== value) return false;
      }
    }
    return true;
  },
};
```

### Relationship.ts (FIXED)

```typescript
// core/models/Relationship.ts
export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  createdBy: string;
  createdAt: Date;
  attributes: Record<string, any>;
  validFrom?: Date;
  validUntil?: Date;
}

export const RelationshipHelpers = {
  // FIXED: Random ID allows multiple relationships of same type
  generateId(): string {
    return `rel_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Use this when you WANT uniqueness (optional)
  generateDeterministicId(
    sourceId: string,
    targetId: string,
    type: string,
    uniqueKey?: string,
  ): string {
    const base = `${sourceId}_${targetId}_${type}`;
    return uniqueKey ? `${base}_${uniqueKey}` : base;
  },

  isValid(rel: Relationship, referenceDate?: Date): boolean {
    const now = referenceDate || new Date();
    if (rel.validFrom && now < rel.validFrom) return false;
    if (rel.validUntil && now > rel.validUntil) return false;
    return true;
  },

  getAttribute<T>(rel: Relationship, key: string, defaultValue?: T): T {
    return (rel.attributes[key] ?? defaultValue) as T;
  },

  setAttribute(rel: Relationship, key: string, value: any): Relationship {
    return {
      ...rel,
      attributes: { ...rel.attributes, [key]: value },
    };
  },

  // Check if duplicate exists (for enforcing uniqueness when needed)
  isDuplicate(existing: Relationship[], newRel: Partial<Relationship>): boolean {
    return existing.some(
      (r) =>
        r.sourceId === newRel.sourceId && r.targetId === newRel.targetId && r.type === newRel.type,
    );
  },
};
```

---

## Firebase API Implementation (with Realtime)

```typescript
// api/firebase/node-api.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  DocumentSnapshot,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/boot/firebase';
import { BaseNode } from '@/core/models/BaseNode';
import { INodeApi, QueryOptions, QueryResult, BatchResult, UnsubscribeFn } from '../types';

export class FirebaseNodeApi implements INodeApi {
  private readonly COLLECTION = 'nodes';
  private readonly DEFAULT_PAGE_SIZE = 25;
  private readonly MAX_BATCH_SIZE = 500;

  // === CRUD ===

  async create(data: Partial<BaseNode>): Promise<BaseNode> {
    const nodeId = data.id || this.generateId();
    const node: BaseNode = {
      id: nodeId,
      type: data.type || 'unknown',
      context: data.context || 'global',
      createdBy: data.createdBy || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      attributes: data.attributes || {},
      visibility: data.visibility || 'public',
    };

    await setDoc(doc(db, this.COLLECTION, nodeId), this.toFirestore(node));
    return node;
  }

  async get(id: string): Promise<BaseNode | null> {
    const docSnap = await getDoc(doc(db, this.COLLECTION, id));
    if (!docSnap.exists()) return null;
    return this.fromFirestore(docSnap);
  }

  async update(id: string, updates: Partial<BaseNode>): Promise<BaseNode> {
    const updateData: Record<string, any> = { ...updates };
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;
    updateData.updatedAt = serverTimestamp();

    await updateDoc(doc(db, this.COLLECTION, id), updateData);

    const updated = await this.get(id);
    if (!updated) throw new Error('Node not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.COLLECTION, id));
  }

  // === Queries ===

  async query(
    filters: { context?: string; type?: string; createdBy?: string; visibility?: string },
    options: QueryOptions = {},
  ): Promise<QueryResult<BaseNode>> {
    const pageSize = options.pageSize || this.DEFAULT_PAGE_SIZE;
    const constraints: QueryConstraint[] = [];

    if (filters.context) constraints.push(where('context', '==', filters.context));
    if (filters.type) constraints.push(where('type', '==', filters.type));
    if (filters.createdBy) constraints.push(where('createdBy', '==', filters.createdBy));
    if (filters.visibility) constraints.push(where('visibility', '==', filters.visibility));

    constraints.push(orderBy(options.orderBy || 'createdAt', options.orderDirection || 'desc'));
    constraints.push(limit(pageSize + 1));

    if (options.cursor) {
      constraints.push(startAfter(options.cursor as DocumentSnapshot));
    }

    const q = query(collection(db, this.COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

    return {
      items: docs.map((d) => this.fromFirestore(d)),
      cursor: docs.length > 0 ? docs[docs.length - 1] : null,
      hasMore,
    };
  }

  async getBatch(ids: string[]): Promise<Map<string, BaseNode>> {
    const results = new Map<string, BaseNode>();
    const chunks = this.chunkArray(ids, 10);

    for (const chunk of chunks) {
      const q = query(collection(db, this.COLLECTION), where('__name__', 'in', chunk));
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        results.set(docSnap.id, this.fromFirestore(docSnap));
      }
    }

    return results;
  }

  async createBatch(nodes: Partial<BaseNode>[]): Promise<BatchResult> {
    const results: BatchResult = {
      success: true,
      successCount: 0,
      failedIds: [],
      errors: [],
    };

    const chunks = this.chunkArray(nodes, this.MAX_BATCH_SIZE);

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      const chunkIds: string[] = [];

      for (const data of chunk) {
        const nodeId = data.id || this.generateId();
        chunkIds.push(nodeId);

        const node: BaseNode = {
          id: nodeId,
          type: data.type || 'unknown',
          context: data.context || 'global',
          createdBy: data.createdBy || 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          attributes: data.attributes || {},
          visibility: data.visibility || 'public',
        };

        batch.set(doc(db, this.COLLECTION, nodeId), this.toFirestore(node));
      }

      try {
        await batch.commit();
        results.successCount += chunk.length;
      } catch (error) {
        results.success = false;
        chunkIds.forEach((id) => {
          results.failedIds.push(id);
          results.errors.push({ id, error: String(error) });
        });
      }
    }

    return results;
  }

  async deleteBatch(ids: string[]): Promise<BatchResult> {
    const results: BatchResult = {
      success: true,
      successCount: 0,
      failedIds: [],
      errors: [],
    };

    const chunks = this.chunkArray(ids, this.MAX_BATCH_SIZE);

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((id) => batch.delete(doc(db, this.COLLECTION, id)));

      try {
        await batch.commit();
        results.successCount += chunk.length;
      } catch (error) {
        results.success = false;
        chunk.forEach((id) => {
          results.failedIds.push(id);
          results.errors.push({ id, error: String(error) });
        });
      }
    }

    return results;
  }

  // === REALTIME SUBSCRIPTIONS ===

  subscribe(id: string, callback: (node: BaseNode | null) => void): UnsubscribeFn {
    return onSnapshot(doc(db, this.COLLECTION, id), (snap) => {
      callback(snap.exists() ? this.fromFirestore(snap) : null);
    });
  }

  subscribeQuery(
    filters: { context?: string; type?: string },
    callback: (nodes: BaseNode[]) => void,
  ): UnsubscribeFn {
    const constraints: QueryConstraint[] = [];

    if (filters.context) constraints.push(where('context', '==', filters.context));
    if (filters.type) constraints.push(where('type', '==', filters.type));
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collection(db, this.COLLECTION), ...constraints);

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map((d) => this.fromFirestore(d)));
    });
  }

  // === Private ===

  private toFirestore(node: BaseNode): Record<string, any> {
    return {
      ...node,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    };
  }

  private fromFirestore(docSnap: DocumentSnapshot): BaseNode {
    const data = docSnap.data()!;
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
    } as BaseNode;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

```typescript
// api/firebase/relationship-api.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  onSnapshot,
  DocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/boot/firebase';
import { Relationship, RelationshipHelpers } from '@/core/models/Relationship';
import { IRelationshipApi, QueryOptions, QueryResult, BatchResult, UnsubscribeFn } from '../types';

export class FirebaseRelationshipApi implements IRelationshipApi {
  private readonly COLLECTION = 'relationships';
  private readonly DEFAULT_PAGE_SIZE = 50;
  private readonly MAX_BATCH_SIZE = 500;

  async create(data: Partial<Relationship>): Promise<Relationship> {
    // FIXED: Use random ID by default
    const relId = data.id || RelationshipHelpers.generateId();

    const rel: Relationship = {
      id: relId,
      sourceId: data.sourceId!,
      targetId: data.targetId!,
      type: data.type!,
      createdBy: data.createdBy || 'system',
      createdAt: new Date(),
      attributes: data.attributes || {},
      validFrom: data.validFrom,
      validUntil: data.validUntil,
    };

    await setDoc(doc(db, this.COLLECTION, relId), this.toFirestore(rel));
    return rel;
  }

  async get(id: string): Promise<Relationship | null> {
    const docSnap = await getDoc(doc(db, this.COLLECTION, id));
    if (!docSnap.exists()) return null;
    return this.fromFirestore(docSnap);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.COLLECTION, id));
  }

  async getBySource(
    sourceId: string,
    types?: string[],
    options: QueryOptions = {},
  ): Promise<QueryResult<Relationship>> {
    const pageSize = options.pageSize || this.DEFAULT_PAGE_SIZE;
    const constraints: QueryConstraint[] = [where('sourceId', '==', sourceId)];

    if (types?.length && types.length <= 10) {
      constraints.push(where('type', 'in', types));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageSize + 1));

    if (options.cursor) {
      constraints.push(startAfter(options.cursor as DocumentSnapshot));
    }

    const q = query(collection(db, this.COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

    let items = docs.map((d) => this.fromFirestore(d));

    // Client-side filter if types > 10
    if (types?.length && types.length > 10) {
      items = items.filter((r) => types.includes(r.type));
    }

    return { items, cursor: docs.length > 0 ? docs[docs.length - 1] : null, hasMore };
  }

  async getByTarget(
    targetId: string,
    types?: string[],
    options: QueryOptions = {},
  ): Promise<QueryResult<Relationship>> {
    const pageSize = options.pageSize || this.DEFAULT_PAGE_SIZE;
    const constraints: QueryConstraint[] = [where('targetId', '==', targetId)];

    if (types?.length && types.length <= 10) {
      constraints.push(where('type', 'in', types));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageSize + 1));

    if (options.cursor) {
      constraints.push(startAfter(options.cursor as DocumentSnapshot));
    }

    const q = query(collection(db, this.COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

    return {
      items: docs.map((d) => this.fromFirestore(d)),
      cursor: docs.length > 0 ? docs[docs.length - 1] : null,
      hasMore,
    };
  }

  async getBySourceBatch(
    sourceIds: string[],
    types?: string[],
  ): Promise<Map<string, Relationship[]>> {
    const results = new Map<string, Relationship[]>();
    sourceIds.forEach((id) => results.set(id, []));

    const chunks = this.chunkArray(sourceIds, 10);

    for (const chunk of chunks) {
      let q = query(collection(db, this.COLLECTION), where('sourceId', 'in', chunk));

      if (types?.length && types.length <= 10) {
        q = query(q, where('type', 'in', types));
      }

      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        const rel = this.fromFirestore(docSnap);
        if (types?.length && types.length > 10 && !types.includes(rel.type)) continue;

        const existing = results.get(rel.sourceId) || [];
        existing.push(rel);
        results.set(rel.sourceId, existing);
      }
    }

    return results;
  }

  async createBatch(relationships: Partial<Relationship>[]): Promise<BatchResult> {
    const results: BatchResult = {
      success: true,
      successCount: 0,
      failedIds: [],
      errors: [],
    };

    const chunks = this.chunkArray(relationships, this.MAX_BATCH_SIZE);

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      const chunkIds: string[] = [];

      for (const data of chunk) {
        const relId = data.id || RelationshipHelpers.generateId();
        chunkIds.push(relId);

        const rel: Relationship = {
          id: relId,
          sourceId: data.sourceId!,
          targetId: data.targetId!,
          type: data.type!,
          createdBy: data.createdBy || 'system',
          createdAt: new Date(),
          attributes: data.attributes || {},
          validFrom: data.validFrom,
          validUntil: data.validUntil,
        };

        batch.set(doc(db, this.COLLECTION, relId), this.toFirestore(rel));
      }

      try {
        await batch.commit();
        results.successCount += chunk.length;
      } catch (error) {
        results.success = false;
        chunkIds.forEach((id) => {
          results.failedIds.push(id);
          results.errors.push({ id, error: String(error) });
        });
      }
    }

    return results;
  }

  // === REALTIME ===

  subscribeBySource(
    sourceId: string,
    types: string[] | undefined,
    callback: (relationships: Relationship[]) => void,
  ): UnsubscribeFn {
    const constraints: QueryConstraint[] = [where('sourceId', '==', sourceId)];

    if (types?.length && types.length <= 10) {
      constraints.push(where('type', 'in', types));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collection(db, this.COLLECTION), ...constraints);

    return onSnapshot(q, (snapshot) => {
      let items = snapshot.docs.map((d) => this.fromFirestore(d));
      if (types?.length && types.length > 10) {
        items = items.filter((r) => types.includes(r.type));
      }
      callback(items);
    });
  }

  // === Private ===

  private toFirestore(rel: Relationship): Record<string, any> {
    return {
      ...rel,
      createdAt: rel.createdAt,
      validFrom: rel.validFrom || null,
      validUntil: rel.validUntil || null,
    };
  }

  private fromFirestore(docSnap: DocumentSnapshot): Relationship {
    const data = docSnap.data()!;
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      validFrom: data.validFrom?.toDate?.() || undefined,
      validUntil: data.validUntil?.toDate?.() || undefined,
    } as Relationship;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

---

## Simplified Matching (Accept Limitations)

```typescript
// core/services/MatchingService.ts
import { nodeApi, relationshipApi } from '@/api';
import { BaseNode, NodeHelpers } from '@/core/models/BaseNode';
import { Relationship, RelationshipHelpers } from '@/core/models/Relationship';

export interface NeedMatch {
  need: Relationship;
  availableResources: BaseNode[];
}

/**
 * SIMPLE matching that accepts limitations:
 * - Client-side filtering (not infinitely scalable)
 * - Eventual consistency on availability
 * - No complex scoring
 */
export class MatchingService {
  /**
   * Find resources that can fulfill an activity's needs.
   * Uses client-side filtering - works for <1000 resources per context.
   */
  static async matchResourcesForActivity(
    activityId: string,
    context: string,
  ): Promise<NeedMatch[]> {
    // 1. Get activity's needs (usually 1-5)
    const needsResult = await relationshipApi.getBySource(activityId, ['needs']);
    const needs = needsResult.items;

    if (needs.length === 0) return [];

    // 2. Get ALL resources in context (accept limitation: <1000)
    const resourcesResult = await nodeApi.query({ context, type: 'resource' }, { pageSize: 500 });
    const allResources = resourcesResult.items;

    // 3. Get ALL commitments for these resources (batch query)
    const resourceIds = allResources.map((r) => r.id);
    const commitmentsMap = await relationshipApi.getBySourceBatch(resourceIds, [
      'committed_to',
      'reserved',
    ]);

    // 4. Filter available resources (client-side)
    const availableResources = allResources.filter((resource) => {
      const commitments = commitmentsMap.get(resource.id) || [];
      const activeCommitments = commitments.filter((c) => RelationshipHelpers.isValid(c));
      return activeCommitments.length === 0;
    });

    // 5. Match needs to available resources (client-side)
    const matches: NeedMatch[] = [];

    for (const need of needs) {
      const needType = need.attributes.needType as string;

      const matchingResources = availableResources.filter((resource) => {
        const capabilities = (resource.attributes.capabilities || []) as string[];
        return capabilities.includes(needType);
      });

      matches.push({
        need,
        availableResources: matchingResources,
      });
    }

    return matches;
  }

  /**
   * Check if a specific resource can fulfill a need.
   * Use this for "volunteer" actions.
   */
  static async canResourceFulfillNeed(
    resourceId: string,
    needId: string,
  ): Promise<{ canFulfill: boolean; reason?: string }> {
    const [resource, need] = await Promise.all([
      nodeApi.get(resourceId),
      relationshipApi.get(needId),
    ]);

    if (!resource) return { canFulfill: false, reason: 'Resource not found' };
    if (!need) return { canFulfill: false, reason: 'Need not found' };

    // Check capability
    const capabilities = (resource.attributes.capabilities || []) as string[];
    const needType = need.attributes.needType as string;

    if (!capabilities.includes(needType)) {
      return { canFulfill: false, reason: `Resource cannot fulfill ${needType}` };
    }

    // Check availability (current commitments)
    const commitmentsResult = await relationshipApi.getBySource(resourceId, [
      'committed_to',
      'reserved',
    ]);
    const activeCommitments = commitmentsResult.items.filter((c) => RelationshipHelpers.isValid(c));

    if (activeCommitments.length > 0) {
      return { canFulfill: false, reason: 'Resource is already committed' };
    }

    return { canFulfill: true };
  }

  /**
   * Commit a resource to a need.
   */
  static async commitResourceToNeed(
    resourceId: string,
    needId: string,
    activityId: string,
    userId: string,
  ): Promise<Relationship> {
    // Verify first
    const check = await this.canResourceFulfillNeed(resourceId, needId);
    if (!check.canFulfill) {
      throw new Error(check.reason);
    }

    // Create commitment relationship
    return relationshipApi.create({
      sourceId: resourceId,
      targetId: activityId,
      type: 'committed_to',
      createdBy: userId,
      attributes: {
        needId,
        committedAt: new Date().toISOString(),
      },
    });
  }
}
```

---

## Pinia Store with Realtime (Simplified Offline)

```typescript
// stores/nodes.ts
import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { nodeApi, relationshipApi } from '@/api';
import { BaseNode } from '@/core/models/BaseNode';
import { Relationship } from '@/core/models/Relationship';
import { UnsubscribeFn, QueryResult } from '@/api/types';

export const useNodesStore = defineStore('nodes', () => {
  // State
  const nodes = ref<Map<string, BaseNode>>(new Map());
  const relationships = ref<Map<string, Relationship[]>>(new Map()); // sourceId -> relationships
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Active subscriptions
  const subscriptions = shallowRef<Map<string, UnsubscribeFn>>(new Map());

  // === Actions ===

  async function fetchNode(id: string): Promise<BaseNode | null> {
    loading.value = true;
    error.value = null;

    try {
      const node = await nodeApi.get(id);
      if (node) nodes.value.set(id, node);
      return node;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function queryNodes(
    filters: { context?: string; type?: string; createdBy?: string },
    options?: { pageSize?: number },
  ): Promise<QueryResult<BaseNode>> {
    loading.value = true;
    error.value = null;

    try {
      const result = await nodeApi.query(filters, options);
      result.items.forEach((node) => nodes.value.set(node.id, node));
      return result;
    } catch (err: any) {
      error.value = err.message;
      return { items: [], cursor: null, hasMore: false };
    } finally {
      loading.value = false;
    }
  }

  async function createNode(data: Partial<BaseNode>): Promise<BaseNode | null> {
    loading.value = true;
    error.value = null;

    try {
      const node = await nodeApi.create(data);
      nodes.value.set(node.id, node);
      return node;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateNode(id: string, updates: Partial<BaseNode>): Promise<BaseNode | null> {
    loading.value = true;
    error.value = null;

    // Optimistic update
    const original = nodes.value.get(id);
    if (original) {
      nodes.value.set(id, { ...original, ...updates, updatedAt: new Date() });
    }

    try {
      const updated = await nodeApi.update(id, updates);
      nodes.value.set(id, updated);
      return updated;
    } catch (err: any) {
      // Rollback
      if (original) nodes.value.set(id, original);
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteNode(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      await nodeApi.delete(id);
      nodes.value.delete(id);
      return true;
    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  // === Relationships ===

  async function fetchRelationships(sourceId: string, types?: string[]): Promise<Relationship[]> {
    try {
      const result = await relationshipApi.getBySource(sourceId, types);
      relationships.value.set(sourceId, result.items);
      return result.items;
    } catch (err: any) {
      error.value = err.message;
      return [];
    }
  }

  async function createRelationship(data: Partial<Relationship>): Promise<Relationship | null> {
    try {
      const rel = await relationshipApi.create(data);

      // Update local cache
      const existing = relationships.value.get(rel.sourceId) || [];
      relationships.value.set(rel.sourceId, [...existing, rel]);

      return rel;
    } catch (err: any) {
      error.value = err.message;
      return null;
    }
  }

  // === REALTIME SUBSCRIPTIONS ===

  function subscribeToNode(nodeId: string): void {
    const key = `node:${nodeId}`;

    // Don't duplicate subscriptions
    if (subscriptions.value.has(key)) return;

    const unsubscribe = nodeApi.subscribe(nodeId, (node) => {
      if (node) {
        nodes.value.set(nodeId, node);
      } else {
        nodes.value.delete(nodeId);
      }
    });

    subscriptions.value.set(key, unsubscribe);
  }

  function subscribeToQuery(key: string, filters: { context?: string; type?: string }): void {
    if (subscriptions.value.has(key)) return;

    const unsubscribe = nodeApi.subscribeQuery(filters, (updatedNodes) => {
      updatedNodes.forEach((node) => nodes.value.set(node.id, node));
    });

    subscriptions.value.set(key, unsubscribe);
  }

  function subscribeToRelationships(sourceId: string, types?: string[]): void {
    const key = `rel:${sourceId}:${types?.join(',') || 'all'}`;

    if (subscriptions.value.has(key)) return;

    const unsubscribe = relationshipApi.subscribeBySource(sourceId, types, (rels) => {
      relationships.value.set(sourceId, rels);
    });

    subscriptions.value.set(key, unsubscribe);
  }

  function unsubscribe(key: string): void {
    const unsub = subscriptions.value.get(key);
    if (unsub) {
      unsub();
      subscriptions.value.delete(key);
    }
  }

  function unsubscribeAll(): void {
    subscriptions.value.forEach((unsub) => unsub());
    subscriptions.value.clear();
  }

  // === Getters ===

  const getNode = computed(() => (id: string) => nodes.value.get(id));

  const getNodesByType = computed(() => (context: string, type: string) => {
    return Array.from(nodes.value.values()).filter(
      (node) => node.context === context && node.type === type,
    );
  });

  const getRelationships = computed(
    () => (sourceId: string) => relationships.value.get(sourceId) || [],
  );

  return {
    // State
    nodes,
    relationships,
    loading,
    error,

    // Actions
    fetchNode,
    queryNodes,
    createNode,
    updateNode,
    deleteNode,
    fetchRelationships,
    createRelationship,

    // Subscriptions
    subscribeToNode,
    subscribeToQuery,
    subscribeToRelationships,
    unsubscribe,
    unsubscribeAll,

    // Getters
    getNode,
    getNodesByType,
    getRelationships,
  };
});
```

---

## Async Validators

```typescript
// core/validation/async-validators.ts
import { nodeApi } from '@/api';

export type AsyncValidationResult = {
  valid: boolean;
  errors: string[];
};

export type AsyncValidator<T> = (value: T) => Promise<AsyncValidationResult>;

// Check if context exists
export const contextExists: AsyncValidator<string> = async (context) => {
  const [domain, scope] = context.split(':');
  if (!scope) {
    return { valid: false, errors: ['Context must be in format "domain:scope"'] };
  }

  // Check if group exists
  const result = await nodeApi.query({ type: 'group', context });
  if (result.items.length === 0) {
    return { valid: false, errors: [`Context "${context}" does not exist`] };
  }

  return { valid: true, errors: [] };
};

// Check if resource is available
export const resourceAvailable: AsyncValidator<string> = async (resourceId) => {
  const { relationshipApi } = await import('@/api');

  const commitments = await relationshipApi.getBySource(resourceId, ['committed_to', 'reserved']);
  const activeCommitments = commitments.items.filter((c) => {
    if (c.validUntil && new Date() > c.validUntil) return false;
    return true;
  });

  if (activeCommitments.length > 0) {
    return { valid: false, errors: ['Resource is not available'] };
  }

  return { valid: true, errors: [] };
};

// Compose async validators
export async function validateAsync<T>(
  value: T,
  validators: AsyncValidator<T>[],
): Promise<AsyncValidationResult> {
  const errors: string[] = [];

  for (const validator of validators) {
    const result = await validator(value);
    if (!result.valid) {
      errors.push(...result.errors);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

---

## Revised Timeline (Realistic)

### Phase 1: Core (Week 1-2)

- **Day 1-2:** BaseNode, Relationship models
- **Day 3-4:** API abstraction layer + Firebase implementation
- **Day 5-6:** NodeApi with realtime subscriptions
- **Day 7-8:** RelationshipApi with realtime subscriptions
- **Day 9-10:** Pinia store with subscriptions

### Phase 2: Validation + Services (Week 3)

- **Day 1-2:** Sync + async validators
- **Day 3-4:** MatchingService (simplified)
- **Day 5:** Firebase indexes + security rules

### Phase 3: Context + UI (Week 4-5)

- **Day 1-2:** Activity/Resource context helpers
- **Day 3-4:** NodeCard, ActivityCard components
- **Day 5-7:** Activity creation flow
- **Day 8-10:** Resource management flow

### Phase 4: Integration (Week 6)

- **Day 1-2:** Notification basics (Cloud Function stubs)
- **Day 3-4:** Group management
- **Day 5:** Integration testing

### Phase 5: Polish (Week 7-8)

- **Day 1-3:** Bug fixes, edge cases
- **Day 4-5:** Performance testing
- **Day 6-7:** Documentation
- **Day 8-10:** Buffer for unknowns

---

## Summary of Fixes Applied

| Issue                | Original                         | Fixed                               |
| -------------------- | -------------------------------- | ----------------------------------- |
| Relationship ID      | Deterministic (breaks multi-rel) | Random by default                   |
| N+1 queries          | Loop with awaits                 | Batch queries, client-side filter   |
| No realtime          | getDocs only                     | onSnapshot subscriptions            |
| No API abstraction   | Services in components           | INodeApi/IRelationshipApi interface |
| Sync-only validation | Validators.ts                    | Added async-validators.ts           |
| Optimistic timeline  | 3 weeks                          | 7-8 weeks realistic                 |

**Deferred to v2:**

- Offline conflict resolution
- Complex scoring/recommendations
- Redis caching layer
- Load testing infrastructure

---

Ready to proceed? Switch to **agent mode** and I'll create the files in order.
