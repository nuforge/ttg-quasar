/**
 * TTG Event Sync Service
 *
 * Handles automatic synchronization between TTG events and Google Calendar.
 * This service acts as a bridge between the TTG event system and Google Calendar API.
 */

import type { Event } from 'src/models/Event';
import type { Game } from 'src/models/Game';
import { googleCalendarService, type CalendarEvent } from './google-calendar-service';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';

export interface SyncConfiguration {
  enabled: boolean;
  calendarId: string;
  syncMode: 'manual' | 'auto';
  publicCalendarUrl?: string;
}

export class TTGEventSyncService {
  private static config: SyncConfiguration = {
    enabled: false,
    calendarId: 'primary',
    syncMode: 'manual',
  };

  private static eventIdMapping = new Map<string, string>(); // TTG Event ID -> Google Calendar Event ID

  /**
   * Initialize the sync service with configuration
   */
  static configure(config: SyncConfiguration): void {
    this.config = { ...config };

    if (config.calendarId !== 'primary') {
      googleCalendarService.setCalendarId(config.calendarId);
    }
  }

  /**
   * Get current sync configuration
   */
  static getConfiguration(): SyncConfiguration {
    return { ...this.config };
  }

  /**
   * Get the public calendar subscription URL for users
   */
  static getPublicCalendarUrl(): string | null {
    if (!this.config.enabled || !this.config.publicCalendarUrl) {
      return null;
    }
    return this.config.publicCalendarUrl;
  }

  /**
   * Sync a single TTG event to Google Calendar
   */
  static async syncEventToCalendar(event: Event, game?: Game): Promise<void> {
    if (!this.config.enabled) {
      console.log('Calendar sync disabled, skipping event sync');
      return;
    }

    try {
      const calendarEvent = this.convertTTGEventToCalendarEvent(event, game);
      const existingEventId = this.eventIdMapping.get(event.id.toString());

      if (existingEventId) {
        // Update existing event
        await googleCalendarService.updateEvent(existingEventId, calendarEvent);
        console.log(`Updated calendar event for: ${event.title}`);
      } else {
        // Create new event
        const createdEvent = await googleCalendarService.createEvent(calendarEvent);
        if (createdEvent.id) {
          this.eventIdMapping.set(event.id.toString(), createdEvent.id);
          console.log(`Created calendar event for: ${event.title}`);
        }
      }
    } catch {
      console.error('Error syncing event to calendar');
      // Store the error but don't throw - calendar sync shouldn't break the main app
      this.logSyncError(event.id.toString(), 'Sync failed');
    }
  }

