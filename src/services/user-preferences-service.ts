import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  type Timestamp,
  type FieldValue,
} from 'firebase/firestore';
import { db, auth } from 'src/boot/firebase';
import { UserPreferences, type FirebaseUserPreferences } from 'src/models/UserPreferences';

export class UserPreferencesService {
  private readonly COLLECTION = 'userPreferences';

  /**
   * Check if user is authenticated and authorized
   */
  private checkAuth(userId: string): void {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    if (auth.currentUser.uid !== userId) {
      throw new Error('User not authorized for this operation');
    }
  }

  /**
   * Get user preferences by user ID
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      // Check if user is authenticated
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Only check auth if we're not getting default preferences
      if (auth.currentUser && auth.currentUser.uid !== userId) {
        throw new Error('User not authorized for this operation');
      }

      const docRef = doc(db, this.COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as FirebaseUserPreferences;
        return UserPreferences.fromFirebase(data);
      } else {
        // Only create preferences if user is authenticated
        if (auth.currentUser?.uid === userId) {
          const defaultPrefs = new UserPreferences(userId);
          await this.createUserPreferences(defaultPrefs);
          return defaultPrefs;
        } else {
          // Return default preferences without saving if not authenticated
          return new UserPreferences(userId);
        }
      }
    } catch (error) {
      console.error('Error getting user preferences:', error);
      // Return default preferences on error to prevent UI breaking
      return new UserPreferences(userId);
    }
  }

  /**
   * Create initial user preferences
   */
  async createUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, preferences.userId);
      const data: FirebaseUserPreferences = {
        ...preferences.toFirebase(),
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };
      await setDoc(docRef, data);
    } catch (error) {
      console.error('Error creating user preferences:', error);
      throw error;
    }
  }

  /**
   * Add game to favorites
   */
  async addToFavorites(userId: string, gameId: string): Promise<void> {
    try {
      this.checkAuth(userId);
      const docRef = doc(db, this.COLLECTION, userId);
      await updateDoc(docRef, {
        favoriteGames: arrayUnion(gameId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding game to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove game from favorites
   */
  async removeFromFavorites(userId: string, gameId: string): Promise<void> {
    try {
      this.checkAuth(userId);
      const docRef = doc(db, this.COLLECTION, userId);
      await updateDoc(docRef, {
        favoriteGames: arrayRemove(gameId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error removing game from favorites:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status for a game
   */
  async toggleFavorite(userId: string, gameId: string, isFavorite: boolean): Promise<void> {
    if (isFavorite) {
      await this.removeFromFavorites(userId, gameId);
    } else {
      await this.addToFavorites(userId, gameId);
    }
  }

  /**
   * Add game to bookmarks
   */
  async addToBookmarks(userId: string, gameId: string): Promise<void> {
    try {
      this.checkAuth(userId);
      const docRef = doc(db, this.COLLECTION, userId);
      await updateDoc(docRef, {
        bookmarkedGames: arrayUnion(gameId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding game to bookmarks:', error);
      throw error;
    }
  }

  /**
   * Remove game from bookmarks
   */
  async removeFromBookmarks(userId: string, gameId: string): Promise<void> {
    try {
      this.checkAuth(userId);
      const docRef = doc(db, this.COLLECTION, userId);
      await updateDoc(docRef, {
        bookmarkedGames: arrayRemove(gameId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error removing game from bookmarks:', error);
      throw error;
    }
  }

  /**
   * Toggle bookmark status for a game
   */
  async toggleBookmark(userId: string, gameId: string, isBookmarked: boolean): Promise<void> {
    if (isBookmarked) {
      await this.removeFromBookmarks(userId, gameId);
    } else {
      await this.addToBookmarks(userId, gameId);
    }
  }

  /**
   * Enable event notifications for a game
   */
  async enableEventNotifications(
    userId: string,
    gameId: string,
    settings?: {
      notifyDaysBefore?: number;
      notifyOnNewEvents?: boolean;
      notifyOnUpdates?: boolean;
    },
  ): Promise<void> {
    try {
      this.checkAuth(userId);
      const preferences = await this.getUserPreferences(userId);
      const currentSettings = preferences.getEventNotificationSettings(gameId);

      const newSettings = {
        enabled: true,
        notifyDaysBefore: settings?.notifyDaysBefore ?? currentSettings.notifyDaysBefore,
        notifyOnNewEvents: settings?.notifyOnNewEvents ?? currentSettings.notifyOnNewEvents,
        notifyOnUpdates: settings?.notifyOnUpdates ?? currentSettings.notifyOnUpdates,
      };

      const docRef = doc(db, this.COLLECTION, userId);
      await updateDoc(docRef, {
        [`eventNotificationPreferences.${gameId}`]: newSettings,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error enabling event notifications:', error);
      throw error;
    }
  }

  /**
   * Disable event notifications for a game
   */
  async disableEventNotifications(userId: string, gameId: string): Promise<void> {
    try {
      this.checkAuth(userId);
      const preferences = await this.getUserPreferences(userId);
      const currentSettings = preferences.getEventNotificationSettings(gameId);

      const newSettings = {
        ...currentSettings,
        enabled: false,
      };

      const docRef = doc(db, this.COLLECTION, userId);
      await updateDoc(docRef, {
        [`eventNotificationPreferences.${gameId}`]: newSettings,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error disabling event notifications:', error);
      throw error;
    }
  }

  /**
   * Toggle event notification status for a game
   */
  async toggleEventNotifications(
    userId: string,
    gameId: string,
    isEnabled: boolean,
    settings?: {
      notifyDaysBefore?: number;
      notifyOnNewEvents?: boolean;
      notifyOnUpdates?: boolean;
    },
  ): Promise<void> {
    if (isEnabled) {
      await this.disableEventNotifications(userId, gameId);
    } else {
      await this.enableEventNotifications(userId, gameId, settings);
    }
  }

  /**
   * Update global notification settings
   */
  async updateGlobalSettings(
    userId: string,
    settings: Partial<{
      emailNotifications: boolean;
      pushNotifications: boolean;
      defaultNotifyDaysBefore: number;
    }>,
  ): Promise<void> {
    try {
      this.checkAuth(userId);
      const docRef = doc(db, this.COLLECTION, userId);
      const updates: Record<string, FieldValue | boolean | number> = {
        updatedAt: serverTimestamp(),
      };

      if (settings.emailNotifications !== undefined) {
        updates['globalNotificationSettings.emailNotifications'] = settings.emailNotifications;
      }
      if (settings.pushNotifications !== undefined) {
        updates['globalNotificationSettings.pushNotifications'] = settings.pushNotifications;
      }
      if (settings.defaultNotifyDaysBefore !== undefined) {
        updates['globalNotificationSettings.defaultNotifyDaysBefore'] =
          settings.defaultNotifyDaysBefore;
      }

      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating global notification settings:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userPreferencesService = new UserPreferencesService();
