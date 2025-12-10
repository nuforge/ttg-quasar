Your adjustments are spot-on. Let me incorporate them into a refined proposal.

---

# Refined Graph Architecture Proposal

## Core Models

### BaseNode.ts

```typescript
// core/models/BaseNode.ts
export interface BaseNode {
  id: string;
  type: string;              // 'activity', 'resource', 'person', 'group', 'need'
  context: string;           // 'gaming:club-123', 'community:neighborhood-456'
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  attributes: Record<string, any>; // Includes '_meta:*' prefixed keys
  visibility: 'public' | 'private' | 'group' | 'selected';
}

// Pure functional helpers - no side effects
export const NodeHelpers = {
  getAttribute<T>(node: BaseNode, key: string, defaultValue?: T): T {
    return (node.attributes[key] ?? defaultValue) as T;
  },

  getMeta<T>(node: BaseNode, key: string, defaultValue?: T): T {
    return (node.attributes[`_meta:${key}`] ?? defaultValue) as T;
  },

  setAttribute(
    node: BaseNode,
    key: string,
    value: any,
    validator?: (key: string, value: any) => boolean
  ): BaseNode {
    if (validator && !validator(key, value)) {
      throw new Error(`Invalid value for attribute ${key}`);
    }
    return {
      ...node,
      attributes: { ...node.attributes, [key]: value },
      updatedAt: new Date()
    };
  },

  setMeta(node: BaseNode, key: string, value: any): BaseNode {
    return {
      ...node,
      attributes: { ...node.attributes, [`_meta:${key}`]: value },
      updatedAt: new Date()
    };
  },

  setAttributes(node: BaseNode, updates: Record<string, any>): BaseNode {
    return {
      ...node,
      attributes: { ...node.attributes, ...updates },
      updatedAt: new Date()
    };
  },

  // Get all non-meta attributes
  getPublicAttributes(node: BaseNode): Record<string, any> {
    return Object.fromEntries(
      Object.entries(node.attributes).filter(([key]) => !key.startsWith('_meta:'))
    );
  },

  // Pattern matching
  matches(node: BaseNode, pattern: {
    type?: string;
    context?: string;
    attributes?: Record<string, any>;
  }): boolean {
    if (pattern.type && node.type !== pattern.type) return false;
    if (pattern.context && !node.context.startsWith(pattern.context)) return false;
    if (pattern.attributes) {
      for (const [key, value] of Object.entries(pattern.attributes)) {
        if (node.attributes[key] !== value) return false;
      }
    }
    return true;
  },

  isType(node: BaseNode, type: string): boolean {
    return node.type === type;
  },

  inContext(node: BaseNode, context: string): boolean {
    return node.context.startsWith(context);
  }
};
```

### Relationship.ts

```typescript
// core/models/Relationship.ts
export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;              // 'needs', 'provides', 'attends', 'owns', 'hosts'
  createdBy: string;
  createdAt: Date;
  attributes: Record<string, any>;
  validFrom?: Date;
  validUntil?: Date;
}

export const RelationshipHelpers = {
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
      attributes: { ...rel.attributes, [key]: value }
    };
  },

  // Generate deterministic ID for unique constraints
  generateId(sourceId: string, targetId: string, type: string): string {
    return `${sourceId}_${targetId}_${type}`;
  }
};
```

---

## Services with Error Handling & Pagination

### NodeService.ts

