import { describe, it, expect, beforeEach } from 'vitest';
import { UserPreferences } from 'src/models/UserPreferences';
import type { FirebaseUserPreferences } from 'src/models/UserPreferences';
import type { Timestamp } from 'firebase/firestore';

describe('UserPreferences Model', () => {
  let mockFirebaseData: Partial<FirebaseUserPreferences>;

  beforeEach(() => {
    mockFirebaseData = {
      userId: 'user123',
      favoriteGames: ['game1', 'game2'],
      bookmarkedGames: ['game3', 'game4'],
      preferredLanguage: 'en-US',
      eventNotificationPreferences: {
        game1: {
          enabled: true,
          notifyDaysBefore: 3,
          notifyOnNewEvents: true,
          notifyOnUpdates: false,
        },
      },
      globalNotificationSettings: {
        emailNotifications: true,
        pushNotifications: false,
        defaultNotifyDaysBefore: 5,
      },
      createdAt: { toDate: () => new Date('2025-01-01') } as Timestamp,
      updatedAt: { toDate: () => new Date('2025-01-02') } as Timestamp,
    };
  });

  describe('Constructor', () => {
    it('should create UserPreferences with minimal data', () => {
      const preferences = new UserPreferences('user123');

      expect(preferences.userId).toBe('user123');
      expect(preferences.favoriteGames).toEqual([]);
      expect(preferences.bookmarkedGames).toEqual([]);
      expect(preferences.preferredLanguage).toBeUndefined();
      expect(preferences.eventNotificationPreferences).toEqual({});
      expect(preferences.globalNotificationSettings).toEqual({
        emailNotifications: true,
        pushNotifications: true,
        defaultNotifyDaysBefore: 3,
      });
      expect(preferences.createdAt).toBeUndefined();
      expect(preferences.updatedAt).toBeUndefined();
    });

    it('should create UserPreferences with full Firebase data', () => {
      const preferences = new UserPreferences('user123', mockFirebaseData);

      expect(preferences.userId).toBe('user123');
      expect(preferences.favoriteGames).toEqual(['game1', 'game2']);
      expect(preferences.bookmarkedGames).toEqual(['game3', 'game4']);
      expect(preferences.preferredLanguage).toBe('en-US');
      expect(preferences.eventNotificationPreferences).toEqual(
        mockFirebaseData.eventNotificationPreferences,
      );
      expect(preferences.globalNotificationSettings).toEqual(
        mockFirebaseData.globalNotificationSettings,
      );
      expect(preferences.createdAt).toEqual(new Date('2025-01-01'));
      expect(preferences.updatedAt).toEqual(new Date('2025-01-02'));
    });

    it('should handle undefined Firebase timestamps', () => {
      const dataWithoutTimestamps = { ...mockFirebaseData };
      delete dataWithoutTimestamps.createdAt;
      delete dataWithoutTimestamps.updatedAt;

      const preferences = new UserPreferences('user123', dataWithoutTimestamps);

      expect(preferences.createdAt).toBeUndefined();
      expect(preferences.updatedAt).toBeUndefined();
    });

    it('should handle partial data with defaults', () => {
      const partialData: Partial<FirebaseUserPreferences> = {
        userId: 'user123',
        favoriteGames: ['game1'],
      };

      const preferences = new UserPreferences('user123', partialData);

      expect(preferences.favoriteGames).toEqual(['game1']);
      expect(preferences.bookmarkedGames).toEqual([]);
      expect(preferences.preferredLanguage).toBeUndefined();
      expect(preferences.eventNotificationPreferences).toEqual({});
      expect(preferences.globalNotificationSettings).toEqual({
        emailNotifications: true,
        pushNotifications: true,
        defaultNotifyDaysBefore: 3,
      });
    });
  });

  describe('Helper Methods', () => {
    let preferences: UserPreferences;

    beforeEach(() => {
      preferences = new UserPreferences('user123', mockFirebaseData);
    });

    describe('isFavorite', () => {
      it('should return true for favorite games', () => {
        expect(preferences.isFavorite('game1')).toBe(true);
        expect(preferences.isFavorite('game2')).toBe(true);
      });

      it('should return false for non-favorite games', () => {
        expect(preferences.isFavorite('game3')).toBe(false);
        expect(preferences.isFavorite('nonexistent')).toBe(false);
      });

      it('should handle empty favorites array', () => {
        const emptyPreferences = new UserPreferences('user123');
        expect(emptyPreferences.isFavorite('game1')).toBe(false);
      });
    });

    describe('isBookmarked', () => {
      it('should return true for bookmarked games', () => {
        expect(preferences.isBookmarked('game3')).toBe(true);
        expect(preferences.isBookmarked('game4')).toBe(true);
      });

      it('should return false for non-bookmarked games', () => {
        expect(preferences.isBookmarked('game1')).toBe(false);
        expect(preferences.isBookmarked('nonexistent')).toBe(false);
      });

      it('should handle empty bookmarks array', () => {
        const emptyPreferences = new UserPreferences('user123');
        expect(emptyPreferences.isBookmarked('game1')).toBe(false);
      });
    });

    describe('hasEventNotifications', () => {
      it('should return true for games with enabled notifications', () => {
        expect(preferences.hasEventNotifications('game1')).toBe(true);
      });

      it('should return false for games without notification settings', () => {
        expect(preferences.hasEventNotifications('game2')).toBe(false);
        expect(preferences.hasEventNotifications('nonexistent')).toBe(false);
      });

      it('should return false for games with disabled notifications', () => {
        preferences.eventNotificationPreferences.game2 = {
          enabled: false,
          notifyDaysBefore: 1,
          notifyOnNewEvents: true,
          notifyOnUpdates: true,
        };
        expect(preferences.hasEventNotifications('game2')).toBe(false);
      });

      it('should handle empty notification preferences', () => {
        const emptyPreferences = new UserPreferences('user123');
        expect(emptyPreferences.hasEventNotifications('game1')).toBe(false);
      });
    });

    describe('getEventNotificationSettings', () => {
      it('should return existing notification settings', () => {
        const settings = preferences.getEventNotificationSettings('game1');
        expect(settings).toEqual({
          enabled: true,
          notifyDaysBefore: 3,
          notifyOnNewEvents: true,
          notifyOnUpdates: false,
        });
      });

      it('should return default settings for games without preferences', () => {
        const settings = preferences.getEventNotificationSettings('game2');
        expect(settings).toEqual({
          enabled: false,
          notifyDaysBefore: 5, // From globalNotificationSettings.defaultNotifyDaysBefore
          notifyOnNewEvents: true,
          notifyOnUpdates: true,
        });
      });

      it('should use global defaults for non-existent games', () => {
        const settings = preferences.getEventNotificationSettings('nonexistent');
        expect(settings.enabled).toBe(false);
        expect(settings.notifyDaysBefore).toBe(5);
        expect(settings.notifyOnNewEvents).toBe(true);
        expect(settings.notifyOnUpdates).toBe(true);
      });
    });
  });

  describe('Firebase Integration', () => {
    describe('toFirebase', () => {
      it('should convert to Firebase format with all fields', () => {
        const preferences = new UserPreferences('user123', mockFirebaseData);
        const firebaseData = preferences.toFirebase();

        expect(firebaseData).toEqual({
          userId: 'user123',
          favoriteGames: ['game1', 'game2'],
          bookmarkedGames: ['game3', 'game4'],
          preferredLanguage: 'en-US',
          eventNotificationPreferences: mockFirebaseData.eventNotificationPreferences,
          globalNotificationSettings: mockFirebaseData.globalNotificationSettings,
        });
      });

      it('should exclude undefined preferredLanguage', () => {
        const preferences = new UserPreferences('user123');
        const firebaseData = preferences.toFirebase();

        expect(firebaseData).not.toHaveProperty('preferredLanguage');
        expect(firebaseData.userId).toBe('user123');
        expect(firebaseData.favoriteGames).toEqual([]);
      });

      it('should include preferredLanguage when defined', () => {
        const dataWithLanguage = { ...mockFirebaseData, preferredLanguage: 'en-ES' };
        const preferences = new UserPreferences('user123', dataWithLanguage);
        const firebaseData = preferences.toFirebase();

        expect(firebaseData.preferredLanguage).toBe('en-ES');
      });
    });

    describe('fromFirebase', () => {
      it('should create UserPreferences from Firebase data', () => {
        const preferences = UserPreferences.fromFirebase(
          mockFirebaseData as FirebaseUserPreferences,
        );

        expect(preferences.userId).toBe('user123');
        expect(preferences.favoriteGames).toEqual(['game1', 'game2']);
        expect(preferences.bookmarkedGames).toEqual(['game3', 'game4']);
        expect(preferences.preferredLanguage).toBe('en-US');
        expect(preferences.createdAt).toEqual(new Date('2025-01-01'));
        expect(preferences.updatedAt).toEqual(new Date('2025-01-02'));
      });

      it('should handle minimal Firebase data', () => {
        const minimalData: FirebaseUserPreferences = {
          userId: 'user456',
          favoriteGames: [],
          bookmarkedGames: [],
          eventNotificationPreferences: {},
          globalNotificationSettings: {
            emailNotifications: false,
            pushNotifications: false,
            defaultNotifyDaysBefore: 1,
          },
        };

        const preferences = UserPreferences.fromFirebase(minimalData);

        expect(preferences.userId).toBe('user456');
        expect(preferences.favoriteGames).toEqual([]);
        expect(preferences.bookmarkedGames).toEqual([]);
        expect(preferences.preferredLanguage).toBeUndefined();
        expect(preferences.globalNotificationSettings.emailNotifications).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user ID', () => {
      const preferences = new UserPreferences('');
      expect(preferences.userId).toBe('');
      expect(preferences.favoriteGames).toEqual([]);
    });

    it('should handle missing optional arrays in partial data', () => {
      const partialData: Partial<FirebaseUserPreferences> = {
        userId: 'user123',
        // favoriteGames and bookmarkedGames omitted (not undefined)
        preferredLanguage: 'en-US',
      };

      const preferences = new UserPreferences('user123', partialData);
      expect(preferences.favoriteGames).toEqual([]);
      expect(preferences.bookmarkedGames).toEqual([]);
      expect(preferences.preferredLanguage).toBe('en-US');
    });

    it('should handle missing notification settings in partial data', () => {
      const partialData: Partial<FirebaseUserPreferences> = {
        userId: 'user123',
        favoriteGames: ['game1'],
        bookmarkedGames: ['game2'],
        // eventNotificationPreferences and globalNotificationSettings omitted
      };

      const preferences = new UserPreferences('user123', partialData);
      expect(preferences.eventNotificationPreferences).toEqual({});
      expect(preferences.globalNotificationSettings).toEqual({
        emailNotifications: true,
        pushNotifications: true,
        defaultNotifyDaysBefore: 3,
      });
    });

    it('should handle undefined preferredLanguage correctly', () => {
      const dataWithoutLanguage: Partial<FirebaseUserPreferences> = {
        userId: 'user123',
        favoriteGames: [],
        bookmarkedGames: [],
        eventNotificationPreferences: {},
        globalNotificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          defaultNotifyDaysBefore: 7,
        },
        // preferredLanguage omitted (not undefined)
      };

      const preferences = new UserPreferences('user123', dataWithoutLanguage);
      expect(preferences.preferredLanguage).toBeUndefined();
    });
  });
});
