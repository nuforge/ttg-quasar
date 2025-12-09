import { describe, it, expect } from 'vitest';
import { UserPreferencesAnalyzer } from 'src/services/user-preferences-analyzer';
import { Game } from 'src/models/Game';
import { Event } from 'src/models/Event';

describe('UserPreferencesAnalyzer', () => {
  const createTestGame = (
    id: string,
    genre: string,
    playerCount: string,
    playTime: string,
  ): Game => {
    return new Game(
      id,
      'Test Game',
      genre,
      playerCount,
      '12+',
      playTime,
      ['board'],
      'Test description',
      2020,
      undefined,
      undefined,
      undefined,
      undefined,
      'user1',
      true,
      undefined,
      undefined,
      'active',
    );
  };

  const createTestEvent = (id: number, gameId: string, rsvpCount: number): Event => {
    return new Event({
      id,
      firebaseDocId: `event${id}`,
      title: 'Test Event',
      gameId,
      host: { name: 'Host', email: 'host@test.com', phone: '123', playerId: 1 },
      date: '2025-12-25',
      time: '19:00',
      endTime: '22:00',
      maxPlayers: 4,
      minPlayers: 2,
      rsvps: Array.from({ length: rsvpCount }, (_, i) => ({
        playerId: i + 1,
        status: 'confirmed' as const,
        participants: 1,
      })),
      location: 'Test Location',
      description: 'Test description',
      notes: '',
      status: 'upcoming',
      createdBy: 'host1',
    });
  };

  describe('getPreferredGenres', () => {
    it('should return empty array when no games provided', () => {
      const result = UserPreferencesAnalyzer.getPreferredGenres([], []);
      expect(result).toEqual([]);
    });

    it('should extract genres from favorites and bookmarks', () => {
      const strategyGame = createTestGame('s1', 'Strategy', '2-4', '60 minutes');
      const partyGame = createTestGame('p1', 'Party', '4-8', '30 minutes');

      const result = UserPreferencesAnalyzer.getPreferredGenres([strategyGame], [partyGame]);

      expect(result).toContain('Strategy');
      expect(result).toContain('Party');
    });
  });

  describe('calculateGamePopularity', () => {
    it('should return zero for games with no events', () => {
      const games = [createTestGame('g1', 'Strategy', '2-4', '60 minutes')];
      const result = UserPreferencesAnalyzer.calculateGamePopularity(games, []);

      expect(result.get('g1')).toBe(0);
    });

    it('should calculate popularity from events and RSVPs', () => {
      // Create games with specific ids that match event gameIds
      const game1 = new Game(
        'g1',
        'Strategy Game',
        'Strategy',
        '2-4',
        '12+',
        '60 minutes',
        ['board'],
        'Test',
        2020,
        undefined,
        undefined,
        undefined,
        undefined,
        'user1',
        true,
        undefined,
        undefined,
        'active',
      );
      const game2 = new Game(
        'g2',
        'Party Game',
        'Party',
        '4-8',
        '12+',
        '30 minutes',
        ['board'],
        'Test',
        2020,
        undefined,
        undefined,
        undefined,
        undefined,
        'user1',
        true,
        undefined,
        undefined,
        'active',
      );

      const event1 = createTestEvent(1, 'g1', 2); // gameId 'g1' matches game1.id, 2 RSVPs
      const event2 = createTestEvent(2, 'g2', 3); // gameId 'g2' matches game2.id, 3 RSVPs

      const result = UserPreferencesAnalyzer.calculateGamePopularity(
        [game1, game2],
        [event1, event2],
      );

      expect(result.get('g1')).toBe(3); // 1 event + 2 RSVPs
      expect(result.get('g2')).toBe(4); // 1 event + 3 RSVPs
    });
  });

  describe('getSimilarGames', () => {
    it('should return empty array when no user games', () => {
      const games = [createTestGame('g1', 'Strategy', '2-4', '60 minutes')];
      const result = UserPreferencesAnalyzer.getSimilarGames([], games);
      expect(result).toEqual([]);
    });

    it('should find similar games', () => {
      const userGame = createTestGame('u1', 'Strategy', '2-4', '60 minutes');
      const similarGame = createTestGame('s1', 'Strategy', '2-4', '60 minutes');
      // Make different game completely different in all scored characteristics
      const differentGame = new Game(
        'd1',
        'Different Game',
        'Party',
        '6-8',
        '8+',
        '15 minutes',
        ['cards'],
        'Different',
        2020,
        undefined,
        undefined,
        undefined,
        undefined,
        'user1',
        true,
        undefined,
        undefined,
        'active',
      );

      const allGames = [userGame, similarGame, differentGame];
      const result = UserPreferencesAnalyzer.getSimilarGames([userGame], allGames, ['u1']);

      expect(result.some((g) => g.id === 's1')).toBe(true);
      expect(result.some((g) => g.id === 'd1')).toBe(false);
    });
  });

  describe('analyzeUserPatterns', () => {
    it('should return empty patterns when no data', () => {
      const result = UserPreferencesAnalyzer.analyzeUserPatterns([], [], []);

      expect(result.preferredGenres).toEqual([]);
      expect(result.totalGamesInterested).toBe(0);
      expect(result.eventsAttended).toBe(0);
    });

    it('should analyze user patterns comprehensively', () => {
      const favorites = [createTestGame('f1', 'Strategy', '2-4', '60 minutes')];
      const bookmarks = [createTestGame('b1', 'Party', '4-8', '30 minutes')];
      const events = [createTestEvent(1, 'f1', 2)];

      const result = UserPreferencesAnalyzer.analyzeUserPatterns(favorites, bookmarks, events);

      expect(result.totalGamesInterested).toBe(2);
      expect(result.eventsAttended).toBe(1);
      expect(Array.isArray(result.preferredGenres)).toBe(true);
    });
  });
});
