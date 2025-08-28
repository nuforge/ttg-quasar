import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from 'src/boot/firebase';
import { Event } from 'src/models/Event';
import { googleCalendarService, type CalendarEvent } from 'src/services/google-calendar-service';
import eventsData from 'src/assets/data/events.json';

export interface EventMigrationResult {
  total: number;
  successful: number;
  skipped: number;
  calendarSynced: number;
  errors: string[];
  warnings: string[];
}

export interface EventMigrationOptions {
  syncToGoogleCalendar: boolean;
  skipExisting: boolean;
  dryRun: boolean;
  appBaseUrl: string; // For creating deep links in calendar events
}

export class EventMigrationService {
  private readonly defaultAppBaseUrl = 'https://your-app-domain.com'; // Update this

  /**
   * Migrate events from JSON to Firebase with optional Google Calendar sync
   */
  async migrateEvents(options: Partial<EventMigrationOptions> = {}): Promise<EventMigrationResult> {
    const opts: EventMigrationOptions = {
      syncToGoogleCalendar: true,
      skipExisting: true,
      dryRun: false,
      appBaseUrl: this.defaultAppBaseUrl,
      ...options,
    };

    const results: EventMigrationResult = {
      total: 0,
      successful: 0,
      skipped: 0,
      calendarSynced: 0,
      errors: [],
      warnings: [],
    };

    try {
      const events = Event.fromJSON(eventsData as Partial<Event>[]);
      results.total = events.length;

      console.log(`Starting migration of ${results.total} events...`);
      if (opts.dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be made');
      }

      for (const event of events) {
        try {
          await this.migrateEvent(event, opts, results);
        } catch (error) {
          const errorMessage = `Failed to migrate event ${event.id} (${event.title}): ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          results.errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      console.log('\n📊 Migration Summary:');
      console.log(`Total events: ${results.total}`);
      console.log(`✅ Successfully migrated: ${results.successful}`);
      console.log(`⏭️ Skipped (already exist): ${results.skipped}`);
      console.log(`📅 Synced to Google Calendar: ${results.calendarSynced}`);
      console.log(`❌ Errors: ${results.errors.length}`);
      console.log(`⚠️ Warnings: ${results.warnings.length}`);

      if (results.errors.length > 0) {
        console.log('\n❌ Errors:');
        results.errors.forEach((error) => console.log(`  - ${error}`));
      }

      if (results.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        results.warnings.forEach((warning) => console.log(`  - ${warning}`));
      }
    } catch (error) {
      const errorMessage = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.errors.push(errorMessage);
      console.error(errorMessage);
    }

    return results;
  }

  /**
   * Migrate a single event
   */
  private async migrateEvent(
    event: Event,
    options: EventMigrationOptions,
    results: EventMigrationResult,
  ): Promise<void> {
    // Check if event already exists
    if (options.skipExisting) {
      const existingQuery = query(
        collection(db, 'events'),
        where('title', '==', event.title),
        where('date', '==', event.date),
        where('time', '==', event.time),
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        console.log(`📋 Event "${event.title}" on ${event.date} already exists, skipping`);
        results.skipped++;
        return;
      }
    }

    // Prepare Firebase event data
    const firebaseEventData = this.prepareFirebaseEventData(event);

    if (options.dryRun) {
      console.log(`🔍 [DRY RUN] Would migrate event: ${event.title} on ${event.date}`);
      results.successful++;
      return;
    }

    // Create event in Firestore
    const eventId = `legacy_${event.id}_${Date.now()}`;
    await setDoc(doc(db, 'events', eventId), firebaseEventData);

    console.log(`✅ Migrated event: ${event.title} on ${event.date} (ID: ${eventId})`);
    results.successful++;

    // Sync to Google Calendar if requested
    if (options.syncToGoogleCalendar) {
      try {
        const calendarEventId = await this.syncToGoogleCalendar(event, eventId, options.appBaseUrl);

        if (calendarEventId) {
          // Update Firestore with calendar event ID
          await setDoc(doc(db, 'events', eventId), {
            ...firebaseEventData,
            googleCalendarEventId: calendarEventId,
          });

          console.log(`📅 Synced to Google Calendar: ${event.title}`);
          results.calendarSynced++;
        }
      } catch (calendarError) {
        const warning = `Failed to sync event "${event.title}" to Google Calendar: ${
          calendarError instanceof Error ? calendarError.message : 'Unknown error'
        }`;
        results.warnings.push(warning);
        console.warn(`⚠️ ${warning}`);
      }
    }
  }

  /**
   * Prepare event data for Firebase storage
   */
  private prepareFirebaseEventData(event: Event) {
    // Get current user info for metadata
    const auth = getAuth();
    const currentUser = auth.currentUser;

    return {
      // Legacy compatibility
      legacyId: event.id,
      migratedFrom: 'json',

      // Core event data
      gameId: event.gameId || null,
      title: event.title || '',
      date: event.date || '',
      time: event.time || '',
      endTime: event.endTime || null,
      location: event.location || '',
      status: event.status || 'scheduled',
      minPlayers: event.minPlayers || 1,
      maxPlayers: event.maxPlayers || 8,
      currentPlayers: event.currentPlayers || 0,
      description: event.description || '',
      notes: event.notes || '',

      // Host information (sanitized)
      host: {
        name: event.host?.name || 'Legacy Host',
        email: event.host?.email || '',
        phone: event.host?.phone || '',
        playerId: event.host?.playerId || null,
      },

      // RSVP information (sanitized)
      rsvps: (event.rsvps || []).map((rsvp) => ({
        playerId: rsvp.playerId || null,
        status: rsvp.status || 'confirmed',
        participants: rsvp.participants || 1,
      })),

      // Firebase metadata
      createdBy: currentUser?.uid || 'migration_system',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      googleCalendarEventId: null,
    };
  }

  /**
   * Sync event to Google Calendar
   */
  private async syncToGoogleCalendar(
    event: Event,
    eventId: string,
    appBaseUrl: string,
  ): Promise<string | null> {
    try {
      const startDateTime = this.createDateTime(event.date, event.time);
      const endDateTime = this.createDateTime(event.date, event.endTime);

      // Create deep link to event page
      const eventUrl = `${appBaseUrl}/events/${eventId}`;

      // Create rich description with event details
      const description = this.createCalendarDescription(event, eventUrl);

      const calendarEvent: CalendarEvent = {
        summary: event.title,
        description,
        location: event.location,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/New_York', // Update this to your timezone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/New_York', // Update this to your timezone
        },
        // Add attendees from RSVPs if they have email addresses
        attendees: this.extractAttendees(event),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      };

      const createdEvent = await googleCalendarService.createEvent(calendarEvent);
      return createdEvent.id || null;
    } catch (error) {
      console.error('Google Calendar sync error:', error);
      throw error;
    }
  }

  /**
   * Create DateTime object from date and time strings
   */
  private createDateTime(dateStr: string, timeStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    // Validate that all components are numbers
    if (!year || !month || !day || hours === undefined || minutes === undefined) {
      throw new Error(`Invalid date/time format: ${dateStr} ${timeStr}`);
    }

    return new Date(year, month - 1, day, hours, minutes);
  }

  /**
   * Create rich calendar description with event details and deep link
   */
  private createCalendarDescription(event: Event, eventUrl: string): string {
    let description = `🎮 ${event.title}\n\n`;

    if (event.description) {
      description += `📝 ${event.description}\n\n`;
    }

    description += `📍 Location: ${event.location}\n`;
    description += `👥 Players: ${event.currentPlayers}/${event.maxPlayers} (${event.minPlayers} minimum)\n`;
    description += `🎯 Host: ${event.host.name} (${event.host.email})\n\n`;

    if (event.notes) {
      description += `📋 Notes: ${event.notes}\n\n`;
    }

    // Add RSVP information
    const confirmedRSVPs = event.rsvps.filter((rsvp) => rsvp.status === 'confirmed');
    if (confirmedRSVPs.length > 0) {
      description += `✅ Confirmed Players: ${confirmedRSVPs.length}\n`;
    }

    const waitingRSVPs = event.rsvps.filter((rsvp) => rsvp.status === 'waiting');
    if (waitingRSVPs.length > 0) {
      description += `⏳ Waiting List: ${waitingRSVPs.length}\n`;
    }

    description += `\n🔗 View Event Details: ${eventUrl}\n`;
    description += `📱 Manage your RSVP in the TTG app`;

    return description;
  }

  /**
   * Extract attendees from RSVPs for Google Calendar invites
   */
  private extractAttendees(event: Event): Array<{ email: string; displayName?: string }> {
    const attendees: Array<{ email: string; displayName?: string }> = [];

    // Add host
    if (event.host.email) {
      attendees.push({
        email: event.host.email,
        displayName: event.host.name,
      });
    }

    // TODO: Add RSVP'd players' email addresses
    // This would require matching RSVPs with player data
    // For now, we'll just include the host

    return attendees;
  }

  /**
   * Get upcoming events that need calendar sync
   */
  async getEventsNeedingCalendarSync(): Promise<Event[]> {
    try {
      const upcomingQuery = query(
        collection(db, 'events'),
        where('status', '==', 'upcoming'),
        where('googleCalendarEventId', '==', null),
      );

      const snapshot = await getDocs(upcomingQuery);
      const events: Event[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const event = new Event({
          ...data,
          id: parseInt(data.legacyId) || 0, // Use legacy ID or fallback to 0
        });
        events.push(event);
      });

      return events;
    } catch (error) {
      console.error('Error fetching events needing calendar sync:', error);
      throw error;
    }
  }

  /**
   * Sync existing Firebase events to Google Calendar
   */
  async syncExistingEventsToCalendar(
    appBaseUrl: string = this.defaultAppBaseUrl,
  ): Promise<EventMigrationResult> {
    const results: EventMigrationResult = {
      total: 0,
      successful: 0,
      skipped: 0,
      calendarSynced: 0,
      errors: [],
      warnings: [],
    };

    try {
      const events = await this.getEventsNeedingCalendarSync();
      results.total = events.length;

      console.log(`🔄 Syncing ${results.total} existing events to Google Calendar...`);

      for (const event of events) {
        try {
          const calendarEventId = await this.syncToGoogleCalendar(
            event,
            event.id.toString(),
            appBaseUrl,
          );

          if (calendarEventId) {
            // Update Firebase with calendar ID
            await setDoc(
              doc(db, 'events', event.id.toString()),
              {
                googleCalendarEventId: calendarEventId,
              },
              { merge: true },
            );

            console.log(`📅 Synced existing event: ${event.title}`);
            results.calendarSynced++;
            results.successful++;
          }
        } catch (error) {
          const errorMessage = `Failed to sync event ${event.title}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          results.errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      console.log(`\n📊 Calendar Sync Summary:`);
      console.log(`Total events processed: ${results.total}`);
      console.log(`✅ Successfully synced: ${results.calendarSynced}`);
      console.log(`❌ Errors: ${results.errors.length}`);
    } catch (error) {
      const errorMessage = `Calendar sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.errors.push(errorMessage);
      console.error(errorMessage);
    }

    return results;
  }

  /**
   * Check migration status
   */
  async checkMigrationStatus(): Promise<{
    isComplete: boolean;
    migratedCount: number;
    totalCount: number;
    calendarSyncedCount: number;
  }> {
    try {
      const totalCount = eventsData.length;
      const migratedSnapshot = await getDocs(collection(db, 'events'));
      const migratedCount = migratedSnapshot.size;

      // Count events with calendar sync
      const calendarSyncQuery = query(
        collection(db, 'events'),
        where('googleCalendarEventId', '!=', null),
      );
      const calendarSyncSnapshot = await getDocs(calendarSyncQuery);
      const calendarSyncedCount = calendarSyncSnapshot.size;

      return {
        isComplete: migratedCount >= totalCount,
        migratedCount,
        totalCount,
        calendarSyncedCount,
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        isComplete: false,
        migratedCount: 0,
        totalCount: eventsData.length,
        calendarSyncedCount: 0,
      };
    }
  }
}

// Export singleton instance
export const eventMigrationService = new EventMigrationService();
