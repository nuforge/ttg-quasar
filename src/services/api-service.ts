/**
 * API Service Layer
 *
 * This service provides a clean abstraction layer between the UI and data sources.
 * It can switch between different backends (Firebase, REST API, etc.) without
 * affecting the UI components.
 */

import type { Game } from 'src/models/Game';
import type { GameSubmission } from 'src/models/GameSubmission';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { useGameSubmissionsStore } from 'src/stores/game-submissions-store';

export interface GameSearchParams {
  query?: string;
  genre?: string;
  playerCount?: string;
  difficulty?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface GameSubmissionData {
  title: string;
  genre: string;
  numberOfPlayers: string;
  recommendedAge: string;
  playTime: string;
  components: string[];
  description: string;
  releaseYear?: number;
  image?: string;
  link?: string;
  tags?: string[];
  difficulty?: string;
  publisher?: string;
}

/**
 * Games API Service
 * Provides a unified interface for game data operations
 */
class GamesApiService {
  private firebaseStore = useGamesFirebaseStore();
  private submissionsStore = useGameSubmissionsStore();

  /**
   * Get all games with optional filtering and pagination
   */
  async getGames(params?: GameSearchParams): Promise<Game[]> {
    await this.firebaseStore.loadGames();
    let games = this.firebaseStore.games;

    // Apply filters
    if (params?.query) {
      const query = params.query.toLowerCase();
      games = games.filter(
        (game) =>
          game.title.toLowerCase().includes(query) ||
          game.description.toLowerCase().includes(query) ||
          game.genre.toLowerCase().includes(query) ||
          game.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    if (params?.genre) {
      games = games.filter((game) => game.genre === params.genre);
    }

    if (params?.playerCount) {
      games = games.filter((game) => game.numberOfPlayers === params.playerCount);
    }

    if (params?.difficulty) {
      games = games.filter((game) => game.difficulty === params.difficulty);
    }

    if (params?.tags && params.tags.length > 0) {
      games = games.filter((game) => game.tags?.some((tag) => params.tags!.includes(tag)));
    }

    // Apply pagination
    if (params?.offset || params?.limit) {
      const start = params.offset || 0;
      const end = params.limit ? start + params.limit : undefined;
      games = games.slice(start, end);
    }

    return games;
  }

  /**
   * Get a single game by ID
   */
  async getGame(id: string): Promise<Game | null> {
    await this.firebaseStore.loadGames();
    return this.firebaseStore.games.find((game) => game.id === id) || null;
  }

  /**
   * Get a game by legacy numeric ID (for backward compatibility)
   */
  async getGameByLegacyId(legacyId: number): Promise<Game | null> {
    await this.firebaseStore.loadGames();
    return this.firebaseStore.games.find((game) => game.legacyId === legacyId) || null;
  }

  /**
   * Create a new game
   */
  async createGame(gameData: GameSubmissionData): Promise<void> {
    await this.firebaseStore.createGame(gameData);
  }

  /**
   * Update an existing game
   */
  async updateGame(id: string, updates: Partial<GameSubmissionData>): Promise<void> {
    await this.firebaseStore.updateGame(id, updates);
  }

  /**
   * Delete a game
   */
  async deleteGame(id: string): Promise<void> {
    await this.firebaseStore.deleteGame(id);
  }

  /**
   * Submit a new game for approval
   */
  async submitGame(gameData: GameSubmissionData): Promise<void> {
    await this.submissionsStore.submitGame(gameData);
  }

  /**
   * Get all game submissions (admin only)
   */
  async getGameSubmissions(): Promise<GameSubmission[]> {
    await this.submissionsStore.loadSubmissions();
    return this.submissionsStore.submissions;
  }

  /**
   * Approve a game submission
   */
  async approveGameSubmission(submissionId: string, reviewNotes?: string): Promise<void> {
    await this.submissionsStore.approveSubmission(submissionId, reviewNotes);
  }

  /**
   * Reject a game submission
   */
  async rejectGameSubmission(submissionId: string, reason: string): Promise<void> {
    await this.submissionsStore.rejectSubmission(submissionId, reason);
  }

  /**
   * Search games with advanced filtering
   */
  async searchGames(searchTerm: string): Promise<Game[]> {
    return this.getGames({ query: searchTerm });
  }

  /**
   * Get games by genre
   */
  async getGamesByGenre(genre: string): Promise<Game[]> {
    return this.getGames({ genre });
  }

  /**
   * Get available genres
   */
  async getGenres(): Promise<string[]> {
    await this.firebaseStore.loadGames();
    const genres = new Set(this.firebaseStore.games.map((game) => game.genre));
    return Array.from(genres).sort();
  }

  /**
   * Get available player counts
   */
  async getPlayerCounts(): Promise<string[]> {
    await this.firebaseStore.loadGames();
    const counts = new Set(this.firebaseStore.games.map((game) => game.numberOfPlayers));
    return Array.from(counts).sort();
  }

  /**
   * Get available difficulty levels
   */
  async getDifficulties(): Promise<string[]> {
    await this.firebaseStore.loadGames();
    const difficulties = new Set(
      this.firebaseStore.games.map((game) => game.difficulty).filter((d) => d !== undefined),
    );
    return Array.from(difficulties).sort();
  }

  /**
   * Get all available tags
   */
  async getTags(): Promise<string[]> {
    await this.firebaseStore.loadGames();
    const allTags = this.firebaseStore.games.flatMap((game) => game.tags || []);
    const uniqueTags = new Set(allTags);
    return Array.from(uniqueTags).sort();
  }

  /**
   * Subscribe to real-time game updates
   */
  subscribeToGames(): () => void {
    return this.firebaseStore.subscribeToGames();
  }

  /**
   * Subscribe to real-time submission updates
   */
  subscribeToSubmissions(): () => void {
    return this.submissionsStore.subscribeToSubmissions();
  }
}

// Export singleton instance
export const gamesApiService = new GamesApiService();
