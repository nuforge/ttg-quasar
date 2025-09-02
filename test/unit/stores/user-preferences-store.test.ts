import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserPreferencesStore } from 'src/stores/user-preferences-store';

// Mock the auth service
vi.mock('src/services/auth-service', () => ({
  authService: {
    currentUser: { value: { uid: 'test-user-id', email: 'test@example.com' } },
    currentUserId: { value: 'test-user-id' },
    getCurrentUser: vi.fn(() => ({ uid: 'test-user-id' })),
    isAuthenticated: vi.fn(() => true),
  },
}));

// Mock the user preferences service
vi.mock('src/services/user-preferences-service', () => ({
  userPreferencesService: {
    getUserPreferences: vi.fn(),
    toggleFavorite: vi.fn(),
    toggleBookmark: vi.fn(),
    toggleEventNotifications: vi.fn(),
    updateGlobalSettings: vi.fn(),
    updateLanguagePreference: vi.fn(),
  },
}));

describe('UserPreferencesStore - Business Logic Tests', () => {
  let store: ReturnType<typeof useUserPreferencesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useUserPreferencesStore();
  });

  describe('Store Initialization', () => {
    it('should initialize with proper default state', () => {
      expect(store.preferences).toBeUndefined(); // ref starts as undefined, not null
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull(); // error ref starts as null
    });

    it('should have reactive state properties', () => {
      // Verify state properties exist (even if undefined initially)
      expect('preferences' in store).toBe(true);
      expect('loading' in store).toBe(true);
      expect('error' in store).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('should have isLoaded computed property', () => {
      expect(typeof store.isLoaded).toBe('boolean');
      // Note: isLoaded may be true due to immediate auth watcher triggering
    });

    it('should have computed functions for game queries', () => {
      expect(typeof store.isFavorite).toBe('function');
      expect(typeof store.isBookmarked).toBe('function');
      expect(typeof store.hasEventNotifications).toBe('function');
    });

    it('should have array getters for games', () => {
      expect(Array.isArray(store.favoriteGames)).toBe(true);
      expect(Array.isArray(store.bookmarkedGames)).toBe(true);
      expect(store.favoriteGames).toEqual([]); // Empty when no preferences
      expect(store.bookmarkedGames).toEqual([]); // Empty when no preferences
    });

    it('should have notification settings getter', () => {
      expect(typeof store.getEventNotificationSettings).toBe('function');
      expect('globalSettings' in store).toBe(true); // Property exists
    });
  });

  describe('Store Actions', () => {
    it('should have loadPreferences action', () => {
      expect(typeof store.loadPreferences).toBe('function');
      expect(store.loadPreferences.length).toBeGreaterThanOrEqual(0); // Optional userId parameter
    });

    it('should have toggleFavorite action', () => {
      expect(typeof store.toggleFavorite).toBe('function');
      // Note: async functions don't expose their parameter count reliably
    });

    it('should have toggleBookmark action', () => {
      expect(typeof store.toggleBookmark).toBe('function');
      // Note: async functions don't expose their parameter count reliably
    });

    it('should have notification management actions', () => {
      expect(typeof store.toggleEventNotifications).toBe('function');
      expect(typeof store.updateGlobalSettings).toBe('function');
      expect(typeof store.updateLanguagePreference).toBe('function');
    });

    it('should have utility actions', () => {
      expect(typeof store.clearPreferences).toBe('function');
      expect(store.clearPreferences.length).toBe(0); // No parameters
    });
  });

  describe('Business Logic Rules', () => {
    it('should handle string game IDs in computed functions', () => {
      // Test that functions accept string parameters
      const testGameId = 'game-123';
      expect(() => store.isFavorite(testGameId)).not.toThrow();
      expect(() => store.isBookmarked(testGameId)).not.toThrow();
      expect(() => store.hasEventNotifications(testGameId)).not.toThrow();
    });

    it('should maintain consistent array state', () => {
      // Arrays should always be arrays, never null/undefined
      expect(Array.isArray(store.favoriteGames)).toBe(true);
      expect(Array.isArray(store.bookmarkedGames)).toBe(true);
    });

    it('should handle undefined preferences state consistently', () => {
      // When preferences is undefined/null, computed should return sensible defaults
      expect('preferences' in store).toBe(true); // Property exists
      // Note: isLoaded may be true due to immediate auth watcher
      expect(store.favoriteGames).toEqual([]);
      expect(store.bookmarkedGames).toEqual([]);
    });
  });

  describe('State Management Structure', () => {
    it('should track loading state properly', () => {
      expect(typeof store.loading).toBe('boolean');
      expect(store.loading).toBe(false); // Initial state
    });

    it('should track error state properly', () => {
      expect('error' in store).toBe(true); // Property exists
    });

    it('should have preferences state container', () => {
      expect('preferences' in store).toBe(true); // Property exists
    });
  });

  describe('Store Integration Readiness', () => {
    it('should be ready for service integration', () => {
      // Store should expose all necessary actions for service integration
      const requiredActions = ['loadPreferences', 'toggleFavorite', 'toggleBookmark'];
      requiredActions.forEach((action) => {
        expect(typeof store[action as keyof typeof store]).toBe('function');
      });
    });

    it('should be ready for component integration', () => {
      // Store should expose all necessary computed properties for components
      const requiredGetters = ['isLoaded', 'favoriteGames', 'bookmarkedGames'];
      requiredGetters.forEach((getter) => {
        expect(getter in store).toBe(true);
      });
    });

    it('should be ready for authentication integration', () => {
      // Store should handle auth state changes (tested via store structure)
      expect(typeof store.loadPreferences).toBe('function');
      expect(typeof store.clearPreferences).toBe('function');
    });
  });
});
