import { describe, it, expect } from 'vitest';
import { Event, type RSVP, type Host } from 'src/models/Event';

describe('Event Model', () => {
  const mockHost: Host = {
    name: 'John Host',
    email: 'host@example.com',
    phone: '555-0123',
    playerId: 1,
  };

  const mockRSVPs: RSVP[] = [
    { playerId: 1, status: 'confirmed', participants: 1 },
    { playerId: 2, status: 'confirmed', participants: 2 },
    { playerId: 3, status: 'interested', participants: 1 },
    { playerId: 4, status: 'waiting', participants: 1 },
    { playerId: 5, status: 'cancelled', participants: 1 },
  ];

  const baseEventData = {
    id: 1,
    firebaseDocId: 'firebase123',
    legacyId: 100,
    gameId: 10,
    title: 'Test Board Game Night',
    date: '2025-12-25',
    time: '19:00',
    endTime: '22:00',
    location: 'Game Shop',
    status: 'upcoming' as const,
    minPlayers: 2,
    maxPlayers: 6,
    rsvps: mockRSVPs,
    host: mockHost,
    description: 'A fun gaming session',
    notes: 'Bring snacks!',
    googleCalendarEventId: 'cal123',
    createdBy: 'user456',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-02T10:00:00Z'),
  };

  describe('Constructor', () => {
    it('should create Event with all fields', () => {
      const event = new Event(baseEventData);

      expect(event.id).toBe(1);
      expect(event.firebaseDocId).toBe('firebase123');
      expect(event.legacyId).toBe(100);
      expect(event.gameId).toBe(10);
      expect(event.title).toBe('Test Board Game Night');
      expect(event.date).toBe('2025-12-25');
      expect(event.time).toBe('19:00');
      expect(event.endTime).toBe('22:00');
      expect(event.location).toBe('Game Shop');
      expect(event.status).toBe('upcoming');
      expect(event.minPlayers).toBe(2);
      expect(event.maxPlayers).toBe(6);
      expect(event.rsvps).toEqual(mockRSVPs);
      expect(event.host).toEqual(mockHost);
      expect(event.description).toBe('A fun gaming session');
      expect(event.notes).toBe('Bring snacks!');
      expect(event.googleCalendarEventId).toBe('cal123');
      expect(event.createdBy).toBe('user456');
      expect(event.createdAt).toEqual(new Date('2025-01-01T10:00:00Z'));
      expect(event.updatedAt).toEqual(new Date('2025-01-02T10:00:00Z'));
    });

    it('should create Event with minimal data and defaults', () => {
      const minimalData = {
        id: 2,
        gameId: 20,
        title: 'Minimal Event',
      };

      const event = new Event(minimalData);

      expect(event.id).toBe(2);
      expect(event.firebaseDocId).toBeUndefined();
      expect(event.legacyId).toBeUndefined();
      expect(event.gameId).toBe(20);
      expect(event.title).toBe('Minimal Event');
      expect(event.date).toBe('');
      expect(event.time).toBe('');
      expect(event.endTime).toBe('');
      expect(event.location).toBe('');
      expect(event.status).toBe('upcoming');
      expect(event.minPlayers).toBe(1);
      expect(event.maxPlayers).toBe(1);
      expect(event.rsvps).toEqual([]);
      expect(event.host).toEqual({ name: '', email: '', phone: '' });
      expect(event.description).toBe('');
      expect(event.notes).toBe('');
      expect(event.googleCalendarEventId).toBeUndefined();
      expect(event.createdBy).toBeUndefined();
      expect(event.createdAt).toBeUndefined();
      expect(event.updatedAt).toBeUndefined();
    });

    it('should handle partial host data', () => {
      const eventData = {
        ...baseEventData,
        host: { name: 'Partial Host', email: 'partial@test.com', phone: '' },
      };

      const event = new Event(eventData);
      expect(event.host.name).toBe('Partial Host');
      expect(event.host.email).toBe('partial@test.com');
      expect(event.host.phone).toBe('');
      expect(event.host.playerId).toBeUndefined();
    });
  });

  describe('Date Methods', () => {
    const event = new Event({
      ...baseEventData,
      date: '2025-12-25', // Christmas Day
    });

    describe('getFormattedDate', () => {
      it('should format date correctly', () => {
        const formatted = event.getFormattedDate();
        // Should be "Thursday, December 25" format
        expect(formatted).toMatch(/Thursday/);
        expect(formatted).toMatch(/December/);
        expect(formatted).toMatch(/25/);
      });

      it('should handle different date formats', () => {
        const newYearEvent = new Event({
          ...baseEventData,
          date: '2025-01-01',
        });

        const formatted = newYearEvent.getFormattedDate();
        expect(formatted).toMatch(/Wednesday/);
        expect(formatted).toMatch(/January/);
        expect(formatted).toMatch(/1/);
      });
    });

    describe('getDateObject', () => {
      it('should convert string date to Date object', () => {
        const dateObj = event.getDateObject();
        expect(dateObj).toBeInstanceOf(Date);
        expect(dateObj.getFullYear()).toBe(2025);
        expect(dateObj.getMonth()).toBe(11); // December is month 11 (0-indexed)
        expect(dateObj.getDate()).toBe(25);
      });

      it('should handle different dates correctly', () => {
        const febEvent = new Event({
          ...baseEventData,
          date: '2025-02-14', // Valentine's Day
        });

        const dateObj = febEvent.getDateObject();
        expect(dateObj.getFullYear()).toBe(2025);
        expect(dateObj.getMonth()).toBe(1); // February is month 1
        expect(dateObj.getDate()).toBe(14);
      });
    });
  });

  describe('RSVP Methods', () => {
    const event = new Event(baseEventData);

    describe('getPlayerIds', () => {
      it('should return only confirmed player IDs', () => {
        const playerIds = event.getPlayerIds();
        expect(playerIds).toEqual([1, 2]); // Only confirmed players
        expect(playerIds).not.toContain(3); // Interested player excluded
        expect(playerIds).not.toContain(4); // Waiting player excluded
        expect(playerIds).not.toContain(5); // Cancelled player excluded
      });

      it('should return empty array when no confirmed RSVPs', () => {
        const eventWithoutConfirmed = new Event({
          ...baseEventData,
          rsvps: [
            { playerId: 1, status: 'interested', participants: 1 },
            { playerId: 2, status: 'waiting', participants: 1 },
          ],
        });

        const playerIds = eventWithoutConfirmed.getPlayerIds();
        expect(playerIds).toEqual([]);
      });
    });

    describe('getPlayerConfirmedRSVP', () => {
      it('should return confirmed RSVP for player', () => {
        const rsvp = event.getPlayerConfirmedRSVP(1);
        expect(rsvp).toEqual({ playerId: 1, status: 'confirmed', participants: 1 });
      });

      it('should return undefined for non-confirmed player', () => {
        const rsvp = event.getPlayerConfirmedRSVP(3); // Interested player
        expect(rsvp).toBeUndefined();
      });

      it('should return undefined for non-existent player', () => {
        const rsvp = event.getPlayerConfirmedRSVP(999);
        expect(rsvp).toBeUndefined();
      });
    });

    describe('getPlayerInterestedRSVP', () => {
      it('should return interested RSVP for player', () => {
        const rsvp = event.getPlayerInterestedRSVP(3);
        expect(rsvp).toEqual({ playerId: 3, status: 'interested', participants: 1 });
      });

      it('should return undefined for confirmed player', () => {
        const rsvp = event.getPlayerInterestedRSVP(1); // Confirmed player
        expect(rsvp).toBeUndefined();
      });

      it('should return undefined for non-existent player', () => {
        const rsvp = event.getPlayerInterestedRSVP(999);
        expect(rsvp).toBeUndefined();
      });
    });

    describe('isPlayerConfirmed', () => {
      it('should return true for confirmed player', () => {
        expect(event.isPlayerConfirmed(1)).toBe(true);
        expect(event.isPlayerConfirmed(2)).toBe(true);
      });

      it('should return false for non-confirmed player', () => {
        expect(event.isPlayerConfirmed(3)).toBe(false); // Interested
        expect(event.isPlayerConfirmed(4)).toBe(false); // Waiting
        expect(event.isPlayerConfirmed(5)).toBe(false); // Cancelled
      });

      it('should return false for non-existent player', () => {
        expect(event.isPlayerConfirmed(999)).toBe(false);
      });
    });

    describe('isPlayerInterested', () => {
      it('should return true for interested player', () => {
        expect(event.isPlayerInterested(3)).toBe(true);
      });

      it('should return false for confirmed player', () => {
        expect(event.isPlayerInterested(1)).toBe(false);
        expect(event.isPlayerInterested(2)).toBe(false);
      });

      it('should return false for non-existent player', () => {
        expect(event.isPlayerInterested(999)).toBe(false);
      });
    });

    describe('getPlayerRSVP', () => {
      it('should prioritize confirmed over interested', () => {
        // Create event where player has both confirmed and interested (edge case)
        const conflictEvent = new Event({
          ...baseEventData,
          rsvps: [
            { playerId: 1, status: 'confirmed', participants: 1 },
            { playerId: 1, status: 'interested', participants: 1 }, // Duplicate
          ],
        });

        const rsvp = conflictEvent.getPlayerRSVP(1);
        expect(rsvp?.status).toBe('confirmed');
      });

      it('should return interested RSVP when no confirmed', () => {
        const rsvp = event.getPlayerRSVP(3);
        expect(rsvp?.status).toBe('interested');
      });

      it('should return undefined when player has no RSVP', () => {
        const rsvp = event.getPlayerRSVP(999);
        expect(rsvp).toBeUndefined();
      });
    });
  });

  describe('Count Methods', () => {
    const event = new Event(baseEventData);

    describe('getConfirmedCount', () => {
      it('should count only confirmed RSVPs', () => {
        expect(event.getConfirmedCount()).toBe(2);
      });

      it('should return 0 when no confirmed RSVPs', () => {
        const eventWithoutConfirmed = new Event({
          ...baseEventData,
          rsvps: [
            { playerId: 1, status: 'interested', participants: 1 },
            { playerId: 2, status: 'waiting', participants: 1 },
          ],
        });

        expect(eventWithoutConfirmed.getConfirmedCount()).toBe(0);
      });
    });

    describe('getInterestedCount', () => {
      it('should count only interested RSVPs', () => {
        expect(event.getInterestedCount()).toBe(1);
      });

      it('should return 0 when no interested RSVPs', () => {
        const eventWithoutInterested = new Event({
          ...baseEventData,
          rsvps: [
            { playerId: 1, status: 'confirmed', participants: 1 },
            { playerId: 2, status: 'waiting', participants: 1 },
          ],
        });

        expect(eventWithoutInterested.getInterestedCount()).toBe(0);
      });
    });

    describe('getRSVPsByStatus', () => {
      it('should filter confirmed RSVPs', () => {
        const confirmed = event.getRSVPsByStatus('confirmed');
        expect(confirmed).toHaveLength(2);
        expect(confirmed.every((rsvp) => rsvp.status === 'confirmed')).toBe(true);
      });

      it('should filter interested RSVPs', () => {
        const interested = event.getRSVPsByStatus('interested');
        expect(interested).toHaveLength(1);
        expect(interested[0]?.playerId).toBe(3);
      });

      it('should filter waiting RSVPs', () => {
        const waiting = event.getRSVPsByStatus('waiting');
        expect(waiting).toHaveLength(1);
        expect(waiting[0]?.playerId).toBe(4);
      });

      it('should filter cancelled RSVPs', () => {
        const cancelled = event.getRSVPsByStatus('cancelled');
        expect(cancelled).toHaveLength(1);
        expect(cancelled[0]?.playerId).toBe(5);
      });

      it('should return empty array for status with no RSVPs', () => {
        const eventWithoutWaiting = new Event({
          ...baseEventData,
          rsvps: [{ playerId: 1, status: 'confirmed', participants: 1 }],
        });

        const waiting = eventWithoutWaiting.getRSVPsByStatus('waiting');
        expect(waiting).toEqual([]);
      });
    });
  });

  describe('Status Methods', () => {
    describe('isFull', () => {
      it('should return true when confirmed count equals max players', () => {
        const fullEvent = new Event({
          ...baseEventData,
          maxPlayers: 2, // Only 2 max, we have 2 confirmed
        });

        expect(fullEvent.isFull()).toBe(true);
      });

      it('should return false when confirmed count is less than max', () => {
        const notFullEvent = new Event({
          ...baseEventData,
          maxPlayers: 5, // 5 max, we have 2 confirmed
        });

        expect(notFullEvent.isFull()).toBe(false);
      });

      it('should return true when over capacity', () => {
        const overCapacityEvent = new Event({
          ...baseEventData,
          maxPlayers: 1, // 1 max, we have 2 confirmed
        });

        expect(overCapacityEvent.isFull()).toBe(true);
      });
    });

    describe('isUpcoming', () => {
      it('should return true for upcoming status and future date', () => {
        const futureEvent = new Event({
          ...baseEventData,
          status: 'upcoming',
          date: '2026-12-25', // Future date
        });

        expect(futureEvent.isUpcoming()).toBe(true);
      });

      it('should return false for completed status', () => {
        const completedEvent = new Event({
          ...baseEventData,
          status: 'completed',
          date: '2026-12-25', // Future date but completed status
        });

        expect(completedEvent.isUpcoming()).toBe(false);
      });

      it('should return false for cancelled status', () => {
        const cancelledEvent = new Event({
          ...baseEventData,
          status: 'cancelled',
          date: '2026-12-25', // Future date but cancelled status
        });

        expect(cancelledEvent.isUpcoming()).toBe(false);
      });

      it('should return false for past date even with upcoming status', () => {
        const pastEvent = new Event({
          ...baseEventData,
          status: 'upcoming',
          date: '2020-01-01', // Past date
        });

        expect(pastEvent.isUpcoming()).toBe(false);
      });
    });
  });

  describe('Static Methods', () => {
    describe('fromJSON', () => {
      it('should convert array of event data to Event objects', () => {
        const eventsData = [
          {
            id: 1,
            title: 'Event 1',
            gameId: 10,
            date: '2025-01-01',
          },
          {
            id: 2,
            title: 'Event 2',
            gameId: 20,
            date: '2025-01-02',
          },
        ];

        const events = Event.fromJSON(eventsData);

        expect(events).toHaveLength(2);
        expect(events[0]).toBeInstanceOf(Event);
        expect(events[1]).toBeInstanceOf(Event);
        expect(events[0]?.title).toBe('Event 1');
        expect(events[1]?.title).toBe('Event 2');
      });

      it('should handle empty array', () => {
        const events = Event.fromJSON([]);
        expect(events).toEqual([]);
      });

      it('should handle array with partial data', () => {
        const eventsData = [
          { id: 1, title: 'Minimal Event' },
          { gameId: 5, title: 'Another Event' },
        ];

        const events = Event.fromJSON(eventsData);

        expect(events).toHaveLength(2);
        expect(events[0]?.id).toBe(1);
        expect(events[0]?.gameId).toBe(0); // Default value
        expect(events[1]?.id).toBe(0); // Default value
        expect(events[1]?.gameId).toBe(5);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle event with no RSVPs', () => {
      const emptyEvent = new Event({
        ...baseEventData,
        rsvps: [],
      });

      expect(emptyEvent.getConfirmedCount()).toBe(0);
      expect(emptyEvent.getInterestedCount()).toBe(0);
      expect(emptyEvent.getPlayerIds()).toEqual([]);
      expect(emptyEvent.isPlayerConfirmed(1)).toBe(false);
      expect(emptyEvent.isPlayerInterested(1)).toBe(false);
      expect(emptyEvent.getPlayerRSVP(1)).toBeUndefined();
      expect(emptyEvent.isFull()).toBe(false);
    });

    it('should handle duplicate player RSVPs with different statuses', () => {
      const duplicateEvent = new Event({
        ...baseEventData,
        rsvps: [
          { playerId: 1, status: 'confirmed', participants: 1 },
          { playerId: 1, status: 'interested', participants: 1 },
          { playerId: 1, status: 'waiting', participants: 1 },
        ],
      });

      // Should find the first matching confirmed RSVP
      expect(duplicateEvent.isPlayerConfirmed(1)).toBe(true);
      expect(duplicateEvent.getPlayerConfirmedRSVP(1)?.status).toBe('confirmed');
    });

    it('should handle RSVPs with participants field', () => {
      const participantsEvent = new Event({
        ...baseEventData,
        rsvps: [
          { playerId: 1, status: 'confirmed', participants: 3 },
          { playerId: 2, status: 'confirmed', participants: 2 },
        ],
      });

      // Count should be based on number of RSVPs, not participants
      expect(participantsEvent.getConfirmedCount()).toBe(2);
      expect(participantsEvent.getPlayerIds()).toEqual([1, 2]);
    });

    it('should handle RSVPs without participants field', () => {
      const noParticipantsEvent = new Event({
        ...baseEventData,
        rsvps: [
          { playerId: 1, status: 'confirmed' }, // No participants field
          { playerId: 2, status: 'interested' }, // No participants field
        ],
      });

      expect(noParticipantsEvent.getConfirmedCount()).toBe(1);
      expect(noParticipantsEvent.getInterestedCount()).toBe(1);
      expect(noParticipantsEvent.isPlayerConfirmed(1)).toBe(true);
      expect(noParticipantsEvent.isPlayerInterested(2)).toBe(true);
    });
  });
});