```typescript
// core/services/NodeService.ts
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter,
  writeBatch, serverTimestamp,
  DocumentSnapshot, QueryConstraint
} from 'firebase/firestore';
import { db } from '@/firebase';
import { BaseNode, NodeHelpers } from '@/core/models/BaseNode';

export interface QueryOptions {
  pageSize?: number;
  cursor?: DocumentSnapshot;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface QueryResult<T> {
  items: T[];
  cursor: DocumentSnapshot | null;
  hasMore: boolean;
}

export interface BatchResult {
  success: boolean;
  successCount: number;
  failedIds: string[];
  errors: Array<{ id: string; error: string }>;
}

export class NodeService {
  private static readonly COLLECTION = 'nodes';
  private static readonly DEFAULT_PAGE_SIZE = 25;
  private static readonly MAX_BATCH_SIZE = 500; // Firestore limit

  // === CRUD Operations ===

  static async create(data: Partial<BaseNode>): Promise<BaseNode> {
    const nodeId = data.id || this.generateId();
    const node: BaseNode = {
      id: nodeId,
      type: data.type || 'unknown',
      context: data.context || 'global',
      createdBy: data.createdBy || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      attributes: data.attributes || {},
      visibility: data.visibility || 'public'
    };

    try {
      await setDoc(doc(db, this.COLLECTION, nodeId), this.toFirestore(node));
      return node;
    } catch (error) {
      throw new NodeServiceError('CREATE_FAILED', `Failed to create node: ${error}`, nodeId);
    }
  }

  static async get(id: string): Promise<BaseNode | null> {
    try {
      const docSnap = await getDoc(doc(db, this.COLLECTION, id));
      if (!docSnap.exists()) return null;
      return this.fromFirestore(docSnap);
    } catch (error) {
      throw new NodeServiceError('GET_FAILED', `Failed to get node: ${error}`, id);
    }
  }

  static async update(id: string, updates: Partial<BaseNode>): Promise<BaseNode> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.createdBy;

      await updateDoc(doc(db, this.COLLECTION, id), updateData);
      
      const updated = await this.get(id);
      if (!updated) throw new Error('Node not found after update');
      return updated;
    } catch (error) {
      throw new NodeServiceError('UPDATE_FAILED', `Failed to update node: ${error}`, id);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, id));
    } catch (error) {
      throw new NodeServiceError('DELETE_FAILED', `Failed to delete node: ${error}`, id);
    }
  }

  // === Query Operations with Pagination ===

  static async query(
    filters: {
      context?: string;
      type?: string;
      createdBy?: string;
      visibility?: string;
    },
    options: QueryOptions = {}
  ): Promise<QueryResult<BaseNode>> {
    const pageSize = options.pageSize || this.DEFAULT_PAGE_SIZE;
    const constraints: QueryConstraint[] = [];

    if (filters.context) constraints.push(where('context', '==', filters.context));
    if (filters.type) constraints.push(where('type', '==', filters.type));
    if (filters.createdBy) constraints.push(where('createdBy', '==', filters.createdBy));
    if (filters.visibility) constraints.push(where('visibility', '==', filters.visibility));

    constraints.push(
      orderBy(options.orderByField || 'createdAt', options.orderDirection || 'desc')
    );
    constraints.push(limit(pageSize + 1)); // +1 to check hasMore

    if (options.cursor) {
      constraints.push(startAfter(options.cursor));
    }

    try {
      const q = query(collection(db, this.COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      const hasMore = snapshot.docs.length > pageSize;
      const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;
      
      return {
        items: docs.map(d => this.fromFirestore(d)),
        cursor: docs.length > 0 ? docs[docs.length - 1] : null,
        hasMore
      };
    } catch (error) {
      throw new NodeServiceError('QUERY_FAILED', `Failed to query nodes: ${error}`);
    }
  }

  // === Batch Operations with Error Handling ===

  static async createBatch(nodes: Partial<BaseNode>[]): Promise<BatchResult> {
    const results: BatchResult = {
      success: true,
      successCount: 0,
      failedIds: [],
      errors: []
    };

    // Chunk into Firestore batch limits
    const chunks = this.chunkArray(nodes, this.MAX_BATCH_SIZE);

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      const chunkNodes: BaseNode[] = [];

      for (const data of chunk) {
        const nodeId = data.id || this.generateId();
        const node: BaseNode = {
          id: nodeId,
          type: data.type || 'unknown',
          context: data.context || 'global',
          createdBy: data.createdBy || 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          attributes: data.attributes || {},
          visibility: data.visibility || 'public'
        };
        
        batch.set(doc(db, this.COLLECTION, nodeId), this.toFirestore(node));
        chunkNodes.push(node);
      }

      try {
        await batch.commit();
        results.successCount += chunkNodes.length;
      } catch (error) {
        results.success = false;
        for (const node of chunkNodes) {
          results.failedIds.push(node.id);
          results.errors.push({ id: node.id, error: String(error) });
        }
      }
    }

    return results;
  }

  static async deleteBatch(ids: string[]): Promise<BatchResult> {
    const results: BatchResult = {
      success: true,
      successCount: 0,
      failedIds: [],
      errors: []
    };

    const chunks = this.chunkArray(ids, this.MAX_BATCH_SIZE);

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      
      for (const id of chunk) {
        batch.delete(doc(db, this.COLLECTION, id));
      }

      try {
        await batch.commit();
        results.successCount += chunk.length;
      } catch (error) {
        results.success = false;
        for (const id of chunk) {
          results.failedIds.push(id);
          results.errors.push({ id, error: String(error) });
        }
      }
    }

    return results;
  }

  // === Batch Fetch (for graph queries) ===

  static async getBatch(ids: string[]): Promise<Map<string, BaseNode>> {
    const results = new Map<string, BaseNode>();
    
    // Firestore 'in' operator limited to 10 items
    const chunks = this.chunkArray(ids, 10);

    for (const chunk of chunks) {
      try {
        const q = query(
          collection(db, this.COLLECTION),
          where('__name__', 'in', chunk)
        );
        const snapshot = await getDocs(q);
        
        for (const docSnap of snapshot.docs) {
          results.set(docSnap.id, this.fromFirestore(docSnap));
        }
      } catch (error) {
        console.error(`Batch fetch failed for chunk: ${error}`);
        // Continue with other chunks
      }
    }

    return results;
  }

  // === Converters ===

  private static toFirestore(node: BaseNode): Record<string, any> {
    return {
      ...node,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt
    };
  }

  private static fromFirestore(docSnap: DocumentSnapshot): BaseNode {
    const data = docSnap.data()!;
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
    } as BaseNode;
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Custom error class
export class NodeServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public nodeId?: string
  ) {
    super(message);
    this.name = 'NodeServiceError';
  }
}
```

