import { type Game } from 'src/models/Game';
import { type Event } from 'src/models/Event';

export interface FeaturedGamesCriteria {
  userFavorites?: string[];
  userBookmarks?: string[];
  upcomingEventsForUser?: Event[];
  allUpcomingEvents?: Event[];
  userGenrePreferences?: string[];
  count?: number;
}

export interface FeaturedGameScore {
  game: Game;
  score: number;
  reasons: string[];
}

/**
 * Service for calculating featured games based on user preferences and engagement
 * Currently implements random selection but structured for future personalization algorithms
 */
export class FeaturedGamesService {
  /**
   * Calculate featured games based on user data and engagement metrics
   *
   * @param games - Available approved games
   * @param criteria - User data and preferences for personalization
   * @returns Array of featured games
   */
  static getFeaturedGames(games: Game[], criteria: FeaturedGamesCriteria = {}): Game[] {
    const { count = 3 } = criteria;

    if (games.length === 0) return [];

    // Use personalized algorithm if user data is available, otherwise random
    const hasUserData =
      criteria.userFavorites?.length ||
      criteria.userBookmarks?.length ||
      criteria.userGenrePreferences?.length ||
      criteria.upcomingEventsForUser?.length;

    if (hasUserData) {
      return this.getPersonalizedFeaturedGames(games, criteria);
    } else {
      return this.getRandomFeaturedGames(games, count);
    }
  } /**
   * Current implementation: Random selection
   * Maintains API structure for future algorithm replacement
   */
  private static getRandomFeaturedGames(games: Game[], count: number): Game[] {
    const shuffled = [...games].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Personalized algorithm implementation
   * Calculates scores based on user preferences and engagement
   */
  private static getPersonalizedFeaturedGames(
    games: Game[],
    criteria: FeaturedGamesCriteria,
  ): Game[] {
    const { count = 3 } = criteria;

    // Score each game based on multiple criteria
    const scoredGames: FeaturedGameScore[] = games.map((game) => {
      const score = this.calculateGameScore(game, criteria);
      const reasons = this.getScoreReasons(game, criteria);

      return { game, score, reasons };
    });

    // Sort by score and return top games
    return scoredGames
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(count, scoredGames.length))
      .map((scored) => scored.game);
  }

  /**
   * Calculate personalization score for a game
   * Higher scores indicate better matches for the user
   */
  private static calculateGameScore(game: Game, criteria: FeaturedGamesCriteria): number {
    let score = 0;
    const {
      userFavorites = [],
      userBookmarks = [],
      upcomingEventsForUser = [],
      allUpcomingEvents = [],
      userGenrePreferences = [],
    } = criteria;

    // Base score for all approved games
    score += 1;

    // Boost for user's favorite games (using Firebase doc ID)
    if (userFavorites.includes(game.id)) {
      score += 10;
    }

    // Boost for user's bookmarked games (using Firebase doc ID)
    if (userBookmarks.includes(game.id)) {
      score += 8;
    }

    // Boost for games in user's upcoming events
    const hasUpcomingEvent = upcomingEventsForUser.some((event) => event.gameId === game.id);
    if (hasUpcomingEvent) {
      score += 15;
    }

    // Boost for games with any upcoming events (popular games)
    const popularityBoost =
      allUpcomingEvents?.filter((event) => event.gameId === game.id).length || 0;
    score += popularityBoost * 2;

    // Boost for user's preferred genres
    if (userGenrePreferences.includes(game.genre)) {
      score += 5;
    }

    // Boost for recently added/updated games (within 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (game.createdAt && game.createdAt > thirtyDaysAgo) {
      score += 3;
    }

    if (game.updatedAt && game.updatedAt > thirtyDaysAgo) {
      score += 2;
    }

    return score;
  }

  /**
   * Get human-readable reasons for why a game was featured
   */
  private static getScoreReasons(game: Game, criteria: FeaturedGamesCriteria): string[] {
    const reasons: string[] = [];
    const {
      userFavorites = [],
      userBookmarks = [],
      upcomingEventsForUser = [],
      allUpcomingEvents = [],
      userGenrePreferences = [],
    } = criteria;

    if (userFavorites.includes(game.id)) {
      reasons.push('One of your favorites');
    }

    if (userBookmarks.includes(game.id)) {
      reasons.push('You bookmarked this game');
    }

    const hasUpcomingEvent = upcomingEventsForUser.some((event) => event.gameId === game.id);
    if (hasUpcomingEvent) {
      reasons.push('You have an upcoming event for this game');
    }

    const eventCount =
      allUpcomingEvents?.filter((event) => event.gameId === game.id).length || 0;
    if (eventCount > 0) {
      reasons.push(`${eventCount} upcoming events`);
    }

    if (userGenrePreferences.includes(game.genre)) {
      reasons.push('Matches your preferred genres');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (game.createdAt && game.createdAt > thirtyDaysAgo) {
      reasons.push('Recently added');
    }

    return reasons;
  }
}
