import type { Event } from 'src/models/Event';
import { vueFireAuthService } from './vuefire-auth-service';

// Google Calendar API configuration
const CALENDAR_API_BASE_URL = 'https://www.googleapis.com/calendar/v3';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: { email: string }[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
}

export class GoogleCalendarService {
  private calendarId: string;
  private isDevelopmentMode: boolean;

  constructor() {
    // Use shared calendar ID from environment, fallback to primary
    this.calendarId = process.env.SHARED_CALENDAR_ID || 'primary';

    // Check if we're in development mode with Firebase emulator
    this.isDevelopmentMode =
      process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATOR === 'true';

    console.log(`📅 Google Calendar Service initialized with calendar: ${this.calendarId}`);

    if (this.isDevelopmentMode) {
      console.log('🔧 Development mode: Using mock Calendar API responses');
    }
  }

  /**
   * Set which calendar to use for operations
   */
  public setCalendarId(calendarId: string): void {
    this.calendarId = calendarId;
    console.log(`📅 Calendar ID set to: ${calendarId}`);
  }

  /**
   * Get current calendar ID
   */
  public getCurrentCalendarId(): string {
    return this.calendarId;
  }

  /**
   * Check if Google Calendar API is properly configured
   */
  public checkConfiguration(): {
    isConfigured: boolean;
    missingVars: string[];
    message: string;
  } {
    const missingVars: string[] = [];

    if (!this.calendarId) {
      missingVars.push('SHARED_CALENDAR_ID');
    }

    const isConfigured = missingVars.length === 0;

    return {
      isConfigured,
      missingVars,
      message: isConfigured
        ? 'Google Calendar API is properly configured'
        : `Missing required environment variables: ${missingVars.join(', ')}`,
    };
  }

  /**
   * Get OAuth token from existing Firebase Google authentication
   */
  private async getAccessToken(): Promise<string> {
    console.log('🔑 Getting Google access token from Firebase Auth...');

    // In development with emulator, we still need REAL Google tokens for Calendar API
    // So bypass the emulator token checks and use real Google auth

    // Check if we have a valid token from Firebase Auth
    if (vueFireAuthService.isGoogleTokenValid() && vueFireAuthService.googleAccessToken.value) {
      console.log('✅ Using existing Firebase Google token');
      return vueFireAuthService.googleAccessToken.value;
    }

    // Try to refresh the token
    const refreshed = await vueFireAuthService.refreshGoogleTokenIfNeeded();
    if (refreshed && vueFireAuthService.googleAccessToken.value) {
      console.log('✅ Refreshed Firebase Google token');
      return vueFireAuthService.googleAccessToken.value;
    }

    // If we get here, we need to force a real Google OAuth flow
    console.log('🔄 No valid token found, requesting real Google OAuth...');

    // Force a real Google sign-in to get actual OAuth tokens
    await this.requestCalendarPermissions();

    if (vueFireAuthService.googleAccessToken.value) {
      console.log('✅ Got real Google OAuth token');
      return vueFireAuthService.googleAccessToken.value;
    }

    throw new Error('GOOGLE_AUTH_REQUIRED');
  }

