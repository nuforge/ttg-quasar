import { computed } from 'vue';
import { useUserPreferencesStore } from 'src/stores/user-preferences-store';
import { useGameNotificationsStore } from 'src/stores/game-notifications-store';
import { authService } from 'src/services/auth-service';

/**
 * Composable for managing game preferences (favorites, bookmarks, notifications)
 */
export function useGamePreferences() {
  const preferencesStore = useUserPreferencesStore();
  const notificationsStore = useGameNotificationsStore();

  const isAuthenticated = computed(() => authService.isAuthenticated.value);
  const isLoaded = computed(() => preferencesStore.isLoaded);
  const loading = computed(() => preferencesStore.loading);

  // Game state checks
  const isFavorite = (gameId: string) => preferencesStore.isFavorite(gameId);
  const isBookmarked = (gameId: string) => preferencesStore.isBookmarked(gameId);
  const hasNotifications = (gameId: string) => preferencesStore.hasEventNotifications(gameId);

  // Collections
  const favoriteGames = computed(() => preferencesStore.favoriteGames);
  const bookmarkedGames = computed(() => preferencesStore.bookmarkedGames);

  // Notifications
  const unreadNotifications = computed(() => notificationsStore.unreadNotifications);
  const unreadCount = computed(() => notificationsStore.unreadCount);
  const hasUnreadForGame = (gameId: string) => notificationsStore.hasUnreadForGame(gameId);

  // Actions
  const toggleFavorite = async (gameId: string) => {
    if (!isAuthenticated.value) {
      throw new Error('User not authenticated');
    }
    return preferencesStore.toggleFavorite(gameId);
  };

  const toggleBookmark = async (gameId: string) => {
    if (!isAuthenticated.value) {
      throw new Error('User not authenticated');
    }
    return preferencesStore.toggleBookmark(gameId);
  };

  const toggleNotifications = async (
    gameId: string,
    settings?: {
      notifyDaysBefore?: number;
      notifyOnNewEvents?: boolean;
      notifyOnUpdates?: boolean;
    },
  ) => {
    if (!isAuthenticated.value) {
      throw new Error('User not authenticated');
    }
    return preferencesStore.toggleEventNotifications(gameId, settings);
  };

  const getNotificationSettings = (gameId: string) => {
    return preferencesStore.getEventNotificationSettings(gameId);
  };

  const updateGlobalSettings = async (settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    defaultNotifyDaysBefore?: number;
  }) => {
    if (!isAuthenticated.value) {
      throw new Error('User not authenticated');
    }
    return preferencesStore.updateGlobalSettings(settings);
  };

  return {
    // State
    isAuthenticated,
    isLoaded,
    loading,

    // Game state checks
    isFavorite,
    isBookmarked,
    hasNotifications,

    // Collections
    favoriteGames,
    bookmarkedGames,

    // Notifications
    unreadNotifications,
    unreadCount,
    hasUnreadForGame,

    // Actions
    toggleFavorite,
    toggleBookmark,
    toggleNotifications,
    getNotificationSettings,
    updateGlobalSettings,
  };
}
