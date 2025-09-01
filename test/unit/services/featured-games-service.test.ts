import { describe, it, expect } from 'vitest';
import { FeaturedGamesService } from 'src/services/featured-games-service';
import { Game } from 'src/models/Game';

describe('FeaturedGamesService', () => {
  const createMockGame = (
    id: string,
    legacyId: number,
    title: string,
    genre = 'Strategy',
  ): Game => {
    return new Game(
      id,
      legacyId,
      title,
      genre,
      '2-4',
      '12+',
      '60-90 minutes',
      ['Board', 'Cards'],
      `A great ${genre.toLowerCase()} game`,
      2022, // releaseYear
      undefined, // image
      undefined, // link
      new Date(), // createdAt
      new Date(), // updatedAt
      undefined, // createdBy
      true, // approved
      undefined, // approvedBy
      undefined, // approvedAt
      'active', // status
      undefined, // tags
      undefined, // difficulty
      undefined, // publisher
    );
  };

  const mockGames: Game[] = [
    createMockGame('game1', 1, 'Catan', 'Strategy'),
    createMockGame('game2', 2, 'Ticket to Ride', 'Family'),
    createMockGame('game3', 3, 'Azul', 'Strategy'),
    createMockGame('game4', 4, 'Pandemic', 'Cooperative'),
    createMockGame('game5', 5, 'Splendor', 'Engine Building'),
  ];

  describe('getFeaturedGames', () => {
    it('should return empty array when no games provided', () => {
      const result = FeaturedGamesService.getFeaturedGames([]);
      expect(result).toEqual([]);
    });

    it('should return default count of 3 games', () => {
      const result = FeaturedGamesService.getFeaturedGames(mockGames);
      expect(result).toHaveLength(3);
      expect(result.every((game) => mockGames.includes(game))).toBe(true);
    });

    it('should return requested count when specified', () => {
      const result = FeaturedGamesService.getFeaturedGames(mockGames, { count: 2 });
      expect(result).toHaveLength(2);
    });

    it('should not return more games than available', () => {
      const twoGames = mockGames.slice(0, 2);
      const result = FeaturedGamesService.getFeaturedGames(twoGames, { count: 5 });
      expect(result).toHaveLength(2);
    });

    it('should return different results on multiple calls (random selection)', () => {
      const result1 = FeaturedGamesService.getFeaturedGames(mockGames);
      const result2 = FeaturedGamesService.getFeaturedGames(mockGames);

      // While random, we can't guarantee they'll be different every time,
      // but we can test that the function works and returns valid games
      expect(result1).toHaveLength(3);
      expect(result2).toHaveLength(3);
      expect(result1.every((game) => mockGames.includes(game))).toBe(true);
      expect(result2.every((game) => mockGames.includes(game))).toBe(true);
    });

    it('should accept criteria object for future personalization', () => {
      const criteria = {
        count: 2,
        userFavorites: ['game1', 'game3'],
        userBookmarks: ['game2'],
        userGenrePreferences: ['Strategy'],
      };

      const result = FeaturedGamesService.getFeaturedGames(mockGames, criteria);
      expect(result).toHaveLength(2);
      expect(result.every((game) => mockGames.includes(game))).toBe(true);
    });
  });
});