### RelationshipService.ts

```typescript
// core/services/RelationshipService.ts
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, writeBatch,
  DocumentSnapshot, QueryConstraint
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Relationship, RelationshipHelpers } from '@/core/models/Relationship';
import { QueryOptions, QueryResult, BatchResult } from './NodeService';

export class RelationshipService {
  private static readonly COLLECTION = 'relationships';
  private static readonly DEFAULT_PAGE_SIZE = 50;
  private static readonly MAX_BATCH_SIZE = 500;

  // === CRUD ===

  static async create(data: Partial<Relationship>): Promise<Relationship> {
    const relId = data.id || RelationshipHelpers.generateId(
      data.sourceId!, data.targetId!, data.type!
    );
    
    const rel: Relationship = {
      id: relId,
      sourceId: data.sourceId!,
      targetId: data.targetId!,
      type: data.type!,
      createdBy: data.createdBy || 'system',
      createdAt: new Date(),
      attributes: data.attributes || {},
      validFrom: data.validFrom,
      validUntil: data.validUntil
    };

    try {
      await setDoc(doc(db, this.COLLECTION, relId), this.toFirestore(rel));
      return rel;
    } catch (error) {
      throw new RelationshipServiceError('CREATE_FAILED', `Failed to create relationship: ${error}`, relId);
    }
  }

  static async get(id: string): Promise<Relationship | null> {
    try {
      const docSnap = await getDoc(doc(db, this.COLLECTION, id));
      if (!docSnap.exists()) return null;
      return this.fromFirestore(docSnap);
    } catch (error) {
      throw new RelationshipServiceError('GET_FAILED', `Failed to get relationship: ${error}`, id);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, id));
    } catch (error) {
      throw new RelationshipServiceError('DELETE_FAILED', `Failed to delete relationship: ${error}`, id);
    }
  }

  // === Queries with Pagination ===

  static async getBySource(
    sourceId: string,
    types?: string[],
    options: QueryOptions = {}
  ): Promise<QueryResult<Relationship>> {
    const pageSize = options.pageSize || this.DEFAULT_PAGE_SIZE;
    const constraints: QueryConstraint[] = [
      where('sourceId', '==', sourceId)
    ];

    if (types?.length) {
      // Firestore 'in' limited to 10
      if (types.length <= 10) {
        constraints.push(where('type', 'in', types));
      }
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageSize + 1));

    if (options.cursor) {
      constraints.push(startAfter(options.cursor));
    }

    try {
      const q = query(collection(db, this.COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      const hasMore = snapshot.docs.length > pageSize;
      const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;
      
      let items = docs.map(d => this.fromFirestore(d));
      
      // Client-side filter if types > 10
      if (types?.length && types.length > 10) {
        items = items.filter(r => types.includes(r.type));
      }

      return {
        items,
        cursor: docs.length > 0 ? docs[docs.length - 1] : null,
        hasMore
      };
    } catch (error) {
      throw new RelationshipServiceError('QUERY_FAILED', `Failed to query relationships: ${error}`);
    }
  }

  static async getByTarget(
    targetId: string,
    types?: string[],
    options: QueryOptions = {}
  ): Promise<QueryResult<Relationship>> {
    const pageSize = options.pageSize || this.DEFAULT_PAGE_SIZE;
    const constraints: QueryConstraint[] = [
      where('targetId', '==', targetId)
    ];

    if (types?.length && types.length <= 10) {
      constraints.push(where('type', 'in', types));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageSize + 1));

    if (options.cursor) {
      constraints.push(startAfter(options.cursor));
    }

    try {
      const q = query(collection(db, this.COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      const hasMore = snapshot.docs.length > pageSize;
      const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

      return {
        items: docs.map(d => this.fromFirestore(d)),
        cursor: docs.length > 0 ? docs[docs.length - 1] : null,
        hasMore
      };
    } catch (error) {
      throw new RelationshipServiceError('QUERY_FAILED', `Failed to query relationships: ${error}`);
    }
  }

  // === Batch Operations ===

  static async getBySourceBatch(
    sourceIds: string[],
    types?: string[]
  ): Promise<Map<string, Relationship[]>> {
    const results = new Map<string, Relationship[]>();
    
    // Initialize empty arrays
    sourceIds.forEach(id => results.set(id, []));
    
    // Chunk sourceIds for 'in' operator
    const chunks = this.chunkArray(sourceIds, 10);

    for (const chunk of chunks) {
      try {
        let q = query(
          collection(db, this.COLLECTION),
          where('sourceId', 'in', chunk)
        );

        if (types?.length && types.length <= 10) {
          q = query(q, where('type', 'in', types));
        }

        const snapshot = await getDocs(q);
        
        for (const docSnap of snapshot.docs) {
          const rel = this.fromFirestore(docSnap);
          
          // Client-side type filter if needed
          if (types?.length && types.length > 10 && !types.includes(rel.type)) {
            continue;
          }
          
          const existing = results.get(rel.sourceId) || [];
          existing.push(rel);
          results.set(rel.sourceId, existing);
        }
      } catch (error) {
        console.error(`Batch relationship fetch failed: ${error}`);
      }
    }

    return results;
  }

  static async createBatch(relationships: Partial<Relationship>[]): Promise<BatchResult> {
    const results: BatchResult = {
      success: true,
      successCount: 0,
      failedIds: [],
      errors: []
    };

    const chunks = this.chunkArray(relationships, this.MAX_BATCH_SIZE);

    for (const chunk of chunks) {
      const batch = writeBatch(db);

      for (const data of chunk) {
        const relId = data.id || RelationshipHelpers.generateId(
          data.sourceId!, data.targetId!, data.type!
        );
        
        const rel: Relationship = {
          id: relId,
          sourceId: data.sourceId!,
          targetId: data.targetId!,
          type: data.type!,
          createdBy: data.createdBy || 'system',
          createdAt: new Date(),
          attributes: data.attributes || {},
          validFrom: data.validFrom,
          validUntil: data.validUntil
        };

        batch.set(doc(db, this.COLLECTION, relId), this.toFirestore(rel));
      }

      try {
        await batch.commit();
        results.successCount += chunk.length;
      } catch (error) {
        results.success = false;
        for (const data of chunk) {
          const id = data.id || 'unknown';
          results.failedIds.push(id);
          results.errors.push({ id, error: String(error) });
        }
      }
    }

    return results;
  }

  // === Converters ===

  private static toFirestore(rel: Relationship): Record<string, any> {
    return {
      ...rel,
      createdAt: rel.createdAt,
      validFrom: rel.validFrom || null,
      validUntil: rel.validUntil || null
    };
  }

  private static fromFirestore(docSnap: DocumentSnapshot): Relationship {
    const data = docSnap.data()!;
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      validFrom: data.validFrom?.toDate?.() || undefined,
      validUntil: data.validUntil?.toDate?.() || undefined
    } as Relationship;
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export class RelationshipServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public relationshipId?: string
  ) {
    super(message);
    this.name = 'RelationshipServiceError';
  }
}
```

