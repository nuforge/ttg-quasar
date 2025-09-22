import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { Game, type FirebaseGame } from 'src/models/Game';
import { type Event } from 'src/models/Event';
import { type GameSubmissionData } from 'src/models/GameSubmission';
import { authService } from 'src/services/auth-service';
import { FeaturedGamesService } from 'src/services/featured-games-service';
import { CLCAIngestService, type CLCAIngestError } from 'src/services/clca-ingest-service';
import { ContentDocMappingService } from 'src/services/contentdoc-mapping-service';
import { DeadLetterQueueService } from 'src/services/dead-letter-queue-service';
import { logger } from 'src/utils/logger';

export const useGamesFirebaseStore = defineStore('gamesFirebase', () => {
  // State
  const games = ref<Game[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const unsubscribes = ref<Unsubscribe[]>([]);

  // CLCA Integration Services
  const clcaIngestService = new CLCAIngestService();
  const contentDocMappingService = new ContentDocMappingService();
  const dlqService = new DeadLetterQueueService();

  // CLCA sync status tracking for games
  const clcaSyncStatus = ref<
    Map<
      string,
      {
        synced: boolean;
        syncedAt?: Date;
        error?: string;
        clcaId?: string;
      }
    >
  >(new Map());

  // Getters
  const approvedGames = computed(() => {
    return games.value.filter((game) => game.approved && game.status === 'active');
  });

  const pendingGames = computed(() => {
    return games.value.filter((game) => !game.approved && game.status === 'pending');
  });

  const gamesByGenre = computed(() => {
    return (genre: string) => approvedGames.value.filter((game) => game.genre === genre);
  });

  const getGameById = computed(() => {
    return (id: string) => games.value.find((game) => game.id === id);
  });

  const getGameByLegacyId = computed(() => {
    return (legacyId: number) => games.value.find((game) => game.legacyId === legacyId);
  });

  /**
   * Get featured games using personalization algorithm
   * Currently uses random selection but structured for future enhancement
   * with user bookmarks, favorites, upcoming events, and popularity metrics
   */
  const featuredGames = computed(() => {
    return getFeaturedGames();
  });

  // Search games
  const searchGames = computed(() => {
    return (searchTerm: string) => {
      if (!searchTerm.trim()) return approvedGames.value;

      const term = searchTerm.toLowerCase();
      return approvedGames.value.filter(
        (game) =>
          game.title.toLowerCase().includes(term) ||
          game.genre.toLowerCase().includes(term) ||
          game.description.toLowerCase().includes(term) ||
          game.publisher?.toLowerCase().includes(term) ||
          game.tags?.some((tag) => tag.toLowerCase().includes(term)) ||
          game.components.some((component) => component.toLowerCase().includes(term)),
      );
    };
  });

  /**
   * Calculate featured games based on user data and engagement metrics
   * Currently uses random selection for development, but structured for future enhancement
   * with real personalization algorithms considering:
   * - User's bookmarked/favorite games
   * - Games with upcoming events the user RSVPed to
   * - Popular games with high RSVP rates
   * - Games in user's preferred genres
   * - Recently added/updated games
   */
  const getFeaturedGames = (count = 3): Game[] => {
    // Use only active games (simplified from approved + active)
    const availableGames = games.value.filter((game) => game.status === 'active');

    if (availableGames.length === 0) {
      return [];
    }

    // Use the featured games service for calculation
    const result = FeaturedGamesService.getFeaturedGames(availableGames, { count });
    return result;

    // TODO: Future enhancement - Add user-specific criteria:
    // - Load user preferences for bookmarks/favorites
    // - Get user's upcoming events
    // - Calculate user's genre preferences
    // - Pass to service for personalized results
  };

  // Actions
  const submitGame = async (gameData: GameSubmissionData) => {
    if (!authService.isAuthenticated.value || !authService.currentUserId.value) {
      throw new Error('Must be authenticated to submit games');
    }

    loading.value = true;
    error.value = null;

    try {
      const authUser = authService.currentUser.value;
      if (!authUser) {
        throw new Error('User authentication data not found');
      }

      const newGameData: FirebaseGame = {
        legacyId: Date.now(), // Generate a legacy ID
        ...gameData,
        createdAt: serverTimestamp() as unknown as Timestamp,
        updatedAt: serverTimestamp() as unknown as Timestamp,
        createdBy: authService.currentUserId.value,
        approved: false, // Submissions need approval
        status: 'pending', // Pending approval
      } as FirebaseGame;

      await addDoc(collection(db, 'games'), newGameData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to submit game: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createGame = async (gameData: Partial<FirebaseGame>) => {
    if (!authService.isAuthenticated.value || !authService.currentUserId.value) {
      throw new Error('Must be authenticated to create games');
    }

    loading.value = true;
    error.value = null;

    try {
      const newGameData: FirebaseGame = {
        ...gameData,
        createdAt: serverTimestamp() as unknown as Timestamp,
        updatedAt: serverTimestamp() as unknown as Timestamp,
        createdBy: authService.currentUserId.value,
        approved: false, // New games need approval by default
        status: 'pending',
      } as FirebaseGame;

      await addDoc(collection(db, 'games'), newGameData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to create game: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateGame = async (gameId: string, updates: Partial<FirebaseGame>) => {
    if (!authService.isAuthenticated.value) {
      throw new Error('Must be authenticated to update games');
    }

    loading.value = true;
    error.value = null;

    try {
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to update game: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!authService.isAuthenticated.value) {
      throw new Error('Must be authenticated to delete games');
    }

    loading.value = true;
    error.value = null;

    try {
      const gameRef = doc(db, 'games', gameId);
      await deleteDoc(gameRef);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to delete game: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Admin functions
  const approveGame = async (gameId: string) => {
    if (!authService.isAuthenticated.value || !authService.currentUserId.value) {
      throw new Error('Must be authenticated admin to approve games');
    }

    await updateGame(gameId, {
      approved: true,
      approvedBy: authService.currentUserId.value,
      approvedAt: serverTimestamp() as unknown as Timestamp,
      status: 'active',
    });
  };

  const rejectGame = async (gameId: string) => {
    if (!authService.isAuthenticated.value) {
      throw new Error('Must be authenticated admin to reject games');
    }

    await updateGame(gameId, {
      approved: false,
      status: 'inactive',
    });
  };

  // Subscribe to games collection
  const subscribeToGames = () => {
    const q = query(collection(db, 'games'), orderBy('title', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        games.value = snapshot.docs.map((doc) => {
          const data = doc.data() as FirebaseGame;
          return Game.fromFirebase(doc.id, data);
        });
        error.value = null;
      },
      (err) => {
        console.error('Games subscription error:', err);
        error.value = `Failed to load games: ${err.message}`;
      },
    );

    unsubscribes.value.push(unsubscribe);
    return unsubscribe;
  };

  // Load games once (without real-time updates)
  const loadGames = async () => {
    loading.value = true;
    error.value = null;

    try {
      const q = query(collection(db, 'games'), orderBy('title', 'asc'));

      const snapshot = await getDocs(q);

      games.value = snapshot.docs.map((doc) => {
        const data = doc.data() as FirebaseGame;
        const game = Game.fromFirebase(doc.id, data);
        return game;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to load games: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get featured games with optional user personalization data
   * This method can be called with user-specific data for personalized results
   */
  const getFeaturedGamesWithUserData = async (
    criteria: {
      userFavorites?: string[];
      userBookmarks?: string[];
      upcomingEventsForUser?: Event[];
      allUpcomingEvents?: Event[];
      userGenrePreferences?: string[];
      count?: number;
    } = {},
  ) => {
    // Ensure games are loaded
    if (games.value.length === 0) {
      await loadGames();
    }

    // Use all active games since approval is not currently used
    const availableGames = games.value.filter((game) => game.status === 'active');

    if (availableGames.length === 0) return [];

    // Use the featured games service for calculation
    return FeaturedGamesService.getFeaturedGames(availableGames, criteria);
  };

  // CLCA Integration Methods
  const publishGameToCLCA = async (gameId: string): Promise<void> => {
    const game = games.value.find((g) => g.id === gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    try {
      // Map to ContentDoc
      const contentDoc = await contentDocMappingService.mapGameToContentDoc(game);

      // Publish to CLCA
      const result = await clcaIngestService.publishContent(contentDoc);

      // Update sync status
      clcaSyncStatus.value.set(gameId, {
        synced: true,
        syncedAt: new Date(),
        clcaId: result.id,
      });

      logger.info('Game published to CLCA', {
        gameId: game.id,
        clcaId: result.id,
      });
    } catch (error) {
      // Update sync status with error
      clcaSyncStatus.value.set(gameId, {
        synced: false,
        error: (error as Error).message,
      });

      // Add to dead letter queue for retry
      try {
        const contentDoc = await contentDocMappingService.mapGameToContentDoc(game);
        await dlqService.addToDLQ(contentDoc, error as CLCAIngestError, {
          eventId: game.id,
          attempt: 1,
        });
      } catch (mappingError) {
        logger.error('Failed to add failed CLCA sync to DLQ', mappingError as Error, {
          gameId: game.id,
        });
      }

      throw error;
    }
  };

  const getGameCLCASyncStatus = computed(() => {
    return (gameId: string) => clcaSyncStatus.value.get(gameId);
  });

  // Enhanced createGame method with automatic CLCA publishing
  const createGameWithCLCA = async (
    gameData: Partial<FirebaseGame>,
    syncToCLCA = true,
  ): Promise<void> => {
    try {
      // Create game using existing method
      await createGame(gameData);

      // If game is approved and sync is enabled, publish to CLCA
      if (gameData.approved && syncToCLCA && clcaIngestService.isConfigured()) {
        // Find the created game (this is a simplified approach)
        const createdGame = games.value.find(
          (g) => g.title === gameData.title && g.createdBy === gameData.createdBy,
        );

        if (createdGame) {
          try {
            await publishGameToCLCA(createdGame.id);
          } catch (clcaError) {
            logger.warn('CLCA sync failed during game creation', clcaError as Error);
            // Don't fail game creation if CLCA sync fails
          }
        }
      }
    } catch (error) {
      logger.error('Failed to create game with CLCA sync', error as Error, { gameData });
      throw error;
    }
  };

  // Enhanced approveGame method with automatic CLCA publishing
  const approveGameWithCLCA = async (gameId: string, syncToCLCA = true): Promise<void> => {
    try {
      // Approve game using existing method
      await approveGame(gameId);

      // Auto-sync to CLCA if sync is enabled
      if (syncToCLCA && clcaIngestService.isConfigured()) {
        try {
          await publishGameToCLCA(gameId);
        } catch (clcaError) {
          logger.warn('CLCA sync failed during game approval', clcaError as Error);
          // Don't fail game approval if CLCA sync fails
        }
      }
    } catch (error) {
      logger.error('Failed to approve game with CLCA sync', error as Error, { gameId });
      throw error;
    }
  };

  // Batch sync all approved games to CLCA (admin function)
  const syncAllGamesToCLCA = async (): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ gameId: string; error: string }>;
  }> => {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ gameId: string; error: string }>,
    };

    const approvedGamesList = games.value.filter((g) => g.approved && g.status === 'active');

    logger.info('Starting batch CLCA game sync', { gameCount: approvedGamesList.length });

    for (const game of approvedGamesList) {
      try {
        await publishGameToCLCA(game.id);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          gameId: game.id,
          error: (error as Error).message,
        });
      }
    }

    logger.info('Batch CLCA game sync completed', results);
    return results;
  };

  // Cleanup function
  const cleanup = () => {
    unsubscribes.value.forEach((unsubscribe) => unsubscribe());
    unsubscribes.value = [];
  };

  return {
    // State
    games,
    loading,
    error,

    // Getters
    approvedGames,
    pendingGames,
    featuredGames,
    gamesByGenre,
    getGameById,
    getGameByLegacyId,
    searchGames,
    getGameCLCASyncStatus,

    // Actions
    submitGame,
    createGame,
    updateGame,
    deleteGame,
    approveGame,
    rejectGame,
    subscribeToGames,
    loadGames,
    getFeaturedGamesWithUserData,
    cleanup,

    // CLCA Integration
    publishGameToCLCA,
    createGameWithCLCA,
    approveGameWithCLCA,
    syncAllGamesToCLCA,
  };
});
