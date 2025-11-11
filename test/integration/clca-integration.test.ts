/**
 * CLCA Integration Contract Tests
 * Tests ContentDoc schema validation and mapping services
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContentDocMappingService } from 'src/services/contentdoc-mapping-service';
import { CLCAIngestService } from 'src/services/clca-ingest-service';
import { contentDocSchema, sampleEventContentDoc } from 'src/schemas/contentdoc';
import type { ContentDoc } from 'src/schemas/contentdoc';
import Ajv from 'ajv';
// import addFormats from 'ajv-formats'; // Disabled due to compatibility issues
import { Event } from 'src/models/Event';
import { Game } from 'src/models/Game';

describe('CLCA Integration Contract Tests', () => {
  let mappingService: ContentDocMappingService;
  let ingestService: CLCAIngestService;
  let ajv: ReturnType<typeof Ajv>;
  let validate: ReturnType<typeof ajv.compile>;

  beforeEach(() => {
    mappingService = new ContentDocMappingService();
    ingestService = new CLCAIngestService();
    ajv = new Ajv({ allErrors: true });
    // addFormats(ajv); // Disabled due to compatibility issues
    validate = ajv.compile(contentDocSchema);
  });

  describe('ContentDoc Schema Validation', () => {
    it('should validate the sample ContentDoc', () => {
      const isValid = validate(sampleEventContentDoc);

      if (!isValid) {
        console.error('Validation errors:', validate.errors);
      }

      expect(isValid).toBe(true);
    });

    it('should reject ContentDoc without required fields', () => {
      const invalidContentDoc = {
        title: 'Test Event',
        // Missing required fields: id, status, tags, features, etc.
      };

      const isValid = validate(invalidContentDoc);
      expect(isValid).toBe(false);
      expect(validate.errors).toBeDefined();
    });

    it('should reject ContentDoc with invalid status', () => {
      const invalidContentDoc = {
        ...sampleEventContentDoc,
        status: 'invalid_status',
      };

      const isValid = validate(invalidContentDoc);
      expect(isValid).toBe(false);
    });

    it('should reject ContentDoc with invalid ownerSystem', () => {
      const invalidContentDoc = {
        ...sampleEventContentDoc,
        ownerSystem: 'invalid_system',
      };

      const isValid = validate(invalidContentDoc);
      expect(isValid).toBe(false);
    });

    it('should validate ContentDoc with minimal required fields', () => {
      const minimalContentDoc: ContentDoc = {
        id: 'ttg:test:123',
        title: 'Test Content',
        status: 'draft',
        tags: ['content-type:test', 'system:ttg'],
        features: {},
        ownerSystem: 'ttg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const isValid = validate(minimalContentDoc);

      if (!isValid) {
        console.error('Validation errors:', validate.errors);
      }

      expect(isValid).toBe(true);
    });
  });

  describe('Event to ContentDoc Mapping', () => {
    it('should generate valid ContentDoc from TTG event', async () => {
      const mockEvent = new Event({
        id: 123,
        firebaseDocId: 'event-doc-123',
        title: 'Board Game Night',
        description: 'Join us for an evening of strategy games!',
        date: '2024-12-15',
        time: '19:00',
        endTime: '22:00',
        location: 'Community Center Gaming Room',
        status: 'upcoming',
        gameId: 456,
        minPlayers: 2,
        maxPlayers: 6,
        host: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '',
          playerId: 1,
        },
        rsvps: [
          { playerId: 1, status: 'confirmed', participants: 1 },
          { playerId: 2, status: 'confirmed', participants: 1 },
          { playerId: 3, status: 'interested', participants: 1 },
        ],
        notes: '',
        createdAt: new Date('2024-12-01T10:00:00Z'),
        updatedAt: new Date('2024-12-01T15:30:00Z'),
      });

      const contentDoc = await mappingService.mapEventToContentDoc(mockEvent);
      const isValid = validate(contentDoc);

      if (!isValid) {
        console.error('Validation errors:', validate.errors);
      }

      expect(isValid).toBe(true);

      // Verify TTG-specific requirements
      expect(contentDoc.ownerSystem).toBe('ttg');
      expect(contentDoc.originalId).toBe('event:123');
      expect(contentDoc.tags).toContain('system:ttg');
      expect(contentDoc.tags).toContain('content-type:event');
      expect(contentDoc.features['feat:event/v1']).toBeDefined();
      expect(contentDoc.features['feat:game/v1']).toBeDefined();

      // Verify event feature
      const eventFeature = contentDoc.features['feat:event/v1']!;
      expect(eventFeature.startTime).toBe('2024-12-15T19:00:00.000Z');
      expect(eventFeature.endTime).toBe('2024-12-15T22:00:00.000Z');
      expect(eventFeature.location).toBe('Community Center Gaming Room');
      expect(eventFeature.minPlayers).toBe(2);
      expect(eventFeature.maxPlayers).toBe(6);

      // Verify game feature
      const gameFeature = contentDoc.features['feat:game/v1']!;
      expect(gameFeature.gameId).toBe('456');
      expect(gameFeature.gameName).toBe('Board Game Night'); // Uses event title as game name

      // Verify RSVP summary
      expect(contentDoc.rsvpSummary).toEqual({
        yes: 2,
        no: 0,
        maybe: 1,
        waitlist: 0,
        capacity: 6,
      });
    });

    it('should handle events without games', async () => {
      const mockEvent = new Event({
        id: 789,
        title: 'Social Meetup',
        description: 'Casual social gathering',
        date: '2024-12-20',
        time: '18:00',
        endTime: '21:00',
        location: 'Local Coffee Shop',
        status: 'upcoming',
        // No gameId
        minPlayers: 1,
        maxPlayers: 10,
        host: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '',
          playerId: 2,
        },
        rsvps: [],
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const contentDoc = await mappingService.mapEventToContentDoc(mockEvent);
      const isValid = validate(contentDoc);

      expect(isValid).toBe(true);
      expect(contentDoc.features['feat:game/v1']).toBeUndefined();
      expect(contentDoc.features['feat:event/v1']).toBeDefined();
    });

    it('should properly map event status to ContentDoc status', async () => {
      const testCases = [
        { eventStatus: 'upcoming', expectedStatus: 'published' },
        { eventStatus: 'completed', expectedStatus: 'archived' },
        { eventStatus: 'cancelled', expectedStatus: 'deleted' },
        { eventStatus: 'draft', expectedStatus: 'draft' },
        { eventStatus: 'unknown', expectedStatus: 'pending' },
      ];

      for (const testCase of testCases) {
        const mockEvent = new Event({
          id: 100,
          title: 'Test Event',
          date: '2024-12-15',
          time: '19:00',
          endTime: '20:00',
          location: 'Test Location',
          status: testCase.eventStatus as never,
          minPlayers: 1,
          maxPlayers: 4,
          host: { name: 'Test', email: 'test@example.com', phone: '', playerId: 1 },
          rsvps: [],
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const contentDoc = await mappingService.mapEventToContentDoc(mockEvent);
        expect(contentDoc.status).toBe(testCase.expectedStatus);
      }
    });
  });

  describe('Game to ContentDoc Mapping', () => {
    it('should generate valid ContentDoc from TTG game', async () => {
      const mockGame = new Game(
        'game-456',
        456,
        'Wingspan',
        'Strategy',
        '1-5',
        '10+',
        '40-70 minutes',
        ['Cards', 'Dice', 'Tokens'],
        'A competitive, medium-weight, card-driven, engine-building board game.',
        2019,
        'wingspan.jpg',
        'https://stonemaiergames.com/games/wingspan/',
        new Date('2024-11-01T09:00:00Z'),
        new Date('2024-11-15T14:20:00Z'),
        'admin-user-id',
        true,
        'admin-user-id',
        new Date('2024-11-01T09:00:00Z'),
        'active',
        ['birds', 'engine-building', 'card-drafting'],
        'medium',
        'Stonemaier Games',
      );

      const contentDoc = await mappingService.mapGameToContentDoc(mockGame);
      const isValid = validate(contentDoc);

      if (!isValid) {
        console.error('Validation errors:', validate.errors);
      }

      expect(isValid).toBe(true);

      // Verify TTG-specific requirements
      expect(contentDoc.ownerSystem).toBe('ttg');
      expect(contentDoc.originalId).toBe('game:game-456');
      expect(contentDoc.tags).toContain('system:ttg');
      expect(contentDoc.tags).toContain('content-type:game');
      expect(contentDoc.features['feat:game/v1']).toBeDefined();

      // Verify game feature
      const gameFeature = contentDoc.features['feat:game/v1']!;
      expect(gameFeature.gameId).toBe('game-456');
      expect(gameFeature.gameName).toBe('Wingspan');
      expect(gameFeature.genre).toBe('Strategy');
      expect(gameFeature.playerCount).toBe('1-5');

      // Verify status mapping
      expect(contentDoc.status).toBe('published'); // approved: true
    });

    it('should handle unapproved games', async () => {
      const mockGame = new Game(
        'game-789',
        789,
        'Pending Game',
        'Unknown',
        '2-4',
        '8+',
        '30-60 minutes',
        ['Cards'],
        'A game awaiting approval',
        2024,
        undefined,
        undefined,
        new Date(),
        new Date(),
        'user-id',
        false,
        undefined,
        undefined,
        'pending',
      );

      const contentDoc = await mappingService.mapGameToContentDoc(mockGame);
      expect(contentDoc.status).toBe('draft'); // approved: false
    });
  });

  describe('CLCA Service Configuration', () => {
    it('should properly detect configuration status', () => {
      const isConfigured = ingestService.isConfigured();
      // This will be false in test environment unless env vars are set
      expect(typeof isConfigured).toBe('boolean');
    });

    it('should validate ContentDoc before ingestion', async () => {
      const invalidContentDoc = {
        id: '',
        title: '',
        // Missing required fields
      } as any;

      expect(() => ingestService.validateContentDoc(invalidContentDoc)).toThrow();
    });

    it('should accept valid ContentDoc for validation', async () => {
      expect(() => ingestService.validateContentDoc(sampleEventContentDoc)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle mapping errors gracefully', async () => {
      const invalidEvent = {} as Event;

      await expect(mappingService.mapEventToContentDoc(invalidEvent)).rejects.toThrow();
    });

    it('should handle invalid dates in events', async () => {
      const mockEvent = new Event({
        id: 999,
        title: 'Invalid Date Event',
        date: 'invalid-date',
        time: 'invalid-time',
        endTime: 'invalid-end-time',
        location: 'Test Location',
        status: 'upcoming',
        minPlayers: 1,
        maxPlayers: 4,
        host: { name: 'Test', email: 'test@example.com', phone: '', playerId: 1 },
        rsvps: [],
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Should not throw, but should handle gracefully
      const contentDoc = await mappingService.mapEventToContentDoc(mockEvent);

      // Should still be valid ContentDoc with fallback dates
      const isValid = validate(contentDoc);
      expect(isValid).toBe(true);
    });
  });

  describe('Performance and Limits', () => {
    it('should handle large event datasets efficiently', async () => {
      const events = Array.from(
        { length: 100 },
        (_, i) =>
          new Event({
            id: i,
            title: `Event ${i}`,
            date: '2024-12-15',
            time: '19:00',
            endTime: '20:00',
            location: `Location ${i}`,
            status: 'upcoming',
            minPlayers: 1,
            maxPlayers: 4,
            host: { name: `Host ${i}`, email: `host${i}@example.com`, phone: '', playerId: i },
            rsvps: [],
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
      );

      const startTime = Date.now();

      const contentDocs = await Promise.all(
        events.map((event) => mappingService.mapEventToContentDoc(event)),
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(contentDocs).toHaveLength(100);

      // Verify all are valid
      contentDocs.forEach((contentDoc) => {
        expect(validate(contentDoc)).toBe(true);
      });
    });
  });
});
