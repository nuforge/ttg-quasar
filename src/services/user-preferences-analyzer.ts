import { type Game } from 'src/models/Game';
import { type Event } from 'src/models/Event';

/**
 * Utility functions for analyzing user preferences and generating insights
 * Used by the featured games system to understand user behavior patterns
 */
export class UserPreferencesAnalyzer {
  /**
   * Extract preferred genres from user's favorite and bookmarked games
   * @param favoriteGames - User's favorite games
   * @param bookmarkedGames - User's bookmarked games
   * @returns Array of genre strings sorted by preference frequency
   */
  static getPreferredGenres(favoriteGames: Game[], bookmarkedGames: Game[]): string[] {
    const genreFrequency = new Map<string, number>();

    // Weight favorites more heavily than bookmarks
    const favoriteWeight = 3;
    const bookmarkWeight = 1;

    // Count genres from favorites
    favoriteGames.forEach((game) => {
      const currentCount = genreFrequency.get(game.genre) || 0;
      genreFrequency.set(game.genre, currentCount + favoriteWeight);
    });

    // Count genres from bookmarks
    bookmarkedGames.forEach((game) => {
      const currentCount = genreFrequency.get(game.genre) || 0;
      genreFrequency.set(game.genre, currentCount + bookmarkWeight);
    });

    // Return genres sorted by frequency (most preferred first)
    return Array.from(genreFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);
  }

  /**
   * Calculate game popularity based on upcoming events
   * @param games - All available games
   * @param events - All upcoming events
   * @returns Map of game IDs to their popularity scores
   */
  static calculateGamePopularity(games: Game[], events: Event[]): Map<string, number> {
    const popularity = new Map<string, number>();

    // Initialize all games with zero popularity
    games.forEach((game) => {
      popularity.set(game.id, 0);
    });

    // Count events for each game
    events.forEach((event) => {
      const game = games.find((g) => g.id === event.gameId);
      if (game) {
        const currentScore = popularity.get(game.id) || 0;
        // Weight by number of RSVPs (more RSVPs = more popular)
        const rsvpCount = event.rsvps.filter((rsvp) => rsvp.status === 'confirmed').length;
        popularity.set(game.id, currentScore + rsvpCount + 1); // +1 for the event itself
      }
    });

    return popularity;
  }

  /**
   * Get games that are similar to user's favorites/bookmarks
   * Based on genre, player count, and play time similarity
   * @param userGames - Games the user has favorited/bookmarked
   * @param allGames - All available games to search from
   * @param excludeIds - Game IDs to exclude from results
   * @returns Array of similar games
   */
  static getSimilarGames(userGames: Game[], allGames: Game[], excludeIds: string[] = []): Game[] {
    if (userGames.length === 0) return [];

    const scoredGames = allGames
      .filter((game) => !excludeIds.includes(game.id))
      .map((game) => {
        let similarityScore = 0;

        userGames.forEach((userGame) => {
          // Genre match
          if (game.genre === userGame.genre) {
            similarityScore += 3;
          }

          // Player count similarity
          if (game.numberOfPlayers === userGame.numberOfPlayers) {
            similarityScore += 2;
          }

          // Play time similarity
          if (game.playTime === userGame.playTime) {
            similarityScore += 1;
          }

          // Age recommendation similarity
          if (game.recommendedAge === userGame.recommendedAge) {
            similarityScore += 1;
          }
        });

        return { game, score: similarityScore };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scoredGames.map((item) => item.game);
  }

  /**
   * Analyze user's gaming patterns and return insights
   * @param favoriteGames - User's favorite games
   * @param bookmarkedGames - User's bookmarked games
   * @param userEvents - Events the user has RSVPed to
   * @returns Object containing user insights
   */
  static analyzeUserPatterns(favoriteGames: Game[], bookmarkedGames: Game[], userEvents: Event[]) {
    const preferredGenres = this.getPreferredGenres(favoriteGames, bookmarkedGames);

    // Analyze player count preferences
    const playerCountPreference = new Map<string, number>();
    [...favoriteGames, ...bookmarkedGames].forEach((game) => {
      const count = playerCountPreference.get(game.numberOfPlayers) || 0;
      playerCountPreference.set(game.numberOfPlayers, count + 1);
    });

    // Analyze play time preferences
    const playTimePreference = new Map<string, number>();
    [...favoriteGames, ...bookmarkedGames].forEach((game) => {
      const count = playTimePreference.get(game.playTime) || 0;
      playTimePreference.set(game.playTime, count + 1);
    });

    return {
      preferredGenres,
      preferredPlayerCounts: Array.from(playerCountPreference.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([count]) => count),
      preferredPlayTimes: Array.from(playTimePreference.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([time]) => time),
      totalGamesInterested: favoriteGames.length + bookmarkedGames.length,
      eventsAttended: userEvents.length,
    };
  }
}
