import { vueFireAuthService } from './vuefire-auth-service';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string; // For timed events
    date?: string; // For all-day events
    timeZone?: string;
  };
  end: {
    dateTime?: string; // For timed events
    date?: string; // For all-day events
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export class GoogleCalendarService {
  private readonly CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';

  // Get the calendar ID to use (shared or personal)
  private getCalendarId(): string {
    const sharedCalendarEnabled = process.env.SHARED_CALENDAR_ENABLED === 'true';
    const sharedCalendarId = process.env.SHARED_CALENDAR_ID;

    if (
      sharedCalendarEnabled &&
      sharedCalendarId &&
      sharedCalendarId !== 'your-shared-calendar-id@group.calendar.google.com'
    ) {
      console.log('Using shared calendar:', sharedCalendarId);
      return sharedCalendarId;
    }

    console.log('Using primary (personal) calendar');
    return 'primary';
  }

  // Allow external override of calendar ID
  private currentCalendarId: string | null = null;

  public setCalendarId(calendarId: string) {
    this.currentCalendarId = calendarId;
    console.log('Calendar ID override set to:', calendarId);
  }

  public clearCalendarId() {
    this.currentCalendarId = null;
    console.log('Calendar ID override cleared, using default logic');
  }

  public getCurrentCalendarId(): string {
    return this.currentCalendarId || this.getCalendarId();
  }

  private async getAccessToken(): Promise<string> {
    const user = vueFireAuthService.currentUser.value;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if we have a valid Google OAuth access token
    if (!vueFireAuthService.isGoogleTokenValid()) {
      console.log('Google Calendar token expired, attempting auto-refresh...');
      try {
        const refreshed = await vueFireAuthService.refreshGoogleTokenIfNeeded();
        if (refreshed) {
          console.log('✅ Google Calendar token refreshed successfully');
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (error) {
        console.error('Failed to refresh Google Calendar token:', error);
        throw new Error(
          'Google Calendar access token is expired and could not be refreshed. Please sign in with Google again to refresh your permissions.',
        );
      }
    }

    const accessToken = vueFireAuthService.googleAccessToken.value;
    if (!accessToken) {
      throw new Error('No Google OAuth access token available. Please sign in with Google again.');
    }

    return accessToken;
  }

  async createEvent(eventData: CalendarEvent): Promise<CalendarEvent> {
    try {
      const token = await this.getAccessToken();
      const calendarId = this.getCurrentCalendarId();

      console.log('Creating calendar event with data:', JSON.stringify(eventData, null, 2));
      console.log('Using calendar ID:', calendarId);
      console.log('Using access token (first 20 chars):', token.substring(0, 20) + '...');

      const requestBody = {
        ...eventData,
        reminders: eventData.reminders || {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        `${this.CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      console.log('Calendar API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Calendar API error response:', errorText);

        // Provide specific error messages for common issues
        if (response.status === 403) {
          throw new Error(
            `Access denied to calendar ${calendarId}. Make sure the calendar is shared with write permissions for the authenticated user, or the user has been granted access to manage this calendar.`,
          );
        }
        if (response.status === 404) {
          throw new Error(
            `Calendar ${calendarId} not found. Please check the calendar ID in your .env file.`,
          );
        }

        throw new Error(
          `Calendar API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const result = await response.json();
      console.log('Successfully created calendar event:', result);
      return result;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create calendar event: ${errorMessage}`);
    }
  }

  async updateEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.CALENDAR_API_URL}/calendars/primary/events/${eventId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update calendar event: ${errorMessage}`);
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.CALENDAR_API_URL}/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to delete calendar event: ${errorMessage}`);
    }
  }

  async getEvent(eventId: string): Promise<CalendarEvent> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.CALENDAR_API_URL}/calendars/primary/events/${eventId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get calendar event: ${errorMessage}`);
    }
  }

  async listEvents(
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 250,
  ): Promise<{ items: CalendarEvent[] }> {
    try {
      const token = await this.getAccessToken();
      const calendarId = this.getCurrentCalendarId();

      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);

      console.log('Listing events from calendar:', calendarId);

      const response = await fetch(
        `${this.CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to list calendar events: ${errorMessage}`);
    }
  }

  // List all calendars accessible to the user
  async listCalendars(): Promise<{
    items: Array<{ id: string; summary: string; primary?: boolean; accessRole: string }>;
  }> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.CALENDAR_API_URL}/users/me/calendarList`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Available calendars:', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to list calendars: ${errorMessage}`);
    }
  }

  // Get current calendar configuration
  getCalendarConfig() {
    const calendarId = this.getCurrentCalendarId();
    const isShared = calendarId !== 'primary';

    return {
      calendarId,
      isShared,
      isConfigured: isShared && calendarId !== 'your-shared-calendar-id@group.calendar.google.com',
    };
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
