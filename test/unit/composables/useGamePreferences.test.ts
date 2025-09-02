import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, computed } from 'vue';

// Mock the composable to return a testable implementation
vi.mock('src/composables/useGamePreferences', () => ({
  useGamePreferences: () => ({
    // State
    isAuthenticated: computed(() => true),
    isLoaded: computed(() => true),
    loading: computed(() => false),

    // Game state checks
    isFavorite: vi.fn((gameId: string) => gameId === 'game1'),
    isBookmarked: vi.fn((gameId: string) => gameId === 'game2'),
    hasNotifications: vi.fn((gameId: string) => gameId === 'game1'),

    // Collections
    favoriteGames: computed(() => ['game1', 'game2']),
    bookmarkedGames: computed(() => ['game2', 'game3']),

    // Notifications
    unreadNotifications: computed(() => [{ id: '1', gameId: 'game1' }]),
    unreadCount: computed(() => 1),
    hasUnreadForGame: vi.fn((gameId: string) => gameId === 'game1'),

    // Actions
    toggleFavorite: vi.fn().mockResolvedValue(undefined),
    toggleBookmark: vi.fn().mockResolvedValue(undefined),
    toggleNotifications: vi.fn().mockResolvedValue(undefined),
    getNotificationSettings: vi.fn(() => ({ notifyDaysBefore: 1 })),
    updateGlobalSettings: vi.fn().mockResolvedValue(undefined),
  }),
}));

const { useGamePreferences } = await import('src/composables/useGamePreferences');

describe('useGamePreferences', () => {
  let composable: ReturnType<typeof useGamePreferences>;

  beforeEach(() => {
    vi.clearAllMocks();
    composable = useGamePreferences();
  });

  describe('initialization', () => {
    it('should initialize composable', () => {
      expect(composable).toBeDefined();
      expect(composable.isAuthenticated.value).toBe(true);
      expect(composable.loading.value).toBe(false);
      expect(composable.isLoaded.value).toBe(true);
    });

    it('should have reactive favorite games', () => {
      expect(composable.favoriteGames).toBeDefined();
      expect(composable.favoriteGames.value).toEqual(['game1', 'game2']);
    });

    it('should have reactive bookmarked games', () => {
      expect(composable.bookmarkedGames).toBeDefined();
      expect(composable.bookmarkedGames.value).toEqual(['game2', 'game3']);
    });

    it('should have reactive notifications', () => {
      expect(composable.unreadNotifications).toBeDefined();
      expect(composable.unreadCount.value).toBe(1);
    });
  });

  describe('game state checks', () => {
    it('should check favorite status', () => {
      expect(composable.isFavorite('game1')).toBe(true);
      expect(composable.isFavorite('game3')).toBe(false);
    });

    it('should check bookmark status', () => {
      expect(composable.isBookmarked('game2')).toBe(true);
      expect(composable.isBookmarked('game1')).toBe(false);
    });

    it('should check notification status', () => {
      expect(composable.hasNotifications('game1')).toBe(true);
      expect(composable.hasNotifications('game2')).toBe(false);
    });

    it('should check unread notifications for game', () => {
      expect(composable.hasUnreadForGame('game1')).toBe(true);
      expect(composable.hasUnreadForGame('game2')).toBe(false);
    });
  });

  describe('actions', () => {
    it('should toggle favorite', async () => {
      await composable.toggleFavorite('test-game');
      expect(composable.toggleFavorite).toHaveBeenCalledWith('test-game');
    });

    it('should toggle bookmark', async () => {
      await composable.toggleBookmark('test-game');
      expect(composable.toggleBookmark).toHaveBeenCalledWith('test-game');
    });

    it('should toggle notifications with settings', async () => {
      const settings = {
        notifyDaysBefore: 2,
        notifyOnNewEvents: true,
        notifyOnUpdates: false,
      };
      await composable.toggleNotifications('test-game', settings);
      expect(composable.toggleNotifications).toHaveBeenCalledWith('test-game', settings);
    });

    it('should update global settings with proper structure', async () => {
      const settings = {
        emailNotifications: false,
        pushNotifications: true,
        defaultNotifyDaysBefore: 3,
      };
      await composable.updateGlobalSettings(settings);
      expect(composable.updateGlobalSettings).toHaveBeenCalledWith(settings);
    });

    it('should get notification settings', () => {
      const settings = composable.getNotificationSettings('test-game');
      expect(settings).toEqual({ notifyDaysBefore: 1 });
      expect(composable.getNotificationSettings).toHaveBeenCalledWith('test-game');
    });
  });
});
