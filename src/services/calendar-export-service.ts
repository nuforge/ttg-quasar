import type { Event } from 'src/models/Event';
import type { Game } from 'src/models/Game';
import { date } from 'quasar';

export interface CalendarExportOptions {
  format: 'ics' | 'google' | 'outlook' | 'apple';
  timezone?: string;
}

export interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startDateTime: Date;
  endDateTime: Date;
  url?: string | undefined;
}

export class CalendarExportService {
  private formatDateTime(dateTime: Date, isICS = false): string {
    if (isICS) {
      // ICS format: YYYYMMDDTHHMMSSZ - use local time but format as UTC
      return date.formatDate(dateTime, 'YYYYMMDDTHHMMSS') + 'Z';
    }
    // ISO format for URL parameters - use local time without timezone conversion
    return dateTime.toISOString();
  }

  private escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  private prepareEventData(
    event: Event,
    game?: Game | null,
    appBaseUrl?: string,
  ): CalendarEventData {
    // Create start and end datetime objects - parse as local time with validation
    const dateParts = event.date.split('-').map(Number);
    const timeParts = event.time.split(':').map(Number);

    if (dateParts.length !== 3 || timeParts.length !== 2) {
      throw new Error('Invalid date or time format');
    }

    const [year, month, day] = dateParts;
    const [hours, minutes] = timeParts;

    // Type guards for strict TypeScript
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

    // Use endTime if available, otherwise default to 2 hours later
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
    } // Build description
    let description = event.description || '';

    if (game) {
      description += `\\n\\n🎮 Game: ${game.title}`;
      if (game.description) {
        description += `\\n${game.description.substring(0, 200)}${game.description.length > 200 ? '...' : ''}`;
      }
    }

    description += `\\n\\n👥 Players: ${event.minPlayers}-${event.maxPlayers}`;

    if (event.notes) {
      description += `\\n\\n📝 Notes: ${event.notes}`;
    }

    // Add event URL if available
    const eventUrl = appBaseUrl
      ? `${appBaseUrl}/events/${event.firebaseDocId || event.id}/${event.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
      : undefined;
    if (eventUrl) {
      description += `\\n\\n🔗 View Event: ${eventUrl}`;
    }

    return {
      title: event.title,
      description,
      location: event.location,
      startDateTime,
      endDateTime,
      url: eventUrl,
    };
  }

  /**
   * Generate ICS (iCal) file content for download
   */
  generateICS(event: Event, game?: Game | null, appBaseUrl?: string): string {
    const eventData = this.prepareEventData(event, game, appBaseUrl);

    const startTime = this.formatDateTime(eventData.startDateTime, true);
    const endTime = this.formatDateTime(eventData.endDateTime, true);
    const now = this.formatDateTime(new Date(), true);

    // Generate unique UID
    const uid = `event-${event.firebaseDocId || event.id}@ttg-quasar.app`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TTG Quasar//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${this.escapeICSText(eventData.title)}`,
      `DESCRIPTION:${this.escapeICSText(eventData.description)}`,
      `LOCATION:${this.escapeICSText(eventData.location)}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      ...(eventData.url ? [`URL:${eventData.url}`] : []),
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Event reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\\r\\n');

    return icsContent;
  }

  /**
   * Generate Google Calendar URL
   */
  generateGoogleCalendarUrl(event: Event, game?: Game | null, appBaseUrl?: string): string {
    const eventData = this.prepareEventData(event, game, appBaseUrl);

    const startTime = this.formatDateTime(eventData.startDateTime)
      .replace(/[-:]/g, '')
      .replace('.000Z', 'Z');
    const endTime = this.formatDateTime(eventData.endDateTime)
      .replace(/[-:]/g, '')
      .replace('.000Z', 'Z');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: eventData.title,
      dates: `${startTime}/${endTime}`,
      details: eventData.description.replace(/\\\\n/g, '\\n').replace(/\\\\/g, ''),
      location: eventData.location,
      ...(eventData.url && { sprop: eventData.url }),
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generate Outlook Calendar URL
   */
  generateOutlookUrl(event: Event, game?: Game | null, appBaseUrl?: string): string {
    const eventData = this.prepareEventData(event, game, appBaseUrl);

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: eventData.title,
      startdt: eventData.startDateTime.toISOString(),
      enddt: eventData.endDateTime.toISOString(),
      body: eventData.description.replace(/\\\\n/g, '\\n').replace(/\\\\/g, ''),
      location: eventData.location,
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  /**
   * Download ICS file
   */
  downloadICS(event: Event, game?: Game | null, appBaseUrl?: string): void {
    const icsContent = this.generateICS(event, game, appBaseUrl);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }

  /**
   * Open calendar in new window/tab
   */
  openCalendar(
    event: Event,
    format: 'google' | 'outlook',
    game?: Game | null,
    appBaseUrl?: string,
  ): void {
    let url: string;

    switch (format) {
      case 'google':
        url = this.generateGoogleCalendarUrl(event, game, appBaseUrl);
        break;
      case 'outlook':
        url = this.generateOutlookUrl(event, game, appBaseUrl);
        break;
      default:
        throw new Error(`Unsupported calendar format: ${String(format)}`);
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// Export singleton instance
export const calendarExportService = new CalendarExportService();
