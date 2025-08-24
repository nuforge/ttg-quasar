import { authService } from './auth-service';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
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

  private async getAccessToken(): Promise<string> {
    const user = authService.currentUser.value;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get fresh access token
    const token = await user.getIdToken(true);
    return token;
  }

  async createEvent(eventData: CalendarEvent): Promise<CalendarEvent> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.CALENDAR_API_URL}/calendars/primary/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          reminders: eventData.reminders || {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 1 day before
              { method: 'popup', minutes: 60 }, // 1 hour before
            ],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
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

      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);

      const response = await fetch(`${this.CALENDAR_API_URL}/calendars/primary/events?${params}`, {
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
      throw new Error(`Failed to list calendar events: ${errorMessage}`);
    }
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