---

## Validation Layer

```typescript
// core/validation/validators.ts
export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export type Validator<T> = (value: T) => ValidationResult;

// Compose validators
export function compose<T>(...validators: Validator<T>[]): Validator<T> {
  return (value: T) => {
    const errors: string[] = [];
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }
    return { valid: errors.length === 0, errors };
  };
}

// Common validators
export const required = (fieldName: string): Validator<any> => (value) => ({
  valid: value !== undefined && value !== null && value !== '',
  errors: value === undefined || value === null || value === '' 
    ? [`${fieldName} is required`] : []
});

export const minLength = (fieldName: string, min: number): Validator<string> => (value) => ({
  valid: !value || value.length >= min,
  errors: value && value.length < min 
    ? [`${fieldName} must be at least ${min} characters`] : []
});

export const maxLength = (fieldName: string, max: number): Validator<string> => (value) => ({
  valid: !value || value.length <= max,
  errors: value && value.length > max 
    ? [`${fieldName} must be at most ${max} characters`] : []
});

export const isOneOf = <T>(fieldName: string, allowedValues: T[]): Validator<T> => (value) => ({
  valid: allowedValues.includes(value),
  errors: !allowedValues.includes(value) 
    ? [`${fieldName} must be one of: ${allowedValues.join(', ')}`] : []
});

export const isValidDate = (fieldName: string): Validator<string> => (value) => {
  if (!value) return { valid: true, errors: [] };
  const date = new Date(value);
  return {
    valid: !isNaN(date.getTime()),
    errors: isNaN(date.getTime()) ? [`${fieldName} must be a valid date`] : []
  };
};

export const isFutureDate = (fieldName: string): Validator<string> => (value) => {
  if (!value) return { valid: true, errors: [] };
  const date = new Date(value);
  return {
    valid: date > new Date(),
    errors: date <= new Date() ? [`${fieldName} must be in the future`] : []
  };
};
```

