import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import {
  gameEventNotificationService,
  type GameEventNotification,
} from 'src/services/game-event-notification-service';
import { authService } from 'src/services/auth-service';

export const useGameNotificationsStore = defineStore('gameNotifications', () => {
  // State
  const notifications = ref<GameEventNotification[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const unreadNotifications = computed(() => notifications.value.filter((n) => !n.read));

  const unreadCount = computed(() => unreadNotifications.value.length);

  const notificationsByGame = computed(() => {
    return (gameId: string) => notifications.value.filter((n) => n.gameId === gameId);
  });

  const hasUnreadForGame = computed(() => {
    return (gameId: string) => unreadNotifications.value.some((n) => n.gameId === gameId);
  });

  // Actions
  const loadNotifications = async (options?: {
    unreadOnly?: boolean;
    gameId?: string;
    limit?: number;
  }) => {
    const userId = authService.currentUserId.value;
    if (!userId) {
      notifications.value = [];
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      notifications.value = await gameEventNotificationService.getUserNotifications(
        userId,
        options,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications';
      error.value = errorMessage;
      console.error('Error loading notifications:', err);
    } finally {
      loading.value = false;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await gameEventNotificationService.markAsRead(notificationId);

      // Optimistic update
      const notification = notifications.value.find((n) => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark as read';
      error.value = errorMessage;
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const userId = authService.currentUserId.value;
    if (!userId) return;

    try {
      await gameEventNotificationService.markAllAsRead(userId);

      // Optimistic update
      notifications.value.forEach((n) => (n.read = true));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all as read';
      error.value = errorMessage;
      console.error('Error marking all notifications as read:', err);
    }
  };

  const clearNotifications = () => {
    notifications.value = [];
    error.value = null;
  };

  // Watch for auth state changes
  watch(
    () => authService.currentUser.value,
    (user) => {
      if (user) {
        void loadNotifications();
      } else {
        clearNotifications();
      }
    },
    { immediate: true },
  );

  return {
    // State
    notifications,
    loading,
    error,

    // Getters
    unreadNotifications,
    unreadCount,
    notificationsByGame,
    hasUnreadForGame,

    // Actions
    loadNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
});