  /**
   * Request Google Calendar permissions by getting real OAuth tokens
   */
  public async requestCalendarPermissions(): Promise<boolean> {
    try {
      console.log('🔐 Requesting Google Calendar permissions...');

      // Get real Google OAuth token (bypasses emulator)
      const token = await vueFireAuthService.getRealGoogleOAuthToken();

      if (token) {
        console.log('✅ Calendar permissions granted');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to request Calendar permissions:', error);
      throw error;
    }
  } /**
   * List user's calendars using OAuth token
   */
  public async listCalendars(): Promise<Calendar[]> {
    try {
      console.log('📋 Fetching calendar list...');
      const token = await this.getAccessToken();

      const url = `${CALENDAR_API_BASE_URL}/users/me/calendarList`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Calendar list error:', errorText);

        if (response.status === 401) {
          throw new Error('GOOGLE_AUTH_REQUIRED');
        }
        throw new Error(`Failed to list calendars: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Calendars fetched successfully:', data.items?.length || 0);

      return data.items || [];
    } catch (error) {
      console.error('Failed to list calendars:', error);
      throw error;
    }
  } /**
   * Create a new event in the specified calendar using OAuth
   */
  public async createEvent(eventData: CalendarEvent): Promise<CalendarEvent> {
    try {
      console.log('📅 Creating calendar event:', eventData.summary);
      const token = await this.getAccessToken();

      const url = `${CALENDAR_API_BASE_URL}/calendars/${this.calendarId}/events`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create event error:', errorText);

        if (response.status === 401) {
          throw new Error('GOOGLE_AUTH_REQUIRED');
        }
        throw new Error(`Failed to create event: ${response.statusText}`);
      }

      const createdEvent = await response.json();
      console.log('✅ Event created successfully:', createdEvent.id);
      return createdEvent;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  /**
   * Update an existing event in the calendar
   */
  public async updateEvent(
    eventId: string,
    eventData: Partial<CalendarEvent>,
  ): Promise<CalendarEvent> {
    try {
      console.log('📝 Updating calendar event:', eventId);
      const token = await this.getAccessToken();

      const url = `${CALENDAR_API_BASE_URL}/calendars/${this.calendarId}/events/${eventId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update event error:', errorText);

        if (response.status === 401) {
          throw new Error('GOOGLE_AUTH_REQUIRED');
        }
        throw new Error(`Failed to update event: ${response.statusText}`);
      }

      const updatedEvent = await response.json();
      console.log('✅ Event updated successfully:', updatedEvent.id);
      return updatedEvent;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  /**
   * Delete an event from the calendar
   */
  public async deleteEvent(eventId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting calendar event:', eventId);
      const token = await this.getAccessToken();

      const url = `${CALENDAR_API_BASE_URL}/calendars/${this.calendarId}/events/${eventId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete event error:', errorText);

        if (response.status === 401) {
          throw new Error('GOOGLE_AUTH_REQUIRED');
        }
        throw new Error(`Failed to delete event: ${response.statusText}`);
      }

      console.log('✅ Event deleted successfully');
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  /**
   * List events from the calendar
   */
  public async listEvents(
    calendarId?: string,
    timeMin?: string,
    timeMax?: string,
    maxResults = 10,
  ): Promise<CalendarEvent[]> {
    try {
      console.log('📋 Listing calendar events...');
      const token = await this.getAccessToken();

      const targetCalendarId = calendarId || this.calendarId;
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);

      const url = `${CALENDAR_API_BASE_URL}/calendars/${targetCalendarId}/events?${params}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('List events error:', errorText);

        if (response.status === 401) {
          throw new Error('GOOGLE_AUTH_REQUIRED');
        }
        throw new Error(`Failed to list events: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Events listed successfully:', data.items?.length || 0);
      return data.items || [];
    } catch (error) {
      console.error('Failed to list events:', error);
      throw error;
    }
  }

  /**
   * Convert TTG Event to Google Calendar Event
   */
  public convertTTGEventToCalendarEvent(ttgEvent: Event): CalendarEvent {
    const eventDate = ttgEvent.getDateObject();

    // Parse time safely
    const timeParts = ttgEvent.time?.split(':') || ['18', '00'];
    const hours = parseInt(timeParts[0] || '18');
    const minutes = parseInt(timeParts[1] || '00');
    eventDate.setHours(hours, minutes);

    const startDateTime = eventDate.toISOString();

    // Calculate end time
    const endDate = new Date(eventDate);
    if (ttgEvent.endTime) {
      const endTimeParts = ttgEvent.endTime.split(':');
      const endHours = parseInt(endTimeParts[0] || '21');
      const endMinutes = parseInt(endTimeParts[1] || '00');
      endDate.setHours(endHours, endMinutes);
    } else {
      endDate.setHours(endDate.getHours() + 3); // Default 3-hour duration
    }

    return {
      summary: ttgEvent.title,
      description: `${ttgEvent.description}\n\nPlayers: ${ttgEvent.getConfirmedCount()}/${ttgEvent.maxPlayers}`,
      location: ttgEvent.location,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/New_York',
      },
    };
  }

  /**
   * Sync a TTG event to Google Calendar
   */
  public async syncTTGEvent(ttgEvent: Event): Promise<CalendarEvent> {
    const calendarEvent = this.convertTTGEventToCalendarEvent(ttgEvent);
    return await this.createEvent(calendarEvent);
  }

  /**
   * Test the connection by trying a simple API call
   */
  public async testConnection(): Promise<{
    success: boolean;
    calendars?: Calendar[];
    error?: string;
  }> {
    try {
      console.log('🧪 Testing Google Calendar connection...');

      // Check if we have required configuration
      if (!this.calendarId) {
        return { success: false, error: 'Calendar ID not configured' };
      }

      // Try to list calendars to test the connection
      const calendars = await this.listCalendars();
      return { success: true, calendars };
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
