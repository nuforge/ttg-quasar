import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from 'src/boot/firebase';
import { userPreferencesService } from './user-preferences-service';
import type { Game } from 'src/models/Game';
import type { Event } from 'src/models/Event';

export interface GameEventNotification {
  id?: string;
  userId: string;
  gameId: string;
  eventId: string;
  gameTitle: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  notificationType: 'new_event' | 'event_update' | 'event_reminder';
  message: string;
  read: boolean;
  sentAt?: Timestamp;
  scheduledFor?: Timestamp; // For future notifications (reminders)
  createdAt?: Timestamp;
}

export class GameEventNotificationService {
  private readonly COLLECTION = 'gameEventNotifications';

  /**
   * Send notification to users who have enabled notifications for a specific game
   */
  async notifyUsersAboutGameEvent(
    game: Game,
    event: Event,
    notificationType: 'new_event' | 'event_update',
  ): Promise<void> {
    try {
      // Get all users who have notifications enabled for this game
      const usersToNotify = await this.getUsersWithNotifications(game.id);

      const notifications: Omit<GameEventNotification, 'id'>[] = usersToNotify.map((userId) => ({
        userId,
        gameId: game.id,
        eventId: event.id.toString(),
        gameTitle: game.title,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        location: event.location,
        notificationType,
        message: this.generateNotificationMessage(game, event, notificationType),
        read: false,
        sentAt: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp,
      }));

      // Batch create notifications
      const promises = notifications.map((notification) =>
        addDoc(collection(db, this.COLLECTION), notification),
      );

      await Promise.all(promises);

      // Schedule reminder notifications for users who want them
      if (notificationType === 'new_event') {
        await this.scheduleEventReminders(game, event, usersToNotify);
      }
    } catch (error) {
      console.error('Error sending game event notifications:', error);
    }
  }

  /**
   * Schedule reminder notifications based on user preferences
   */
  private async scheduleEventReminders(game: Game, event: Event, userIds: string[]): Promise<void> {
    try {
      const eventDate = new Date(`${event.date} ${event.time}`);

      for (const userId of userIds) {
        const preferences = await userPreferencesService.getUserPreferences(userId);
        const settings = preferences.getEventNotificationSettings(game.id);

        if (settings.enabled && settings.notifyDaysBefore > 0) {
          const reminderDate = new Date(eventDate);
          reminderDate.setDate(reminderDate.getDate() - settings.notifyDaysBefore);

          // Only schedule if reminder date is in the future
          if (reminderDate > new Date()) {
            const reminderNotification: Omit<GameEventNotification, 'id'> = {
              userId,
              gameId: game.id,
              eventId: event.id.toString(),
              gameTitle: game.title,
              eventTitle: event.title,
              eventDate: event.date,
              eventTime: event.time,
              location: event.location,
              notificationType: 'event_reminder',
              message: this.generateReminderMessage(game, event, settings.notifyDaysBefore),
              read: false,
              scheduledFor: Timestamp.fromDate(reminderDate),
              createdAt: serverTimestamp() as Timestamp,
            };

            await addDoc(collection(db, this.COLLECTION), reminderNotification);
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling event reminders:', error);
    }
  }

  /**
   * Get all user IDs who have notifications enabled for a specific game
   */
  private async getUsersWithNotifications(gameId: string): Promise<string[]> {
    try {
      const preferencesQuery = query(
        collection(db, 'userPreferences'),
        where(`eventNotificationPreferences.${gameId}.enabled`, '==', true),
      );

      const snapshot = await getDocs(preferencesQuery);
      return snapshot.docs.map((doc) => doc.id);
    } catch (error) {
      console.error('Error getting users with notifications:', error);
      return [];
    }
  }

  /**
   * Get notifications for a specific user
   */
  async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      gameId?: string;
      limit?: number;
    },
  ): Promise<GameEventNotification[]> {
    try {
      // Check if user is authenticated and authorized
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        console.warn('User not authenticated or not authorized for notifications');
        return [];
      }

      let notificationsQuery = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
      );

      if (options?.unreadOnly) {
        notificationsQuery = query(notificationsQuery, where('read', '==', false));
      }

      if (options?.gameId) {
        notificationsQuery = query(notificationsQuery, where('gameId', '==', options.gameId));
      }

      notificationsQuery = query(notificationsQuery, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GameEventNotification[];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, notificationId);
      await updateDoc(docRef, {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const unreadQuery = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false),
      );

      const snapshot = await getDocs(unreadQuery);
      const promises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, {
          read: true,
          updatedAt: serverTimestamp(),
        }),
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Generate notification message based on type
   */
  private generateNotificationMessage(
    game: Game,
    event: Event,
    type: 'new_event' | 'event_update',
  ): string {
    switch (type) {
      case 'new_event':
        return `New event for ${game.title}: "${event.title}" on ${event.date} at ${event.time} in ${event.location}`;
      case 'event_update':
        return `Event updated for ${game.title}: "${event.title}" on ${event.date} at ${event.time} in ${event.location}`;
      default:
        return `Event notification for ${game.title}`;
    }
  }

  /**
   * Generate reminder message
   */
  private generateReminderMessage(game: Game, event: Event, daysBefore: number): string {
    const dayText = daysBefore === 1 ? 'day' : 'days';
    return `Reminder: ${game.title} event "${event.title}" is in ${daysBefore} ${dayText} (${event.date} at ${event.time} in ${event.location})`;
  }
}

// Export singleton instance
export const gameEventNotificationService = new GameEventNotificationService();
