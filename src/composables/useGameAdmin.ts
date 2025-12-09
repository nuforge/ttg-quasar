import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import type { Game } from 'src/models/Game';

export type GameStatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
export type GameSortField = 'title' | 'createdAt' | 'genre' | 'status';
export type GameSortOrder = 'asc' | 'desc';

export interface GameFilters {
  search: string;
  status: GameStatusFilter;
  genre: string | null;
  sortBy: GameSortField;
  sortOrder: GameSortOrder;
}

export interface GameAdminOptions {
  onApproved?: (gameIds: string[]) => void;
  onRejected?: (gameIds: string[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Composable for game administration operations
 * Handles selection, bulk actions, filtering, and CRUD operations
 */
export function useGameAdmin(options: GameAdminOptions = {}) {
  const $q = useQuasar();
  const gamesStore = useGamesFirebaseStore();

  // Selection state
  const selectedGameIds = ref<Set<string>>(new Set());
  const isProcessing = ref(false);

  // Filter state
  const filters = ref<GameFilters>({
    search: '',
    status: 'all',
    genre: null,
    sortBy: 'title',
    sortOrder: 'asc',
  });

  // Computed getters
  const selectedCount = computed(() => selectedGameIds.value.size);
  const hasSelection = computed(() => selectedGameIds.value.size > 0);

  const selectedGames = computed(() => {
    return gamesStore.games.filter((g) => selectedGameIds.value.has(g.id));
  });

  // Filter games based on current filters
  const filteredGames = computed(() => {
    let result = [...gamesStore.games];

    // Status filter
    if (filters.value.status !== 'all') {
      result = result.filter((game) => {
        switch (filters.value.status) {
          case 'pending':
            return game.status === 'pending' && !game.approved;
          case 'approved':
            return game.approved && game.status === 'active';
          case 'rejected':
            return !game.approved && game.status === 'inactive';
          default:
            return true;
        }
      });
    }

    // Genre filter
    if (filters.value.genre) {
      result = result.filter((game) => game.genre === filters.value.genre);
    }

    // Search filter
    if (filters.value.search.trim()) {
      const searchLower = filters.value.search.toLowerCase();
      result = result.filter(
        (game) =>
          game.title.toLowerCase().includes(searchLower) ||
          game.description.toLowerCase().includes(searchLower) ||
          game.genre.toLowerCase().includes(searchLower) ||
          game.publisher?.toLowerCase().includes(searchLower),
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      const field = filters.value.sortBy;

      const aVal = a[field];
      const bVal = b[field];

      if (aVal == null && bVal == null) comparison = 0;
      else if (aVal == null) comparison = 1;
      else if (bVal == null) comparison = -1;
      else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return filters.value.sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  });

  // Available genres from all games
  const availableGenres = computed(() => {
    const genres = new Set<string>();
    gamesStore.games.forEach((game) => {
      if (game.genre) genres.add(game.genre);
    });
    return Array.from(genres).sort();
  });

  // Selection actions
  const selectGame = (gameId: string) => {
    selectedGameIds.value.add(gameId);
  };

  const deselectGame = (gameId: string) => {
    selectedGameIds.value.delete(gameId);
  };

  const toggleGameSelection = (gameId: string) => {
    if (selectedGameIds.value.has(gameId)) {
      selectedGameIds.value.delete(gameId);
    } else {
      selectedGameIds.value.add(gameId);
    }
  };

  const selectAll = () => {
    filteredGames.value.forEach((game) => selectedGameIds.value.add(game.id));
  };

  const deselectAll = () => {
    selectedGameIds.value.clear();
  };

  const isSelected = (gameId: string) => selectedGameIds.value.has(gameId);

  // Bulk actions
  const bulkApprove = async (): Promise<void> => {
    if (!hasSelection.value) return;

    isProcessing.value = true;
    const ids = Array.from(selectedGameIds.value);
    const errors: string[] = [];

    try {
      for (const id of ids) {
        try {
          await gamesStore.approveGame(id);
        } catch (err) {
          errors.push(id);
          console.error(`Failed to approve game ${id}:`, err);
        }
      }

      if (errors.length === 0) {
        $q.notify({
          type: 'positive',
          message: `Successfully approved ${ids.length} game(s)`,
          icon: 'mdi-check-circle',
        });
        options.onApproved?.(ids);
        deselectAll();
      } else {
        $q.notify({
          type: 'warning',
          message: `Approved ${ids.length - errors.length} game(s), ${errors.length} failed`,
          icon: 'mdi-alert',
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Bulk approve failed');
      options.onError?.(error);
      $q.notify({
        type: 'negative',
        message: 'Bulk approve operation failed',
        icon: 'mdi-alert-circle',
      });
    } finally {
      isProcessing.value = false;
    }
  };

  const bulkReject = async (reason?: string): Promise<void> => {
    if (!hasSelection.value) return;

    isProcessing.value = true;
    const ids = Array.from(selectedGameIds.value);
    const errors: string[] = [];

    try {
      for (const id of ids) {
        try {
          await gamesStore.rejectGame(id, reason);
        } catch (err) {
          errors.push(id);
          console.error(`Failed to reject game ${id}:`, err);
        }
      }

      if (errors.length === 0) {
        $q.notify({
          type: 'info',
          message: `Rejected ${ids.length} game(s)`,
          icon: 'mdi-close-circle',
        });
        options.onRejected?.(ids);
        deselectAll();
      } else {
        $q.notify({
          type: 'warning',
          message: `Rejected ${ids.length - errors.length} game(s), ${errors.length} failed`,
          icon: 'mdi-alert',
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Bulk reject failed');
      options.onError?.(error);
      $q.notify({
        type: 'negative',
        message: 'Bulk reject operation failed',
        icon: 'mdi-alert-circle',
      });
    } finally {
      isProcessing.value = false;
    }
  };

  const bulkDelete = async (): Promise<void> => {
    if (!hasSelection.value) return;

    isProcessing.value = true;
    const ids = Array.from(selectedGameIds.value);
    const errors: string[] = [];

    try {
      for (const id of ids) {
        try {
          await gamesStore.deleteGame(id);
        } catch (err) {
          errors.push(id);
          console.error(`Failed to delete game ${id}:`, err);
        }
      }

      if (errors.length === 0) {
        $q.notify({
          type: 'positive',
          message: `Deleted ${ids.length} game(s)`,
          icon: 'mdi-delete',
        });
        deselectAll();
      } else {
        $q.notify({
          type: 'warning',
          message: `Deleted ${ids.length - errors.length} game(s), ${errors.length} failed`,
          icon: 'mdi-alert',
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Bulk delete failed');
      options.onError?.(error);
      $q.notify({
        type: 'negative',
        message: 'Bulk delete operation failed',
        icon: 'mdi-alert-circle',
      });
    } finally {
      isProcessing.value = false;
    }
  };

  // Single game actions with confirmation
  const approveWithConfirm = (game: Game): Promise<boolean> => {
    return new Promise((resolve) => {
      $q.dialog({
        title: 'Approve Game',
        message: `Are you sure you want to approve "${game.title}"?`,
        cancel: true,
        persistent: true,
      })
        .onOk(() => {
          void (async () => {
            try {
              await gamesStore.approveGame(game.id);
              $q.notify({
                type: 'positive',
                message: `"${game.title}" approved`,
                icon: 'mdi-check-circle',
              });
              resolve(true);
            } catch {
              $q.notify({
                type: 'negative',
                message: 'Failed to approve game',
                icon: 'mdi-alert-circle',
              });
              resolve(false);
            }
          })();
        })
        .onCancel(() => resolve(false));
    });
  };

  const rejectWithReason = (game: Game): Promise<boolean> => {
    return new Promise((resolve) => {
      $q.dialog({
        title: 'Reject Game',
        message: `Why is "${game.title}" being rejected?`,
        prompt: {
          model: '',
          type: 'text',
          label: 'Rejection reason (optional)',
        },
        cancel: true,
        persistent: true,
      })
        .onOk((reason: string) => {
          void (async () => {
            try {
              await gamesStore.rejectGame(game.id, reason || undefined);
              $q.notify({
                type: 'info',
                message: `"${game.title}" rejected`,
                icon: 'mdi-close-circle',
              });
              resolve(true);
            } catch {
              $q.notify({
                type: 'negative',
                message: 'Failed to reject game',
                icon: 'mdi-alert-circle',
              });
              resolve(false);
            }
          })();
        })
        .onCancel(() => resolve(false));
    });
  };

  const deleteWithConfirm = (game: Game): Promise<boolean> => {
    return new Promise((resolve) => {
      $q.dialog({
        title: 'Delete Game',
        message: `Are you sure you want to permanently delete "${game.title}"? This action cannot be undone.`,
        cancel: true,
        persistent: true,
        color: 'negative',
      })
        .onOk(() => {
          void (async () => {
            try {
              await gamesStore.deleteGame(game.id);
              $q.notify({
                type: 'positive',
                message: `"${game.title}" deleted`,
                icon: 'mdi-delete',
              });
              resolve(true);
            } catch {
              $q.notify({
                type: 'negative',
                message: 'Failed to delete game',
                icon: 'mdi-alert-circle',
              });
              resolve(false);
            }
          })();
        })
        .onCancel(() => resolve(false));
    });
  };

  // Filter actions
  const resetFilters = () => {
    filters.value = {
      search: '',
      status: 'all',
      genre: null,
      sortBy: 'title',
      sortOrder: 'asc',
    };
  };

  const hasActiveFilters = computed(() => {
    return (
      filters.value.search !== '' ||
      filters.value.status !== 'all' ||
      filters.value.genre !== null
    );
  });

  return {
    // State
    selectedGameIds,
    isProcessing,
    filters,

    // Computed
    selectedCount,
    hasSelection,
    selectedGames,
    filteredGames,
    availableGenres,
    hasActiveFilters,

    // Selection actions
    selectGame,
    deselectGame,
    toggleGameSelection,
    selectAll,
    deselectAll,
    isSelected,

    // Bulk actions
    bulkApprove,
    bulkReject,
    bulkDelete,

    // Single actions with dialogs
    approveWithConfirm,
    rejectWithReason,
    deleteWithConfirm,

    // Filter actions
    resetFilters,
  };
}

