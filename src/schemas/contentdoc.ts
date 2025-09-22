/**
 * ContentDoc Schema for TTG ↔ CLCA Integration
 * Defines the unified content structure for cross-system communication
 */

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
  'feat:event/v1'?: EventFeature;
  'feat:game/v1'?: GameFeature;
}

export interface EventFeature {
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  location: string;
  minPlayers?: number;
  maxPlayers?: number;
}

export interface GameFeature {
  gameId: string;
  gameName: string;
  genre?: string;
  playerCount?: number | string;
}

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

/**
 * Validation schema for ContentDoc (AJV compatible)
 */
export const contentDocSchema = {
  type: 'object',
  required: ['id', 'title', 'status', 'tags', 'features', 'ownerSystem', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    status: {
      type: 'string',
      enum: ['draft', 'published', 'pending', 'archived', 'deleted'],
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    features: {
      type: 'object',
      properties: {
        'feat:event/v1': {
          type: 'object',
          required: ['startTime', 'endTime', 'location'],
          properties: {
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            location: { type: 'string', minLength: 1 },
            minPlayers: { type: 'number', minimum: 1 },
            maxPlayers: { type: 'number', minimum: 1 },
          },
        },
        'feat:game/v1': {
          type: 'object',
          required: ['gameId', 'gameName'],
          properties: {
            gameId: { type: 'string', minLength: 1 },
            gameName: { type: 'string', minLength: 1 },
            genre: { type: 'string' },
            playerCount: { oneOf: [{ type: 'number' }, { type: 'string' }] },
          },
        },
      },
    },
    rsvpSummary: {
      type: 'object',
      required: ['yes', 'no'],
      properties: {
        yes: { type: 'number', minimum: 0 },
        no: { type: 'number', minimum: 0 },
        maybe: { type: 'number', minimum: 0 },
        waitlist: { type: 'number', minimum: 0 },
        capacity: { oneOf: [{ type: 'number', minimum: 1 }, { type: 'null' }] },
      },
    },
    images: {
      type: 'array',
      items: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri' },
          caption: { type: 'string' },
          width: { type: 'number', minimum: 1 },
          height: { type: 'number', minimum: 1 },
        },
      },
    },
    ownerSystem: { type: 'string', enum: ['ttg', 'clca'] },
    originalId: { type: 'string' },
    ownerUrl: { type: 'string', format: 'uri' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  additionalProperties: false,
};

/**
 * Sample ContentDoc for testing and validation
 */
export const sampleEventContentDoc: ContentDoc = {
  id: 'ttg:event:123456',
  title: 'Board Game Night - Wingspan',
  description: 'Join us for an evening of strategic bird-themed gameplay!',
  status: 'published',
  tags: [
    'content-type:event',
    'system:ttg',
    'game-genre:strategy',
    'event-type:game_night',
    'game-id:wingspan',
  ],
  features: {
    'feat:event/v1': {
      startTime: '2024-12-15T19:00:00.000Z',
      endTime: '2024-12-15T22:00:00.000Z',
      location: 'Community Center Gaming Room',
      minPlayers: 2,
      maxPlayers: 6,
    },
    'feat:game/v1': {
      gameId: 'wingspan',
      gameName: 'Wingspan',
      genre: 'Strategy',
      playerCount: '2-5 players',
    },
  },
  rsvpSummary: {
    yes: 4,
    no: 1,
    maybe: 2,
    waitlist: 0,
    capacity: 6,
  },
  images: [
    {
      url: 'https://example.com/wingspan-cover.jpg',
      caption: 'Wingspan board game cover',
      width: 500,
      height: 500,
    },
  ],
  ownerSystem: 'ttg',
  originalId: 'event:123456',
  ownerUrl: 'https://ttg.example.com/events/123456/board-game-night-wingspan',
  createdAt: '2024-12-01T10:00:00.000Z',
  updatedAt: '2024-12-01T15:30:00.000Z',
};
