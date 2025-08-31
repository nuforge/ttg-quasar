export interface RSVP {
  playerId: number;
  status: 'confirmed' | 'interested' | 'waiting' | 'cancelled';
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
  firebaseDocId?: string; // Store original Firebase document ID
  legacyId?: number; // For migrated events from JSON (still needed for compatibility)
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
    if (eventData.firebaseDocId !== undefined) {
      this.firebaseDocId = eventData.firebaseDocId;
    }
    if (eventData.legacyId !== undefined) {
      this.legacyId = eventData.legacyId;
    }
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

  // Get a player's confirmed RSVP
  getPlayerConfirmedRSVP(playerId: number): RSVP | undefined {
    return this.rsvps.find((rsvp) => rsvp.playerId === playerId && rsvp.status === 'confirmed');
  }

  // Get a player's interested RSVP
  getPlayerInterestedRSVP(playerId: number): RSVP | undefined {
    return this.rsvps.find((rsvp) => rsvp.playerId === playerId && rsvp.status === 'interested');
  }

  // Check if player has confirmed RSVP
  isPlayerConfirmed(playerId: number): boolean {
    return !!this.getPlayerConfirmedRSVP(playerId);
  }

  // Check if a player is interested
  isPlayerInterested(playerId: number): boolean {
    const rsvp = this.rsvps.find(
      (rsvp) => rsvp.playerId === playerId && rsvp.status === 'interested',
    );
    return !!rsvp;
  }

  // Get any RSVP for player (prioritize confirmed over interested)
  getPlayerRSVP(playerId: number): RSVP | undefined {
    return this.getPlayerConfirmedRSVP(playerId) || this.getPlayerInterestedRSVP(playerId);
  }

  // Get count of confirmed RSVPs
  getConfirmedCount(): number {
    return this.rsvps.filter((rsvp) => rsvp.status === 'confirmed').length;
  }

  // Get count of interested RSVPs
  getInterestedCount(): number {
    return this.rsvps.filter((rsvp) => rsvp.status === 'interested').length;
  }

  // Get RSVPs by status
  getRSVPsByStatus(status: 'confirmed' | 'interested' | 'waiting' | 'cancelled'): RSVP[] {
    return this.rsvps.filter((rsvp) => rsvp.status === status);
  }

  // Class method to convert raw JSON data to Event objects
  static fromJSON(eventsData: Partial<Event>[]): Event[] {
    return eventsData.map((eventData) => new Event(eventData));
  }
}
