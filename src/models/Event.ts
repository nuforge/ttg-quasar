export interface RSVP {
  playerId: number;
  status: 'confirmed' | 'waiting' | 'cancelled';
  participants?: number;
}

export interface Host {
  name: string;
  email: string;
  phone: string;
  playerId?: number; // Optional reference to a player ID
}

export type EventStatus = 'upcoming' | 'completed' | 'cancelled';

export class Event {
  id: number;
  gameId: number;
  title: string;
  date: string;
  time: string;
  endTime: string; // Added end time property
  location: string;
  status: EventStatus;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  rsvps: RSVP[];
  host: Host;
  description: string;
  notes: string;
  // Firebase-specific fields
  googleCalendarEventId?: string | undefined;
  createdBy?: string | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;

  constructor(eventData: Partial<Event>) {
    this.id = eventData.id || 0;
    this.gameId = eventData.gameId || 0;
    this.title = eventData.title || '';
    this.date = eventData.date || '';
    this.time = eventData.time || '';
    this.endTime = eventData.endTime || ''; // Initialize end time
    this.location = eventData.location || '';
    this.status = eventData.status || 'upcoming';
    this.minPlayers = eventData.minPlayers || 1;
    this.maxPlayers = eventData.maxPlayers || 1;
    this.currentPlayers = eventData.currentPlayers || 0;
    this.rsvps = eventData.rsvps || [];
    this.host = eventData.host || { name: '', email: '', phone: '' };
    this.description = eventData.description || '';
    this.notes = eventData.notes || '';
    // Firebase fields
    this.googleCalendarEventId = eventData.googleCalendarEventId;
    this.createdBy = eventData.createdBy;
    this.createdAt = eventData.createdAt;
    this.updatedAt = eventData.updatedAt;
  }

  // Helper methods
  getFormattedDate(): string {
    // Parse the date components to avoid timezone issues
    const [year, month, day] = this.date.split('-').map(Number) as [number, number, number];
    // Create date using local timezone (month is 0-indexed in JS Date)
    const date = new Date(year, month - 1, day);

    // Format the date as "Day, Month Date"
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString(undefined, options);
  }

  getDateObject(): Date {
    const [year, month, day] = this.date.split('-').map(Number) as [number, number, number];
    return new Date(year, month - 1, day);
  }

  isFull(): boolean {
    return this.currentPlayers >= this.maxPlayers;
  }

  isUpcoming(): boolean {
    return this.status === 'upcoming' && this.getDateObject() >= new Date();
  }

  // Get player IDs from RSVPs
  getPlayerIds(): number[] {
    return this.rsvps.filter((rsvp) => rsvp.status === 'confirmed').map((rsvp) => rsvp.playerId);
  }

  // Class method to convert raw JSON data to Event objects
  static fromJSON(eventsData: Partial<Event>[]): Event[] {
    return eventsData.map((eventData) => new Event(eventData));
  }
}
