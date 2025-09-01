import type { Timestamp } from 'firebase/firestore';

export interface FirebaseUserPreferences {
  userId: string; // Firebase user ID
  favoriteGames: string[]; // Array of game document IDs
  bookmarkedGames: string[]; // Array of game document IDs
  preferredLanguage?: string; // User's preferred language (e.g., 'en-US', 'en-ES') - optional in Firebase
  eventNotificationPreferences: {
    [gameId: string]: {
      enabled: boolean;
      notifyDaysBefore: number; // How many days before event to notify
      notifyOnNewEvents: boolean; // Notify when new events are created for this game
      notifyOnUpdates: boolean; // Notify when existing events are updated
    };
  };
  globalNotificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    defaultNotifyDaysBefore: number;
  };
  // Firebase-specific fields
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export class UserPreferences {
  userId: string;
  favoriteGames: string[];
  bookmarkedGames: string[];
  preferredLanguage: string | undefined;
  eventNotificationPreferences: {
    [gameId: string]: {
      enabled: boolean;
      notifyDaysBefore: number;
      notifyOnNewEvents: boolean;
      notifyOnUpdates: boolean;
    };
  };
  globalNotificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    defaultNotifyDaysBefore: number;
  };
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;

  constructor(userId: string, data?: Partial<FirebaseUserPreferences>) {
    this.userId = userId;
    this.favoriteGames = data?.favoriteGames || [];
    this.bookmarkedGames = data?.bookmarkedGames || [];
    // Default to browser language or en-US if no preference is set
    this.preferredLanguage = data?.preferredLanguage || undefined;
    this.eventNotificationPreferences = data?.eventNotificationPreferences || {};
    this.globalNotificationSettings = data?.globalNotificationSettings || {
      emailNotifications: true,
      pushNotifications: true,
      defaultNotifyDaysBefore: 3,
    };
    this.createdAt = data?.createdAt ? data.createdAt.toDate() : undefined;
    this.updatedAt = data?.updatedAt ? data.updatedAt.toDate() : undefined;
  }

  // Helper methods
  isFavorite(gameId: string): boolean {
    return this.favoriteGames.includes(gameId);
  }

  isBookmarked(gameId: string): boolean {
    return this.bookmarkedGames.includes(gameId);
  }

  hasEventNotifications(gameId: string): boolean {
    return this.eventNotificationPreferences[gameId]?.enabled || false;
  }

  getEventNotificationSettings(gameId: string) {
    return (
      this.eventNotificationPreferences[gameId] || {
        enabled: false,
        notifyDaysBefore: this.globalNotificationSettings.defaultNotifyDaysBefore,
        notifyOnNewEvents: true,
        notifyOnUpdates: true,
      }
    );
  }

  // Convert to Firebase format
  toFirebase(): FirebaseUserPreferences {
    const data: FirebaseUserPreferences = {
      userId: this.userId,
      favoriteGames: this.favoriteGames,
      bookmarkedGames: this.bookmarkedGames,
      eventNotificationPreferences: this.eventNotificationPreferences,
      globalNotificationSettings: this.globalNotificationSettings,
      // Timestamps will be handled by Firebase
    };

    // Only include preferredLanguage if it's not undefined (Firebase doesn't support undefined values)
    if (this.preferredLanguage !== undefined) {
      data.preferredLanguage = this.preferredLanguage;
    }

    return data;
  }

  // Create from Firebase data
  static fromFirebase(data: FirebaseUserPreferences): UserPreferences {
    return new UserPreferences(data.userId, data);
  }
}