```typescript
// core/validation/node-validators.ts
import { BaseNode } from '@/core/models/BaseNode';
import { compose, required, isOneOf, ValidationResult, Validator } from './validators';

export const validateBaseNode: Validator<Partial<BaseNode>> = (node) => {
  const errors: string[] = [];

  // Required fields
  if (!node.type) errors.push('type is required');
  if (!node.context) errors.push('context is required');
  if (!node.createdBy) errors.push('createdBy is required');

  // Visibility enum
  if (node.visibility && !['public', 'private', 'group', 'selected'].includes(node.visibility)) {
    errors.push('visibility must be one of: public, private, group, selected');
  }

  // Context format: 'domain:scope'
  if (node.context && !node.context.includes(':')) {
    errors.push('context must be in format "domain:scope" (e.g., "gaming:club-123")');
  }

  return { valid: errors.length === 0, errors };
};

// Activity-specific validation
export const validateActivity: Validator<Partial<BaseNode>> = (node) => {
  const baseResult = validateBaseNode(node);
  const errors = [...baseResult.errors];

  const attrs = node.attributes || {};
  
  if (!attrs.title) errors.push('title attribute is required for activities');
  if (!attrs.date) errors.push('date attribute is required for activities');
  if (!attrs.time) errors.push('time attribute is required for activities');
  
  if (attrs.date) {
    const date = new Date(attrs.date);
    if (isNaN(date.getTime())) errors.push('date must be a valid date');
  }

  return { valid: errors.length === 0, errors };
};

// Resource-specific validation
export const validateResource: Validator<Partial<BaseNode>> = (node) => {
  const baseResult = validateBaseNode(node);
  const errors = [...baseResult.errors];

  const attrs = node.attributes || {};
  
  if (!attrs.name) errors.push('name attribute is required for resources');
  if (!attrs.resourceType) errors.push('resourceType attribute is required for resources');

  return { valid: errors.length === 0, errors };
};
```

