import { describe, it, expect, vi } from 'vitest';
import { Game, type FirebaseGame } from 'src/models/Game';

// Mock Firebase Timestamp
const mockTimestamp = {
  toDate: () => new Date('2025-01-15T10:00:00Z'),
  seconds: Math.floor(new Date('2025-01-15T10:00:00Z').getTime() / 1000),
  nanoseconds: 0,
  toMillis: () => new Date('2025-01-15T10:00:00Z').getTime(),
  isEqual: vi.fn(() => false),
  toJSON: vi.fn(() => ({
    seconds: Math.floor(new Date('2025-01-15T10:00:00Z').getTime() / 1000),
    nanoseconds: 0,
    type: 'timestamp'
  })),
} as any;

describe('Game Model', () => {
  const mockDate = new Date('2025-01-15T10:00:00Z');
  const mockApprovedDate = new Date('2025-01-20T15:30:00Z');

  const baseGameData = {
    id: 'game123',
    legacyId: 42,
    title: 'Test Strategy Game',
    genre: 'Strategy',
    numberOfPlayers: '2-4',
    recommendedAge: '12+',
    playTime: '60-90 minutes',
    components: ['Board', 'Cards', 'Tokens', 'Dice'],
    description: 'A comprehensive strategy game for testing purposes',
    releaseYear: 2023,
    image: 'test-game.jpg',
    link: 'https://boardgamegeek.com/test-game',
    createdAt: mockDate,
    updatedAt: mockDate,
    createdBy: 'user456',
    approved: true,
    approvedBy: 'admin789',
    approvedAt: mockApprovedDate,
    status: 'active' as const,
    tags: ['strategy', 'competitive', 'euro'],
    difficulty: 'medium',
    publisher: 'Test Games Publishing',
  };

  describe('Constructor', () => {
    it('should create Game with all fields', () => {
      const game = new Game(
        baseGameData.id,
        baseGameData.legacyId,
        baseGameData.title,
        baseGameData.genre,
        baseGameData.numberOfPlayers,
        baseGameData.recommendedAge,
        baseGameData.playTime,
        baseGameData.components,
        baseGameData.description,
        baseGameData.releaseYear,
        baseGameData.image,
        baseGameData.link,
        baseGameData.createdAt,
        baseGameData.updatedAt,
        baseGameData.createdBy,
        baseGameData.approved,
        baseGameData.approvedBy,
        baseGameData.approvedAt,
        baseGameData.status,
        baseGameData.tags,
        baseGameData.difficulty,
        baseGameData.publisher,
      );

      expect(game.id).toBe('game123');
      expect(game.legacyId).toBe(42);
      expect(game.title).toBe('Test Strategy Game');
      expect(game.genre).toBe('Strategy');
      expect(game.numberOfPlayers).toBe('2-4');
      expect(game.recommendedAge).toBe('12+');
      expect(game.playTime).toBe('60-90 minutes');
      expect(game.components).toEqual(['Board', 'Cards', 'Tokens', 'Dice']);
      expect(game.description).toBe('A comprehensive strategy game for testing purposes');
      expect(game.releaseYear).toBe(2023);
      expect(game.image).toBe('test-game.jpg');
      expect(game.link).toBe('https://boardgamegeek.com/test-game');
      expect(game.createdAt).toEqual(mockDate);
      expect(game.updatedAt).toEqual(mockDate);
      expect(game.createdBy).toBe('user456');
      expect(game.approved).toBe(true);
      expect(game.approvedBy).toBe('admin789');
      expect(game.approvedAt).toEqual(mockApprovedDate);
      expect(game.status).toBe('active');
      expect(game.tags).toEqual(['strategy', 'competitive', 'euro']);
      expect(game.difficulty).toBe('medium');
      expect(game.publisher).toBe('Test Games Publishing');
    });

    it('should create Game with minimal required fields', () => {
      const game = new Game(
        'minimal123',
        1,
        'Minimal Game',
        'Card Game',
        '2',
        '8+',
        '30 min',
        ['Cards'],
        'Simple card game',
      );

      expect(game.id).toBe('minimal123');
      expect(game.legacyId).toBe(1);
      expect(game.title).toBe('Minimal Game');
      expect(game.genre).toBe('Card Game');
      expect(game.numberOfPlayers).toBe('2');
      expect(game.recommendedAge).toBe('8+');
      expect(game.playTime).toBe('30 min');
      expect(game.components).toEqual(['Cards']);
      expect(game.description).toBe('Simple card game');

      // Optional fields should be undefined
      expect(game.releaseYear).toBeUndefined();
      expect(game.image).toBeUndefined();
      expect(game.link).toBeUndefined();
      expect(game.createdAt).toBeUndefined();
      expect(game.updatedAt).toBeUndefined();
      expect(game.createdBy).toBeUndefined();
      expect(game.approved).toBe(true); // Default value
      expect(game.approvedBy).toBeUndefined();
      expect(game.approvedAt).toBeUndefined();
      expect(game.status).toBe('active'); // Default value
      expect(game.tags).toBeUndefined();
      expect(game.difficulty).toBeUndefined();
      expect(game.publisher).toBeUndefined();
    });

    it('should handle default values correctly', () => {
      const game = new Game(
        'defaults123',
        2,
        'Default Game',
        'Party',
        '4-8',
        '16+',
        '45 min',
        ['Board'],
        'Party game',
        undefined, // releaseYear
        undefined, // image
        undefined, // link
        undefined, // createdAt
        undefined, // updatedAt
        undefined, // createdBy
        false, // approved (non-default)
        undefined, // approvedBy
        undefined, // approvedAt
        'pending', // status (non-default)
        undefined, // tags
        undefined, // difficulty
        undefined, // publisher
      );

      expect(game.approved).toBe(false);
      expect(game.status).toBe('pending');
      expect(game.releaseYear).toBeUndefined();
      expect(game.image).toBeUndefined();
      expect(game.link).toBeUndefined();
    });
  });

  describe('URL Generation', () => {
    it('should generate correct URL from legacy ID and title', () => {
      const game = new Game(
        'game123',
        42,
        'Test Strategy Game',
        'Strategy',
        '2-4',
        '12+',
        '60 min',
        ['Board'],
        'Test game',
      );

      const url = game.url;
      expect(url).toBe('/42/Test Strategy Game');
    });

    it('should handle titles with special characters', () => {
      const game = new Game(
        'special123',
        5,
        'Game with "Quotes" & Symbols!',
        'Party',
        '4-8',
        '16+',
        '30 min',
        ['Cards'],
        'Special chars game',
      );

      const url = game.url;
      expect(url).toBe('/5/Game with "Quotes" & Symbols!');
    });

    it('should handle empty title', () => {
      const game = new Game(
        'empty123',
        99,
        '',
        'Misc',
        '1',
        '8+',
        '15 min',
        ['Board'],
        'Empty title game',
      );

      const url = game.url;
      expect(url).toBe('/99/');
    });
  });

  describe('Static Methods', () => {
    describe('fromJSON', () => {
      it('should create Game from JSON data with all fields', () => {
        const jsonData = {
          id: 100,
          title: 'JSON Game',
          genre: 'Adventure',
          numberOfPlayers: '1-6',
          recommendedAge: '14+',
          playTime: '2-3 hours',
          components: ['Board', 'Miniatures'],
          description: 'Adventure game from JSON',
          releaseYear: 2022,
          image: 'json-game.png',
          link: 'https://example.com/json-game',
        };

        const game = Game.fromJSON(jsonData);

        expect(game.id).toBe('100'); // Converted to string
        expect(game.legacyId).toBe(100);
        expect(game.title).toBe('JSON Game');
        expect(game.genre).toBe('Adventure');
        expect(game.numberOfPlayers).toBe('1-6');
        expect(game.recommendedAge).toBe('14+');
        expect(game.playTime).toBe('2-3 hours');
        expect(game.components).toEqual(['Board', 'Miniatures']);
        expect(game.description).toBe('Adventure game from JSON');
        expect(game.releaseYear).toBe(2022);
        expect(game.image).toBe('json-game.png');
        expect(game.link).toBe('https://example.com/json-game');
      });

      it('should create Game from minimal JSON data', () => {
        const minimalJson = {
          title: 'Minimal JSON Game',
          genre: 'Card Game',
          numberOfPlayers: '2',
          recommendedAge: '8+',
          playTime: '20 min',
          components: ['Cards'],
          description: 'Minimal game',
        };

        const game = Game.fromJSON(minimalJson);

        expect(game.title).toBe('Minimal JSON Game');
        expect(game.legacyId).toBe(0); // Default value when id not provided
        expect(game.id).toMatch(/^\d+$/); // Should be timestamp string
        expect(game.releaseYear).toBeUndefined();
        expect(game.image).toBeUndefined();
        expect(game.link).toBeUndefined();
      });

      it('should handle missing optional fields in JSON', () => {
        const partialJson = {
          id: 50,
          title: 'Partial Game',
          genre: 'Puzzle',
          numberOfPlayers: '1-2',
          recommendedAge: '10+',
          playTime: '45 min',
          components: ['Board', 'Pieces'],
          description: 'Puzzle game',
          // Missing: releaseYear, image, link
        };

        const game = Game.fromJSON(partialJson);

        expect(game.id).toBe('50');
        expect(game.legacyId).toBe(50);
        expect(game.title).toBe('Partial Game');
        expect(game.releaseYear).toBeUndefined();
        expect(game.image).toBeUndefined();
        expect(game.link).toBeUndefined();
      });
    });

    describe('fromFirebase', () => {
      const mockTimestamp = {
        toDate: () => mockDate,
        seconds: Math.floor(mockDate.getTime() / 1000),
        nanoseconds: 0,
      };

      it('should create Game from Firebase data with all fields', () => {
        const firebaseData: FirebaseGame = {
          legacyId: 75,
          title: 'Firebase Game',
          genre: 'Economic',
          numberOfPlayers: '3-5',
          recommendedAge: '14+',
          playTime: '90-120 minutes',
          components: ['Board', 'Cards', 'Money'],
          description: 'Economic strategy game',
          releaseYear: 2024,
          image: 'firebase-game.jpg',
          link: 'https://example.com/firebase-game',
          createdAt: mockTimestamp as any,
          updatedAt: mockTimestamp as any,
          createdBy: 'firebase-user',
          approved: true,
          approvedBy: 'firebase-admin',
          approvedAt: mockTimestamp as any,
          status: 'active',
          tags: ['economic', 'strategy'],
          difficulty: 'hard',
          publisher: 'Firebase Games Ltd',
        };

        const game = Game.fromFirebase('firebase123', firebaseData);

        expect(game.id).toBe('firebase123');
        expect(game.legacyId).toBe(75);
        expect(game.title).toBe('Firebase Game');
        expect(game.genre).toBe('Economic');
        expect(game.numberOfPlayers).toBe('3-5');
        expect(game.recommendedAge).toBe('14+');
        expect(game.playTime).toBe('90-120 minutes');
        expect(game.components).toEqual(['Board', 'Cards', 'Money']);
        expect(game.description).toBe('Economic strategy game');
        expect(game.releaseYear).toBe(2024);
        expect(game.image).toBe('firebase-game.jpg');
        expect(game.link).toBe('https://example.com/firebase-game');
        expect(game.createdAt).toEqual(mockDate);
        expect(game.updatedAt).toEqual(mockDate);
        expect(game.createdBy).toBe('firebase-user');
        expect(game.approved).toBe(true);
        expect(game.approvedBy).toBe('firebase-admin');
        expect(game.approvedAt).toEqual(mockDate);
        expect(game.status).toBe('active');
        expect(game.tags).toEqual(['economic', 'strategy']);
        expect(game.difficulty).toBe('hard');
        expect(game.publisher).toBe('Firebase Games Ltd');
      });

      it('should create Game from minimal Firebase data', () => {
        const minimalFirebaseData: FirebaseGame = {
          legacyId: 10,
          title: 'Minimal Firebase Game',
          genre: 'Trivia',
          numberOfPlayers: '4-10',
          recommendedAge: '16+',
          playTime: '30 min',
          components: ['Questions'],
          description: 'Trivia game',
          approved: false,
          status: 'pending',
        };

        const game = Game.fromFirebase('minimal456', minimalFirebaseData);

        expect(game.id).toBe('minimal456');
        expect(game.legacyId).toBe(10);
        expect(game.title).toBe('Minimal Firebase Game');
        expect(game.approved).toBe(false);
        expect(game.status).toBe('pending');
        expect(game.releaseYear).toBeUndefined();
        expect(game.image).toBeUndefined();
        expect(game.link).toBeUndefined();
        expect(game.createdAt).toBeUndefined();
        expect(game.updatedAt).toBeUndefined();
        expect(game.createdBy).toBeUndefined();
        expect(game.approvedBy).toBeUndefined();
        expect(game.approvedAt).toBeUndefined();
        expect(game.tags).toBeUndefined();
        expect(game.difficulty).toBeUndefined();
        expect(game.publisher).toBeUndefined();
      });

      it('should handle Firebase Timestamp conversion', () => {
        const firebaseData: FirebaseGame = {
          legacyId: 15,
          title: 'Timestamp Game',
          genre: 'Abstract',
          numberOfPlayers: '2',
          recommendedAge: '10+',
          playTime: '20 min',
          components: ['Pieces'],
          description: 'Abstract game',
          createdAt: mockTimestamp as any,
          updatedAt: mockTimestamp as any,
          approvedAt: mockTimestamp as any,
          approved: true,
          status: 'active',
        };

        const game = Game.fromFirebase('timestamp789', firebaseData);

        expect(game.createdAt).toEqual(mockDate);
        expect(game.updatedAt).toEqual(mockDate);
        expect(game.approvedAt).toEqual(mockDate);
      });

      it('should handle different status values', () => {
        const statuses: Array<'active' | 'inactive' | 'pending'> = [
          'active',
          'inactive',
          'pending',
        ];

        statuses.forEach((status) => {
          const firebaseData: FirebaseGame = {
            legacyId: 25,
            title: `${status} Game`,
            genre: 'Test',
            numberOfPlayers: '2',
            recommendedAge: '8+',
            playTime: '15 min',
            components: ['Test'],
            description: `Game with ${status} status`,
            approved: status === 'active',
            status,
          };

          const game = Game.fromFirebase(`${status}123`, firebaseData);
          expect(game.status).toBe(status);
          expect(game.approved).toBe(status === 'active');
        });
      });
    });
  });

  describe('toFirebase Method', () => {
    it('should convert Game to Firebase format with all fields', () => {
      const game = new Game(
        baseGameData.id,
        baseGameData.legacyId,
        baseGameData.title,
        baseGameData.genre,
        baseGameData.numberOfPlayers,
        baseGameData.recommendedAge,
        baseGameData.playTime,
        baseGameData.components,
        baseGameData.description,
        baseGameData.releaseYear,
        baseGameData.image,
        baseGameData.link,
        baseGameData.createdAt,
        baseGameData.updatedAt,
        baseGameData.createdBy,
        baseGameData.approved,
        baseGameData.approvedBy,
        baseGameData.approvedAt,
        baseGameData.status,
        baseGameData.tags,
        baseGameData.difficulty,
        baseGameData.publisher,
      );

      const firebaseData = game.toFirebase();

      expect(firebaseData.legacyId).toBe(42);
      expect(firebaseData.title).toBe('Test Strategy Game');
      expect(firebaseData.genre).toBe('Strategy');
      expect(firebaseData.numberOfPlayers).toBe('2-4');
      expect(firebaseData.recommendedAge).toBe('12+');
      expect(firebaseData.playTime).toBe('60-90 minutes');
      expect(firebaseData.components).toEqual(['Board', 'Cards', 'Tokens', 'Dice']);
      expect(firebaseData.description).toBe('A comprehensive strategy game for testing purposes');
      expect(firebaseData.releaseYear).toBe(2023);
      expect(firebaseData.image).toBe('test-game.jpg');
      expect(firebaseData.link).toBe('https://boardgamegeek.com/test-game');
      expect(firebaseData.approved).toBe(true);
      expect(firebaseData.approvedBy).toBe('admin789');
      expect(firebaseData.status).toBe('active');
      expect(firebaseData.tags).toEqual(['strategy', 'competitive', 'euro']);
      expect(firebaseData.difficulty).toBe('medium');
      expect(firebaseData.publisher).toBe('Test Games Publishing');

      // Firebase timestamps are handled by Firebase, so not included in toFirebase()
      expect('createdAt' in firebaseData).toBe(false);
      expect('updatedAt' in firebaseData).toBe(false);
      expect('approvedAt' in firebaseData).toBe(false);
    });

    it('should exclude undefined optional fields from Firebase data', () => {
      const minimalGame = new Game(
        'minimal789',
        5,
        'Minimal Game',
        'Simple',
        '1',
        '6+',
        '10 min',
        ['Pieces'],
        'Very simple game',
      );

      const firebaseData = minimalGame.toFirebase();

      expect(firebaseData.legacyId).toBe(5);
      expect(firebaseData.title).toBe('Minimal Game');
      expect(firebaseData.approved).toBe(true);
      expect(firebaseData.status).toBe('active');

      // These should not be present in the Firebase data
      expect('releaseYear' in firebaseData).toBe(false);
      expect('image' in firebaseData).toBe(false);
      expect('link' in firebaseData).toBe(false);
      expect('createdBy' in firebaseData).toBe(false);
      expect('approvedBy' in firebaseData).toBe(false);
      expect('tags' in firebaseData).toBe(false);
      expect('difficulty' in firebaseData).toBe(false);
      expect('publisher' in firebaseData).toBe(false);
    });

    it('should include optional fields when they have values', () => {
      const gameWithOptionals = new Game(
        'optionals123',
        15,
        'Game with Optionals',
        'Cooperative',
        '2-4',
        '12+',
        '75 min',
        ['Board', 'Tokens'],
        'Cooperative game',
        2021, // releaseYear
        'optionals.jpg', // image
        'https://example.com/optionals', // link
        undefined, // createdAt
        undefined, // updatedAt
        'creator123', // createdBy
        true, // approved
        'admin456', // approvedBy
        undefined, // approvedAt
        'active', // status
        ['cooperative', 'teamwork'], // tags
        'easy', // difficulty
        'Cooperative Games Inc', // publisher
      );

      const firebaseData = gameWithOptionals.toFirebase();

      expect('releaseYear' in firebaseData).toBe(true);
      expect(firebaseData.releaseYear).toBe(2021);
      expect('image' in firebaseData).toBe(true);
      expect(firebaseData.image).toBe('optionals.jpg');
      expect('link' in firebaseData).toBe(true);
      expect(firebaseData.link).toBe('https://example.com/optionals');
      expect('approvedBy' in firebaseData).toBe(true);
      expect(firebaseData.approvedBy).toBe('admin456');
      expect('tags' in firebaseData).toBe(true);
      expect(firebaseData.tags).toEqual(['cooperative', 'teamwork']);
      expect('difficulty' in firebaseData).toBe(true);
      expect(firebaseData.difficulty).toBe('easy');
      expect('publisher' in firebaseData).toBe(true);
      expect(firebaseData.publisher).toBe('Cooperative Games Inc');
    });
  });

  describe('Timestamp Conversion', () => {
    it('should handle Date objects in fromFirebase', () => {
      const firebaseData: FirebaseGame = {
        legacyId: 30,
        title: 'Date Game',
        genre: 'Test',
        numberOfPlayers: '2',
        recommendedAge: '8+',
        playTime: '15 min',
        components: ['Test'],
        description: 'Game with Date objects',
        createdAt: mockTimestamp, // Use mock timestamp
        updatedAt: mockTimestamp,
        approved: true,
        status: 'active',
      };

      const game = Game.fromFirebase('date123', firebaseData);

      expect(game.createdAt).toEqual(mockDate);
      expect(game.updatedAt).toEqual(mockDate);
    });

    it('should handle string timestamps in fromFirebase', () => {
      const firebaseData: FirebaseGame = {
        legacyId: 35,
        title: 'String Date Game',
        genre: 'Test',
        numberOfPlayers: '2',
        recommendedAge: '8+',
        playTime: '15 min',
        components: ['Test'],
        description: 'Game with string dates',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        approved: true,
        status: 'active',
      };

      const game = Game.fromFirebase('string123', firebaseData);

      expect(game.createdAt).toEqual(new Date('2025-01-15T10:00:00Z'));
      expect(game.updatedAt).toEqual(mockDate);
    });

    it('should handle undefined timestamps', () => {
      const firebaseData: FirebaseGame = {
        legacyId: 40,
        title: 'No Timestamps Game',
        genre: 'Test',
        numberOfPlayers: '2',
        recommendedAge: '8+',
        playTime: '15 min',
        components: ['Test'],
        description: 'Game without timestamps',
        approved: true,
        status: 'active',
        // No timestamp fields
      };

      const game = Game.fromFirebase('notimestamp123', firebaseData);

      expect(game.createdAt).toBeUndefined();
      expect(game.updatedAt).toBeUndefined();
      expect(game.approvedAt).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays and strings', () => {
      const game = new Game(
        'empty123',
        0,
        '', // Empty title
        '', // Empty genre
        '', // Empty player count
        '', // Empty age
        '', // Empty play time
        [], // Empty components
        '', // Empty description
      );

      expect(game.title).toBe('');
      expect(game.genre).toBe('');
      expect(game.numberOfPlayers).toBe('');
      expect(game.recommendedAge).toBe('');
      expect(game.playTime).toBe('');
      expect(game.components).toEqual([]);
      expect(game.description).toBe('');
    });

    it('should handle very large legacy IDs', () => {
      const game = new Game(
        'large123',
        999999999,
        'Large ID Game',
        'Test',
        '2',
        '8+',
        '15 min',
        ['Test'],
        'Game with large legacy ID',
      );

      expect(game.legacyId).toBe(999999999);
      expect(game.url).toBe('/999999999/Large ID Game');
    });

    it('should handle special characters in all text fields', () => {
      const specialGame = new Game(
        'special123',
        1,
        'Game with Émojis 🎲 & Ñiño',
        'Spëcial Génre',
        '2-4 👥',
        '12+ años',
        '60-90 minútes',
        ['Boardé', 'Cardš', 'Tökens'],
        'Descripción with spëcial charactërs & symbols!',
        2023,
        'spëcial-game.jpg',
        'https://example.com/spëcial-game',
        undefined,
        undefined,
        'créator-123',
        true,
        'admín-456',
        undefined,
        'active',
        ['spëcial', 'charactërs'],
        'médium',
        'Spëcial Publîsher',
      );

      expect(specialGame.title).toBe('Game with Émojis 🎲 & Ñiño');
      expect(specialGame.genre).toBe('Spëcial Génre');
      expect(specialGame.numberOfPlayers).toBe('2-4 👥');
      expect(specialGame.recommendedAge).toBe('12+ años');
      expect(specialGame.playTime).toBe('60-90 minútes');
      expect(specialGame.components).toEqual(['Boardé', 'Cardš', 'Tökens']);
      expect(specialGame.description).toBe('Descripción with spëcial charactërs & symbols!');
      expect(specialGame.createdBy).toBe('créator-123');
      expect(specialGame.approvedBy).toBe('admín-456');
      expect(specialGame.tags).toEqual(['spëcial', 'charactërs']);
      expect(specialGame.difficulty).toBe('médium');
      expect(specialGame.publisher).toBe('Spëcial Publîsher');
    });
  });
});
