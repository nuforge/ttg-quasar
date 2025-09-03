import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CalendarFeedService, type CalendarFeedFilters } from 'src/services/calendar-feed-service';
import { Event } from 'src/models/Event';
import { Game } from 'src/models/Game';

// Mock DOM APIs
global.URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
} as any;

// Mock DOM document
global.document = {
  createElement: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
} as any;

// Mock Blob
global.Blob = vi.fn((content, options) => ({
  type: options?.type || 'text/plain',
  size: content.length,
})) as any;

describe('CalendarFeedService', () => {
  let mockEvents: Event[];
  let mockGames: Game[];

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock events
    mockEvents = [
      new Event({
        id: 1,
        firebaseDocId: 'event1',
        gameId: 1,
        title: 'Board Game Night',
        date: '2025-09-15',
        time: '19:00',
        endTime: '22:00',
        location: 'Community Center',
        status: 'upcoming',
        minPlayers: 4,
        maxPlayers: 8,
        rsvps: [
          { playerId: 123, status: 'confirmed', participants: 1 },
          { playerId: 456, status: 'interested', participants: 1 },
        ],
        host: { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
        description: 'Join us for a fun night of board games!',
        notes: '',
      }),
      new Event({
        id: 2,
        firebaseDocId: 'event2',
        gameId: 2,
        title: 'Strategy Game Tournament',
        date: '2025-09-20',
        time: '14:00',
        location: 'Game Store',
        status: 'upcoming',
        minPlayers: 2,
        maxPlayers: 4,
        rsvps: [{ playerId: 123, status: 'confirmed', participants: 1 }],
        host: { name: 'Jane Smith', email: 'jane@example.com', phone: '987-654-3210' },
        description: 'Competitive tournament',
        notes: '',
      }),
    ];

    // Create mock games
    mockGames = [
      new Game(
        'game1',
        1,
        'Settlers of Catan',
        'Strategy',
        '3-4',
        '10+',
        '60-90 minutes',
        ['Board', 'Dice', 'Cards'],
        'A classic strategy game',
        undefined, // releaseYear
        undefined, // image
        undefined, // link
        undefined, // createdAt
        undefined, // updatedAt
        undefined, // createdBy
        true, // approved
        undefined, // approvedBy
        undefined, // approvedAt
        'active', // status
      ),
      new Game(
        'game2',
        2,
        'Ticket to Ride',
        'Family',
        '2-5',
        '8+',
        '30-60 minutes',
        ['Board', 'Cards', 'Trains'],
        'Train adventure game',
        undefined, // releaseYear
        undefined, // image
        undefined, // link
        undefined, // createdAt
        undefined, // updatedAt
        undefined, // createdBy
        true, // approved
        undefined, // approvedBy
        undefined, // approvedAt
        'active', // status
      ),
    ];
  });

  describe('generateCalendarFeed', () => {
    it('should generate valid ICS calendar feed', () => {
      const options = {
        userId: 123,
        filters: {},
        title: 'My TTG Events',
        description: 'My personal TTG calendar',
      };

      const feedContent = CalendarFeedService.generateCalendarFeed(
        mockEvents,
        mockGames,
        options,
        'https://ttg.example.com',
      );

      expect(feedContent).toContain('BEGIN:VCALENDAR');
      expect(feedContent).toContain('END:VCALENDAR');
      expect(feedContent).toContain('VERSION:2.0');
      expect(feedContent).toContain('PRODID:-//TTG Quasar App//Calendar Feed//EN');
      expect(feedContent).toContain('X-WR-CALNAME:My TTG Events');
      expect(feedContent).toContain('Board Game Night');
    });

    it('should include game information in event descriptions', () => {
      const options = {
        userId: 123,
        filters: {},
        title: 'Test Feed',
      };

      const feedContent = CalendarFeedService.generateCalendarFeed(mockEvents, mockGames, options);

      expect(feedContent).toContain('🎮 Game: Settlers of Catan');
      expect(feedContent).toContain('👥 Players: 3-4');
      expect(feedContent).toContain('⏱️ Duration: 60-90 minutes');
    });

    it('should include event URLs when app base URL provided', () => {
      const options = {
        userId: 123,
        filters: {},
      };

      const feedContent = CalendarFeedService.generateCalendarFeed(
        mockEvents,
        mockGames,
        options,
        'https://ttg.example.com',
      );

      expect(feedContent).toContain(
        '🔗 Event Details: https://ttg.example.com/events/event1/board-game-night',
      );
    });

    it('should filter events by RSVP status', () => {
      const options = {
        userId: 123,
        filters: {
          rsvpOnly: true,
        } as CalendarFeedFilters,
      };

      const feedContent = CalendarFeedService.generateCalendarFeed(mockEvents, mockGames, options);

      // Should include both events since user 123 has RSVP'd to both
      expect(feedContent).toContain('Board Game Night');
      expect(feedContent).toContain('Strategy Game Tournament');
    });

    it('should filter events by interest status', () => {
      const options = {
        userId: 456,
        filters: {
          interestedOnly: true,
        } as CalendarFeedFilters,
      };

      const feedContent = CalendarFeedService.generateCalendarFeed(mockEvents, mockGames, options);

      // Should only include first event where user 456 is interested
      expect(feedContent).toContain('Board Game Night');
      expect(feedContent).not.toContain('Strategy Game Tournament');
    });

    it('should filter events by game IDs', () => {
      const options = {
        userId: 123,
        filters: {
          gameIds: [1],
        } as CalendarFeedFilters,
      };

      const feedContent = CalendarFeedService.generateCalendarFeed(mockEvents, mockGames, options);

      // Should only include events for game ID 1
      expect(feedContent).toContain('Board Game Night');
      expect(feedContent).not.toContain('Strategy Game Tournament');
    });

    it('should filter events by upcoming status', () => {
      // Add a past event
      const pastEvent = new Event({
        id: 3,
        firebaseDocId: 'event3',
        gameId: 1,
        title: 'Past Event',
        date: '2025-08-01',
        time: '19:00',
        location: 'Somewhere',
        status: 'completed',
        minPlayers: 2,
        maxPlayers: 4,
        rsvps: [],
        host: { name: 'Host', email: 'host@example.com', phone: '123-456-7890' },
        description: 'Past event',
        notes: '',
      });

      const eventsWithPast = [...mockEvents, pastEvent];

      const options = {
        userId: 123,
        filters: {
          upcomingOnly: true,
        } as CalendarFeedFilters,
      };

      const feedContent = CalendarFeedService.generateCalendarFeed(
        eventsWithPast,
        mockGames,
        options,
      );

      // Should not include the completed event
      expect(feedContent).toContain('Board Game Night');
      expect(feedContent).toContain('Strategy Game Tournament');
      expect(feedContent).not.toContain('Past Event');
    });

    it('should filter events by date range', () => {
      const options = {
        userId: 123,
        filters: {
          dateRange: {
            start: new Date('2025-09-14'),
            end: new Date('2025-09-16'),
          },
        } as CalendarFeedFilters,
      };

      const feedContent = CalendarFeedService.generateCalendarFeed(mockEvents, mockGames, options);

      // Should only include first event (Sept 15)
      expect(feedContent).toContain('Board Game Night');
      expect(feedContent).not.toContain('Strategy Game Tournament');
    });
  });

  describe('generateFeedUrl', () => {
    it('should generate private feed URL', () => {
      const url = CalendarFeedService.generateFeedUrl(
        'https://ttg.example.com',
        123,
        'feed-123',
        false,
      );

      expect(url).toBe('https://ttg.example.com/api/calendar/private/123/feed-123.ics');
    });

    it('should generate public feed URL', () => {
      const url = CalendarFeedService.generateFeedUrl(
        'https://ttg.example.com',
        123,
        'feed-123',
        true,
      );

      expect(url).toBe('https://ttg.example.com/api/calendar/public/123/feed-123.ics');
    });
  });

  describe('downloadCalendarFeed', () => {
    it('should create and trigger download', () => {
      const content = 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR';
      const filename = 'test-feed.ics';

      CalendarFeedService.downloadCalendarFeed(content, filename);

      expect(global.Blob).toHaveBeenCalledWith([content], { type: 'text/calendar;charset=utf-8' });
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.document.createElement).toHaveBeenCalledWith('a');
    });

    it('should use default filename when not provided', () => {
      const content = 'test content';

      CalendarFeedService.downloadCalendarFeed(content);

      // Should create link element for download
      expect(global.document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('error handling', () => {
    it('should handle invalid date format', () => {
      const invalidEvent = new Event({
        id: 99,
        gameId: 1,
        title: 'Invalid Event',
        date: 'invalid-date',
        time: '19:00',
        location: 'Somewhere',
        status: 'upcoming',
        minPlayers: 2,
        maxPlayers: 4,
        rsvps: [],
        host: { name: 'Host', email: 'host@example.com', phone: '123-456-7890' },
        description: 'Invalid event',
        notes: '',
      });

      const options = {
        userId: 123,
        filters: {},
      };

      expect(() => {
        CalendarFeedService.generateCalendarFeed([invalidEvent], mockGames, options);
      }).toThrow('Invalid date or time format');
    });

    it('should handle invalid time format', () => {
      const invalidEvent = new Event({
        id: 99,
        gameId: 1,
        title: 'Invalid Event',
        date: '2025-09-15',
        time: 'invalid-time',
        location: 'Somewhere',
        status: 'upcoming',
        minPlayers: 2,
        maxPlayers: 4,
        rsvps: [],
        host: { name: 'Host', email: 'host@example.com', phone: '123-456-7890' },
        description: 'Invalid event',
        notes: '',
      });

      const options = {
        userId: 123,
        filters: {},
      };

      expect(() => {
        CalendarFeedService.generateCalendarFeed([invalidEvent], mockGames, options);
      }).toThrow('Invalid date or time format');
    });
  });
});
