import type { Event } from 'src/models/Event';
import type { Game } from 'src/models/Game';

export interface CalendarFeedFilters {
  gameIds?: string[];
  rsvpOnly?: boolean;
  interestedOnly?: boolean;
  upcomingOnly?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CalendarFeedOptions {
  userId: number;
  filters: CalendarFeedFilters;
  title?: string;
  description?: string;
  isPublic?: boolean;
}

export class CalendarFeedService {
  private static formatDateForICS(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private static escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  private static prepareEventForFeed(
    event: Event,
    game?: Game | null,
    appBaseUrl?: string,
  ): string {
    // Parse event date and time
    const dateParts = event.date.split('-').map(Number);
    const timeParts = event.time.split(':').map(Number);

    if (dateParts.length !== 3 || timeParts.length !== 2) {
      throw new Error('Invalid date or time format');
    }

    const [year, month, day] = dateParts;
    const [hours, minutes] = timeParts;

    if (
      year === undefined ||
      month === undefined ||
      day === undefined ||
      hours === undefined ||
      minutes === undefined
    ) {
      throw new Error('Invalid date or time values');
    }

    const startDateTime = new Date(year, month - 1, day, hours, minutes);

    // Calculate end time
    let endDateTime: Date;
    if (event.endTime) {
      const endTimeParts = event.endTime.split(':').map(Number);
      if (endTimeParts.length !== 2) {
        throw new Error('Invalid end time format');
      }
      const [endHours, endMinutes] = endTimeParts;

      if (endHours === undefined || endMinutes === undefined) {
        throw new Error('Invalid end time values');
      }

      endDateTime = new Date(year, month - 1, day, endHours, endMinutes);
    } else {
      endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 2);
    }

    // Build description
    let description = event.description || '';
    if (game) {
      description += `\n\n🎮 Game: ${game.title}`;
      if (game.numberOfPlayers) {
        description += `\n👥 Players: ${game.numberOfPlayers}`;
      }
      if (game.playTime) {
        description += `\n⏱️ Duration: ${game.playTime}`;
      }
    }

    // Add event URL if app base URL is provided
    if (appBaseUrl && event.firebaseDocId) {
      const slug = event.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const eventUrl = `${appBaseUrl}/events/${event.firebaseDocId}/${slug}`;
      description += `\n\n🔗 Event Details: ${eventUrl}`;
    }

    // Generate unique event ID for calendar systems
    const eventId = `ttg-event-${event.firebaseDocId || event.id}@ttg-app.com`;

    return [
      'BEGIN:VEVENT',
      `UID:${eventId}`,
      `DTSTART:${this.formatDateForICS(startDateTime)}`,
      `DTEND:${this.formatDateForICS(endDateTime)}`,
      `SUMMARY:${this.escapeICSText(event.title)}`,
      `DESCRIPTION:${this.escapeICSText(description)}`,
      `LOCATION:${this.escapeICSText(event.location || '')}`,
      `STATUS:${event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      `SEQUENCE:0`,
      `DTSTAMP:${this.formatDateForICS(new Date())}`,
      'END:VEVENT',
    ].join('\r\n');
  }

  /**
   * Generate ICS calendar feed content for filtered events
   */
  static generateCalendarFeed(
    events: Event[],
    games: Game[],
    options: CalendarFeedOptions,
    appBaseUrl?: string,
  ): string {
    console.log('generateCalendarFeed called with:', {
      totalEvents: events.length,
      totalGames: games.length,
      options,
      appBaseUrl,
      eventTitles: events.map((e) => e.title),
    });

    const filteredEvents = this.filterEvents(events, options.filters, options.userId);

    console.log('Events after filtering in generateCalendarFeed:', filteredEvents.length);

    const calendarTitle = options.title || 'TTG Events';
    const calendarDescription = options.description || 'Tabletop Gaming Events';

    const header = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TTG Quasar App//Calendar Feed//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${this.escapeICSText(calendarTitle)}`,
      `X-WR-CALDESC:${this.escapeICSText(calendarDescription)}`,
      'X-WR-TIMEZONE:UTC',
    ].join('\r\n');

    const footer = 'END:VCALENDAR';

    const eventEntries = filteredEvents.map((event) => {
      const game = games.find((g) => g.id === event.gameId) || null;
      return this.prepareEventForFeed(event, game, appBaseUrl);
    });

    return [header, ...eventEntries, footer].join('\r\n');
  }

  /**
   * Filter events based on user preferences and filters
   */
  private static filterEvents(
    events: Event[],
    filters: CalendarFeedFilters,
    userId: number,
  ): Event[] {
    console.log('Filtering events:', {
      totalEvents: events.length,
      filters,
      userId,
      eventTitles: events.map((e) => e.title),
    });

    const filteredEvents = events.filter((event) => {
      // Filter by date range if specified
      if (filters.dateRange) {
        const eventDate = event.getDateObject();
        if (eventDate < filters.dateRange.start || eventDate > filters.dateRange.end) {
          console.log(`Event ${event.title} filtered out by date range`);
          return false;
        }
      }

      // Filter by upcoming only
      if (filters.upcomingOnly && event.status !== 'upcoming') {
        console.log(`Event ${event.title} filtered out - status: ${event.status}`);
        return false;
      }

      // Filter by game IDs if specified
      if (filters.gameIds && filters.gameIds.length > 0) {
        if (!event.gameId || !filters.gameIds.includes(event.gameId)) {
          console.log(
            `Event ${event.title} filtered out - gameId: ${event.gameId}, allowed: ${filters.gameIds.join(', ')}`,
          );
          return false;
        }
      }

      // Filter by RSVP/Interest status if requested
      // Note: Handle RSVP and Interest as OR condition, not AND
      if (filters.rsvpOnly || filters.interestedOnly) {
        const userRSVP = event.rsvps.find((rsvp) => rsvp.playerId === userId);

        console.log(`Event ${event.title} - User RSVP:`, userRSVP);

        // If both filters are enabled, include events where user is either confirmed OR interested
        if (filters.rsvpOnly && filters.interestedOnly) {
          if (!userRSVP || (userRSVP.status !== 'confirmed' && userRSVP.status !== 'interested')) {
            console.log(
              `Event ${event.title} filtered out - no matching RSVP (needed confirmed OR interested)`,
            );
            return false;
          }
        }
        // If only RSVP filter is enabled
        else if (filters.rsvpOnly) {
          if (!userRSVP || userRSVP.status !== 'confirmed') {
            console.log(`Event ${event.title} filtered out - no confirmed RSVP`);
            return false;
          }
        }
        // If only interested filter is enabled
        else if (filters.interestedOnly) {
          if (!userRSVP || userRSVP.status !== 'interested') {
            console.log(`Event ${event.title} filtered out - no interested RSVP`);
            return false;
          }
        }
      }

      console.log(`Event ${event.title} passed all filters`);
      return true;
    });

    console.log(`Filtered ${events.length} events down to ${filteredEvents.length}`);
    return filteredEvents;
  }

  /**
   * Generate a unique calendar feed URL for a user
   */
  static generateFeedUrl(
    baseUrl: string,
    userId: number,
    feedId: string,
    isPublic: boolean = false,
  ): string {
    const visibility = isPublic ? 'public' : 'private';
    return `${baseUrl}/api/calendar/${visibility}/${userId}/${feedId}.ics`;
  }

  /**
   * Create calendar feed download
   */
  static downloadCalendarFeed(content: string, filename: string = 'ttg-events.ics'): void {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}

export const calendarFeedService = new CalendarFeedService();
