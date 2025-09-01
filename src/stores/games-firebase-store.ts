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

export const useGamesFirebaseStore = defineStore('gamesFirebase', () => {
  // State
  const games = ref<Game[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const unsubscribes = ref<Unsubscribe[]>([]);

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
  };
});
