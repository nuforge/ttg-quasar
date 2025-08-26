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
import { authService } from 'src/services/auth-service';

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

  const gamesByGenre = computed(() => {
    return (genre: string) => approvedGames.value.filter((game) => game.genre === genre);
  });

  const getGameById = computed(() => {
    return (id: string) => games.value.find((game) => game.id === id);
  });

  const getGameByLegacyId = computed(() => {
    return (legacyId: number) => games.value.find((game) => game.legacyId === legacyId);
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

  // Actions
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
        return Game.fromFirebase(doc.id, data);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to load games: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
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
    gamesByGenre,
    getGameById,
    getGameByLegacyId,
    searchGames,

    // Actions
    createGame,
    updateGame,
    deleteGame,
    approveGame,
    rejectGame,
    subscribeToGames,
    loadGames,
    cleanup,
  };
});
