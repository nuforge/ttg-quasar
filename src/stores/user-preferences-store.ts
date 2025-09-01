import { defineStore } from 'pinia';
import { ref, computed, watch, readonly } from 'vue';
import type { UserPreferences } from 'src/models/UserPreferences';
import { userPreferencesService } from 'src/services/user-preferences-service';
import { authService } from 'src/services/auth-service';

export const useUserPreferencesStore = defineStore('userPreferences', () => {
  // State
  const preferences = ref<UserPreferences | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isLoaded = computed(() => preferences.value !== null);
  const currentUserId = computed(() => authService.currentUserId.value);

  const isFavorite = computed(() => {
    return (gameId: string) => preferences.value?.isFavorite(gameId) || false;
  });

  const isBookmarked = computed(() => {
    return (gameId: string) => preferences.value?.isBookmarked(gameId) || false;
  });

  const hasEventNotifications = computed(() => {
    return (gameId: string) => preferences.value?.hasEventNotifications(gameId) || false;
  });

  const favoriteGames = computed(() => preferences.value?.favoriteGames || []);
  const bookmarkedGames = computed(() => preferences.value?.bookmarkedGames || []);

  const getEventNotificationSettings = computed(() => {
    return (gameId: string) => preferences.value?.getEventNotificationSettings(gameId);
  });

  const globalSettings = computed(() => preferences.value?.globalNotificationSettings);

  // Actions
  const loadPreferences = async (userId?: string) => {
    const targetUserId = userId || currentUserId.value;
    if (!targetUserId) {
      preferences.value = null;
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      preferences.value = await userPreferencesService.getUserPreferences(targetUserId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preferences';
      error.value = errorMessage;
      console.error('Error loading user preferences:', err);
    } finally {
      loading.value = false;
    }
  };

  const toggleFavorite = async (gameId: string) => {
    if (!currentUserId.value || !preferences.value) {
      throw new Error('User not authenticated');
    }

    const currentlyFavorite = preferences.value.isFavorite(gameId);

    try {
      await userPreferencesService.toggleFavorite(currentUserId.value, gameId, currentlyFavorite);

      // Optimistic update
      if (currentlyFavorite) {
        preferences.value.favoriteGames = preferences.value.favoriteGames.filter(
          (id) => id !== gameId,
        );
      } else {
        preferences.value.favoriteGames.push(gameId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update favorite';
      error.value = errorMessage;
      throw err;
    }
  };

  const toggleBookmark = async (gameId: string) => {
    if (!currentUserId.value || !preferences.value) {
      throw new Error('User not authenticated');
    }

    const currentlyBookmarked = preferences.value.isBookmarked(gameId);

    try {
      await userPreferencesService.toggleBookmark(currentUserId.value, gameId, currentlyBookmarked);

      // Optimistic update
      if (currentlyBookmarked) {
        preferences.value.bookmarkedGames = preferences.value.bookmarkedGames.filter(
          (id) => id !== gameId,
        );
      } else {
        preferences.value.bookmarkedGames.push(gameId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update bookmark';
      error.value = errorMessage;
      throw err;
    }
  };

  const toggleEventNotifications = async (
    gameId: string,
    settings?: {
      notifyDaysBefore?: number;
      notifyOnNewEvents?: boolean;
      notifyOnUpdates?: boolean;
    },
  ) => {
    if (!currentUserId.value || !preferences.value) {
      throw new Error('User not authenticated');
    }

    const currentlyEnabled = preferences.value.hasEventNotifications(gameId);

    try {
      await userPreferencesService.toggleEventNotifications(
        currentUserId.value,
        gameId,
        currentlyEnabled,
        settings,
      );

      // Optimistic update
      const currentSettings = preferences.value.getEventNotificationSettings(gameId);
      preferences.value.eventNotificationPreferences[gameId] = {
        ...currentSettings,
        enabled: !currentlyEnabled,
        ...(settings && !currentlyEnabled ? settings : {}),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notifications';
      error.value = errorMessage;
      throw err;
    }
  };

  const updateGlobalSettings = async (
    settings: Partial<{
      emailNotifications: boolean;
      pushNotifications: boolean;
      defaultNotifyDaysBefore: number;
    }>,
  ) => {
    if (!currentUserId.value || !preferences.value) {
      throw new Error('User not authenticated');
    }

    try {
      await userPreferencesService.updateGlobalSettings(currentUserId.value, settings);

      // Optimistic update
      preferences.value.globalNotificationSettings = {
        ...preferences.value.globalNotificationSettings,
        ...settings,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      error.value = errorMessage;
      throw err;
    }
  };

  const updateLanguagePreference = async (language: string) => {
    if (!currentUserId.value || !preferences.value) {
      throw new Error('User not authenticated');
    }

    try {
      await userPreferencesService.updateLanguagePreference(currentUserId.value, language);

      // Optimistic update
      preferences.value.preferredLanguage = language;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update language preference';
      error.value = errorMessage;
      throw err;
    }
  };

  const clearPreferences = () => {
    preferences.value = null;
    error.value = null;
  };

  // Watch for auth state changes
  watch(
    () => authService.currentUser.value,
    (user) => {
      if (user?.uid) {
        void loadPreferences(user.uid);
      } else {
        clearPreferences();
      }
    },
    { immediate: true },
  );

  return {
    // State
    preferences: readonly(preferences),
    loading: readonly(loading),
    error: readonly(error),

    // Getters
    isLoaded,
    isFavorite,
    isBookmarked,
    hasEventNotifications,
    favoriteGames,
    bookmarkedGames,
    getEventNotificationSettings,
    globalSettings,

    // Actions
    loadPreferences,
    toggleFavorite,
    toggleBookmark,
    toggleEventNotifications,
    updateGlobalSettings,
    updateLanguagePreference,
    clearPreferences,
  };
});