---

## GraphService with Eventual Consistency

```typescript
// core/services/GraphService.ts
import { NodeService, QueryOptions, QueryResult } from './NodeService';
import { RelationshipService } from './RelationshipService';
import { BaseNode } from '@/core/models/BaseNode';
import { Relationship, RelationshipHelpers } from '@/core/models/Relationship';

export interface GraphNode {
  node: BaseNode;
  relationships: {
    outgoing: Relationship[];
    incoming: Relationship[];
  };
}

export interface MatchResult {
  need: Relationship;
  resources: BaseNode[];
}

export class GraphService {
  
  // === Node with Relationships ===

  static async getNodeWithRelationships(
    nodeId: string,
    options?: {
      outgoingTypes?: string[];
      incomingTypes?: string[];
    }
  ): Promise<GraphNode | null> {
    const node = await NodeService.get(nodeId);
    if (!node) return null;

    const [outgoing, incoming] = await Promise.all([
      RelationshipService.getBySource(nodeId, options?.outgoingTypes),
      RelationshipService.getByTarget(nodeId, options?.incomingTypes)
    ]);

    return {
      node,
      relationships: {
        outgoing: outgoing.items,
        incoming: incoming.items
      }
    };
  }

  // === Needs/Resources Matching (no denormalization) ===

  static async getNeeds(activityId: string): Promise<Relationship[]> {
    const result = await RelationshipService.getBySource(activityId, ['needs']);
    return result.items;
  }

  static async findResourcesForNeed(
    needType: string,
    context: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<BaseNode>> {
    // Query resources that can fulfill this need type
    // Resources store their capabilities in attributes
    return NodeService.query({
      type: 'resource',
      context
    }, options);
    // Then filter client-side by capabilities
    // (Firestore can't query array contains on nested attributes efficiently)
  }

  static async matchNeedsWithResources(
    activityId: string,
    context: string
  ): Promise<MatchResult[]> {
    const needs = await this.getNeeds(activityId);
    const results: MatchResult[] = [];

    for (const need of needs) {
      const needType = need.attributes.needType;
      
      // Get potential resources
      const resourcesResult = await this.findResourcesForNeed(needType, context);
      
      // Filter by capabilities and availability
      const availableResources: BaseNode[] = [];
      
      for (const resource of resourcesResult.items) {
        const capabilities = resource.attributes.capabilities || [];
        
        if (capabilities.includes(needType)) {
          // Check if resource is not already committed elsewhere
          // Accept eventual consistency here - Cloud Functions will update
          const commitments = await RelationshipService.getBySource(
            resource.id, 
            ['committed_to']
          );
          
          const activeCommitments = commitments.items.filter(r => 
            RelationshipHelpers.isValid(r)
          );
          
          if (activeCommitments.length === 0) {
            availableResources.push(resource);
          }
        }
      }
      
      results.push({ need, resources: availableResources });
    }

    return results;
  }

  // === Traverse Relationships ===

  static async traverse(
    startNodeId: string,
    relationshipTypes: string[],
    depth: number = 1,
    direction: 'outgoing' | 'incoming' | 'both' = 'outgoing'
  ): Promise<Map<string, BaseNode>> {
    const visited = new Map<string, BaseNode>();
    const toVisit = [startNodeId];
    let currentDepth = 0;

    while (toVisit.length > 0 && currentDepth < depth) {
      const currentBatch = [...toVisit];
      toVisit.length = 0;

      // Batch fetch relationships
      const relationshipMap = await RelationshipService.getBySourceBatch(
        currentBatch, 
        relationshipTypes
      );

      // Collect next nodes to visit
      const nextNodeIds: string[] = [];
      
      for (const [sourceId, relationships] of relationshipMap) {
        for (const rel of relationships) {
          const targetId = direction === 'incoming' ? rel.sourceId : rel.targetId;
          
          if (!visited.has(targetId) && !nextNodeIds.includes(targetId)) {
            nextNodeIds.push(targetId);
          }
        }
      }

      // Batch fetch nodes
      if (nextNodeIds.length > 0) {
        const nodes = await NodeService.getBatch(nextNodeIds);
        
        for (const [id, node] of nodes) {
          visited.set(id, node);
          toVisit.push(id);
        }
      }

      currentDepth++;
    }

    return visited;
  }
}
```