  /**
   * Remove a TTG event from Google Calendar
   */
  static async removeEventFromCalendar(eventId: string | number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const googleEventId = this.eventIdMapping.get(eventId.toString());
      if (googleEventId) {
        await googleCalendarService.deleteEvent(googleEventId);
        this.eventIdMapping.delete(eventId.toString());
        console.log(`Removed calendar event for TTG event: ${eventId}`);
      }
    } catch {
      console.error(`Failed to remove event ${eventId} from calendar`);
    }
  }

  /**
   * Bulk sync all TTG events to Google Calendar
   */
  static async syncAllEvents(): Promise<{
    success: number;
    failed: number;
    skipped: number;
  }> {
    if (!this.config.enabled) {
      return { success: 0, failed: 0, skipped: 1 };
    }

    const eventsStore = useEventsFirebaseStore();
    const gamesStore = useGamesFirebaseStore();

    // The stores should already have data from their reactive listeners
    const events = eventsStore.events;
    const games = gamesStore.games;

    let success = 0;
    let failed = 0;

    console.log(`Starting bulk sync of ${events.length} events to Google Calendar...`);

    for (const event of events) {
      try {
        // Only sync upcoming events to avoid cluttering the calendar
        if (event.status === 'upcoming') {
          const game = games.find((g) => g.legacyId === event.gameId);
          await this.syncEventToCalendar(event, game);
          success++;
        } else {
          // Remove completed/cancelled events from calendar
          await this.removeEventFromCalendar(event.id);
        }

        // Rate limiting - don't overwhelm Google API
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch {
        failed++;
        console.error(`Failed to sync event ${event.title}`);
      }
    }

    console.log(`Bulk sync completed: ${success} success, ${failed} failed`);
    return { success, failed, skipped: 0 };
  }

  /**
   * Auto-sync hook for when events are created/updated
   */
  static async handleEventChange(
    event: Event,
    operation: 'create' | 'update' | 'delete',
    game?: Game,
  ): Promise<void> {
    if (!this.config.enabled || this.config.syncMode !== 'auto') {
      return;
    }

    switch (operation) {
      case 'create':
      case 'update':
        await this.syncEventToCalendar(event, game);
        break;
      case 'delete':
        await this.removeEventFromCalendar(event.id.toString());
        break;
    }
  }

  /**
   * Convert TTG Event to Google Calendar event format
   */
  private static convertTTGEventToCalendarEvent(event: Event, game?: Game): CalendarEvent {
    // Parse event date and time
    const eventDate = event.getDateObject();

    // Calculate end time
    let endDateTime: Date;
    if (event.endTime) {
      const [endHours, endMinutes] = event.endTime.split(':').map(Number);
      endDateTime = new Date(eventDate);
      if (endHours !== undefined && endMinutes !== undefined) {
        endDateTime.setHours(endHours, endMinutes);
      } else {
        endDateTime.setHours(endDateTime.getHours() + 2); // Default 2 hour duration
      }
    } else {
      endDateTime = new Date(eventDate);
      endDateTime.setHours(endDateTime.getHours() + 2); // Default 2 hour duration
    }

    // Build description with TTG-specific information
    let description = event.description || '';

    if (game) {
      description += `\n\n🎮 Game: ${game.title}`;
      if (game.numberOfPlayers) {
        description += `\n👥 Players: ${game.numberOfPlayers}`;
      }
      if (game.playTime) {
        description += `\n⏱️ Duration: ${game.playTime}`;
      }
      if (game.description) {
        description += `\n📝 Game Description: ${game.description}`;
      }
    }

    // Add RSVP information
    const confirmedRSVPs = event.rsvps.filter((r) => r.status === 'confirmed');
    const interestedRSVPs = event.rsvps.filter((r) => r.status === 'interested');

    if (confirmedRSVPs.length > 0 || interestedRSVPs.length > 0) {
      description += `\n\n📋 RSVPs:`;
      if (confirmedRSVPs.length > 0) {
        description += `\n✅ ${confirmedRSVPs.length} confirmed`;
      }
      if (interestedRSVPs.length > 0) {
        description += `\n💭 ${interestedRSVPs.length} interested`;
      }
    }

    // Add event URL
    const appBaseUrl = process.env.VUE_APP_BASE_URL || window.location.origin;
    if (event.firebaseDocId) {
      const slug = event.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const eventUrl = `${appBaseUrl}/events/${event.firebaseDocId}/${slug}`;
      description += `\n\n🔗 View Event: ${eventUrl}`;
    }

    return {
      summary: event.title,
      description,
      location: event.location || '',
      start: {
        dateTime: eventDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };
  }

  /**
   * Load event ID mappings from local storage
   */
  private static loadEventMappings(): void {
    try {
      const stored = localStorage.getItem('ttg-calendar-mappings');
      if (stored) {
        const mappings = JSON.parse(stored);
        this.eventIdMapping = new Map(Object.entries(mappings));
      }
    } catch {
      console.error('Failed to load event mappings');
    }
  }

  /**
   * Save event ID mappings to local storage
   */
  private static saveEventMappings(): void {
    try {
      const mappings = Object.fromEntries(this.eventIdMapping);
      localStorage.setItem('ttg-calendar-mappings', JSON.stringify(mappings));
    } catch {
      console.error('Failed to save event mappings');
    }
  }

  /**
   * Log sync errors for debugging
   */
  private static logSyncError(eventId: string, error: unknown): void {
    const errorLog = {
      eventId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };

    console.error('Calendar sync error:', errorLog);

    // Could store in localStorage or send to analytics service
  }

  /**
   * Initialize the service (call this in app startup)
   */
  static initialize(): void {
    this.loadEventMappings();

    // Auto-save mappings periodically
    setInterval(() => {
      this.saveEventMappings();
    }, 30000); // Every 30 seconds
  }
}

// Initialize on module load
TTGEventSyncService.initialize();

export const ttgEventSyncService = TTGEventSyncService;