---

## Cloud Function for Meta Updates (Eventual Consistency)

```typescript
// functions/src/meta-updates.ts
// Deploy as Firebase Cloud Function

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Update meta when relationships change
export const onRelationshipCreate = functions.firestore
  .document('relationships/{relId}')
  .onCreate(async (snap, context) => {
    const rel = snap.data();
    
    // Update source node meta
    await updateNodeMeta(rel.sourceId, 'outgoingCount', 1);
    
    // Update target node meta
    await updateNodeMeta(rel.targetId, 'incomingCount', 1);
  });

export const onRelationshipDelete = functions.firestore
  .document('relationships/{relId}')
  .onDelete(async (snap, context) => {
    const rel = snap.data();
    
    await updateNodeMeta(rel.sourceId, 'outgoingCount', -1);
    await updateNodeMeta(rel.targetId, 'incomingCount', -1);
  });

async function updateNodeMeta(
  nodeId: string, 
  metaKey: string, 
  delta: number
): Promise<void> {
  const nodeRef = db.collection('nodes').doc(nodeId);
  
  await db.runTransaction(async (transaction) => {
    const nodeDoc = await transaction.get(nodeRef);
    if (!nodeDoc.exists) return;
    
    const current = nodeDoc.data()?.attributes?.[`_meta:${metaKey}`] || 0;
    
    transaction.update(nodeRef, {
      [`attributes._meta:${metaKey}`]: current + delta,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
}

// Update last activity timestamp
export const onNodeUpdate = functions.firestore
  .document('nodes/{nodeId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Skip if only meta changed
    const beforeAttrs = Object.keys(before.attributes || {})
      .filter(k => !k.startsWith('_meta:'));
    const afterAttrs = Object.keys(after.attributes || {})
      .filter(k => !k.startsWith('_meta:'));
    
    if (JSON.stringify(beforeAttrs) === JSON.stringify(afterAttrs)) {
      return;
    }
    
    // Update context-level activity tracker (for feeds)
    const context = after.context;
    if (context) {
      await db.collection('contextActivity').doc(context.replace(':', '_')).set({
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        lastNodeId: context.params.nodeId,
        lastNodeType: after.type
      }, { merge: true });
    }
  });
```

---

## Offline Support (Pinia Store)

```typescript
// stores/nodes.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  enableIndexedDbPersistence, 
  disableNetwork, 
  enableNetwork 
} from 'firebase/firestore';
import { db } from '@/firebase';
import { NodeService, QueryResult } from '@/core/services/NodeService';
import { BaseNode } from '@/core/models/BaseNode';

export const useNodesStore = defineStore('nodes', () => {
  // State
  const nodes = ref<Map<string, BaseNode>>(new Map());
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isOffline = ref(false);
  const pendingWrites = ref<Array<{ type: 'create' | 'update' | 'delete'; data: any }>>([]); 

  // Initialize offline persistence
  async function initOfflineSupport(): Promise<void> {
    try {
      await enableIndexedDbPersistence(db);
      console.log('Offline persistence enabled');
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, offline persistence only available in one tab');
      } else if (err.code === 'unimplemented') {
        console.warn('Browser does not support offline persistence');
      }
    }
  }

  // Network status
  async function goOffline(): Promise<void> {
    await disableNetwork(db);
    isOffline.value = true;
  }

  async function goOnline(): Promise<void> {
    await enableNetwork(db);
    isOffline.value = false;
    await syncPendingWrites();
  }

  // Sync pending writes when back online
  async function syncPendingWrites(): Promise<void> {
    const pending = [...pendingWrites.value];
    pendingWrites.value = [];

    for (const write of pending) {
      try {
        switch (write.type) {
          case 'create':
            await NodeService.create(write.data);
            break;
          case 'update':
            await NodeService.update(write.data.id, write.data);
            break;
          case 'delete':
            await NodeService.delete(write.data.id);
            break;
        }
      } catch (err) {
        console.error('Failed to sync pending write:', err);
        pendingWrites.value.push(write);
      }
    }
  }

  // Actions
  async function fetchNode(id: string): Promise<BaseNode | null> {
    loading.value = true;
    error.value = null;
    
    try {
      const node = await NodeService.get(id);
      if (node) {
        nodes.value.set(id, node);
      }
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
    options?: { pageSize?: number }
  ): Promise<QueryResult<BaseNode>> {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await NodeService.query(filters, options);
      result.items.forEach(node => nodes.value.set(node.id, node));
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
      const node = await NodeService.create(data);
      nodes.value.set(node.id, node);
      return node;
    } catch (err: any) {
      if (isOffline.value) {
        // Queue for later
        const tempNode: BaseNode = {
          id: data.id || `temp_${Date.now()}`,
          type: data.type || 'unknown',
          context: data.context || 'global',
          createdBy: data.createdBy || 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          attributes: data.attributes || {},
          visibility: data.visibility || 'public'
        };
        nodes.value.set(tempNode.id, tempNode);
        pendingWrites.value.push({ type: 'create', data });
        return tempNode;
      }
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateNodeAttribute(
    nodeId: string, 
    key: string, 
    value: any
  ): Promise<void> {
    const node = nodes.value.get(nodeId);
    if (!node) return;

    // Optimistic update
    const updatedNode = {
      ...node,
      attributes: { ...node.attributes, [key]: value },
      updatedAt: new Date()
    };
    nodes.value.set(nodeId, updatedNode);

    try {
      await NodeService.update(nodeId, {
        attributes: updatedNode.attributes
      });
    } catch (err: any) {
      if (isOffline.value) {
        pendingWrites.value.push({ type: 'update', data: updatedNode });
      } else {
        // Rollback
        nodes.value.set(nodeId, node);
        error.value = err.message;
      }
    }
  }

  // Getters
  const getNode = computed(() => (id: string) => nodes.value.get(id));
  
  const getNodesByType = computed(() => (context: string, type: string) => {
    return Array.from(nodes.value.values()).filter(
      node => node.context === context && node.type === type
    );
  });

  const hasPendingWrites = computed(() => pendingWrites.value.length > 0);

  return {
    // State
    nodes,
    loading,
    error,
    isOffline,
    pendingWrites,
    
    // Actions
    initOfflineSupport,
    goOffline,
    goOnline,
    fetchNode,
    queryNodes,
    createNode,
    updateNodeAttribute,
    
    // Getters
    getNode,
    getNodesByType,
    hasPendingWrites
  };
});
```

---

## Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "nodes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "context", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "nodes",
      "queryScope": "COLLECTION", 
      "fields": [
        { "fieldPath": "context", "order": "ASCENDING" },
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "nodes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdBy", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "relationships",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sourceId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "relationships",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "targetId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "relationships",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sourceId", "order": "ASCENDING" },
        { "fieldPath": "validUntil", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## Revised Timeline (4-5 weeks)

### Week 1: Core foundation
- Day 1-2: BaseNode, Relationship models + helpers + validators
- Day 3-4: NodeService, RelationshipService with error handling + pagination
- Day 5: Firebase indexes + security rules + basic tests

### Week 2: Graph layer + stores
- Day 1-2: GraphService with batch queries
- Day 3: Pinia stores with offline support
- Day 4-5: Cloud Functions for meta updates

### Week 3: Activity/Resource context + UI
- Day 1: ActivityResourceContext helpers
- Day 2-3: NodeCard, ActivityCard, ResourceCard components
- Day 4-5: Activity creation flow with needs

### Week 4: Features + integration
- Day 1-2: Resource matching/recommendations
- Day 3: Notification/trigger system basics
- Day 4-5: Group management

### Week 5: Polish + buffer
- Day 1-2: Testing, bug fixes
- Day 3: Performance optimization
- Day 4-5: Documentation, buffer for unexpected issues

---

This refined proposal addresses:

✅ Batch queries with chunking  
✅ Composite indexes  
✅ `_meta:*` prefixed attributes (no separate field)  
✅ No denormalization in writes (Cloud Functions for aggregates)  
✅ Error handling for batch operations  
✅ Pagination for graph queries  
✅ Offline support  
✅ Data validation layer  
✅ Realistic 4-5 week timeline  

Ready to proceed with implementation. Switch to **agent mode** when you want to start creating the files.