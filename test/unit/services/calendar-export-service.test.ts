import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CalendarExportService } from 'src/services/calendar-export-service';
import { Event, type Host, type RSVP } from 'src/models/Event';
import type { Game } from 'src/models/Game';

// Mock DOM APIs
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockOpen = vi.fn();

// Create a mock link element
const mockLinkElement = {
  href: '',
  download: '',
  click: mockClick,
};

const mockCreateElement = vi.fn(() => mockLinkElement);

const mockDocument = {
  createElement: mockCreateElement,
  body: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild,
  },
};

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
});

Object.defineProperty(window, 'open', {
  value: mockOpen,
});

Object.defineProperty(global, 'document', {
  value: mockDocument,
});

describe('CalendarExportService', () => {
  let service: CalendarExportService;
  let mockEvent: Event;
  let mockGame: Game;

  beforeEach(() => {
    service = new CalendarExportService();

    const mockHost: Host = {
      name: 'John Host',
      email: 'host@example.com',
      phone: '555-0123',
      playerId: 1,
    };

    const mockRSVPs: RSVP[] = [
      { playerId: 1, status: 'confirmed', participants: 1 },
      { playerId: 2, status: 'confirmed', participants: 2 },
    ];

    // Create proper Event instance
    mockEvent = new Event({
      id: 1,
      firebaseDocId: 'test-event-123',
      title: 'Test Game Night',
      description: 'A fun evening of board games',
      location: 'Community Center',
      date: '2025-09-15',
      time: '18:00',
      endTime: '21:00',
      minPlayers: 2,
      maxPlayers: 6,
      notes: 'Bring snacks!',
      gameId: 1,
      status: 'upcoming',
      rsvps: mockRSVPs,
      host: mockHost,
      createdBy: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create mock game
    mockGame = {
      id: 'game-123',
      legacyId: 1,
      title: 'Catan',
      description: 'Strategy board game about building settlements',
    } as Game;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateICS', () => {
    it('should generate valid ICS content for event without game', () => {
      const ics = service.generateICS(mockEvent);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:Test Game Night');
      expect(ics).toContain('LOCATION:Community Center');
      // Use more flexible pattern matching for ICS dates since they depend on local time
      expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/);
      expect(ics).toMatch(/DTEND:\d{8}T\d{6}Z/);
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('should generate valid ICS content for event with game', () => {
      const ics = service.generateICS(mockEvent, mockGame);

      expect(ics).toContain('SUMMARY:Test Game Night');
      expect(ics).toContain('🎮 Game: Catan');
      expect(ics).toContain('Strategy board game about building settlements');
    });

    it('should include app URL when provided', () => {
      const appBaseUrl = 'https://example.com';
      const ics = service.generateICS(mockEvent, mockGame, appBaseUrl);

      expect(ics).toContain('URL:https://example.com/events/test-event-123/test-game-night');
      expect(ics).toContain(
        '🔗 View Event: https://example.com/events/test-event-123/test-game-night',
      );
    });

    it('should handle event without end time', () => {
      const eventWithoutEndTime = new Event({
        id: 1,
        firebaseDocId: 'test-event-123',
        title: 'Test Game Night',
        description: 'A fun evening of board games',
        location: 'Community Center',
        date: '2025-09-15',
        time: '18:00',
        minPlayers: 2,
        maxPlayers: 6,
        notes: 'Bring snacks!',
        gameId: 1,
        status: 'upcoming',
        rsvps: [],
        host: { name: 'Host', email: 'host@test.com', phone: '', playerId: 1 },
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const ics = service.generateICS(eventWithoutEndTime);

      expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/);
      // Should default to 2 hours later - check pattern
      expect(ics).toMatch(/DTEND:\d{8}T\d{6}Z/);
    });

    it('should escape special characters in ICS text', () => {
      const eventWithSpecialChars = new Event({
        id: 1,
        firebaseDocId: 'test-event-123',
        title: 'Game; Night, with\\nSpecial Characters',
        description: 'Line 1\\nLine 2; with, commas',
        location: 'Community Center',
        date: '2025-09-15',
        time: '18:00',
        endTime: '21:00',
        minPlayers: 2,
        maxPlayers: 6,
        gameId: 1,
        status: 'upcoming',
        rsvps: [],
        host: { name: 'Host', email: 'host@test.com', phone: '', playerId: 1 },
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const ics = service.generateICS(eventWithSpecialChars);

      expect(ics).toContain('SUMMARY:Game\\; Night\\, with\\\\nSpecial Characters');
      expect(ics).toContain('Line 1\\\\nLine 2\\; with\\, commas');
    });
  });

  describe('generateGoogleCalendarUrl', () => {
    it('should generate valid Google Calendar URL', () => {
      const url = service.generateGoogleCalendarUrl(mockEvent, mockGame);

      expect(url).toContain('https://calendar.google.com/calendar/render');
      expect(url).toContain('action=TEMPLATE');
      expect(url).toContain('text=Test+Game+Night'); // + encoding
      expect(url).toContain('location=Community+Center'); // + encoding
      // Note: dates will vary based on timezone, so we check general format
      expect(url).toMatch(/dates=\d{8}T\d{6}Z%2F\d{8}T\d{6}Z/);
    });

    it('should include game information in details', () => {
      const url = service.generateGoogleCalendarUrl(mockEvent, mockGame);

      expect(decodeURIComponent(url)).toContain('🎮+Game:+Catan'); // URL encoded spaces become +
    });

    it('should include app URL in sprop parameter when provided', () => {
      const appBaseUrl = 'https://example.com';
      const url = service.generateGoogleCalendarUrl(mockEvent, mockGame, appBaseUrl);

      expect(url).toContain(
        'sprop=https%3A%2F%2Fexample.com%2Fevents%2Ftest-event-123%2Ftest-game-night',
      );
    });
  });

  describe('generateOutlookUrl', () => {
    it('should generate valid Outlook Calendar URL', () => {
      const url = service.generateOutlookUrl(mockEvent, mockGame);

      expect(url).toContain('https://outlook.live.com/calendar/0/deeplink/compose');
      expect(url).toContain('subject=Test+Game+Night'); // + encoding
      expect(url).toContain('location=Community+Center'); // + encoding
      // Check for ISO date format pattern
      expect(url).toMatch(/startdt=\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}\.\d{3}Z/);
      expect(url).toMatch(/enddt=\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}\.\d{3}Z/);
    });

    it('should include game information in body', () => {
      const url = service.generateOutlookUrl(mockEvent, mockGame);

      expect(decodeURIComponent(url)).toContain('🎮+Game:+Catan'); // URL encoded spaces become +
    });
  });

  describe('downloadICS', () => {
    beforeEach(() => {
      mockCreateObjectURL.mockReturnValue('blob:mock-url');
    });

    it('should create and download ICS file', () => {
      service.downloadICS(mockEvent, mockGame);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLinkElement.href).toBe('blob:mock-url');
      expect(mockLinkElement.download).toBe('Test_Game_Night.ics');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLinkElement);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLinkElement);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should sanitize filename for download', () => {
      const eventWithSpecialChars = new Event({
        id: 1,
        firebaseDocId: 'test-event-123',
        title: 'Game Night: Fun & Games!',
        description: 'A fun evening of board games',
        location: 'Community Center',
        date: '2025-09-15',
        time: '18:00',
        endTime: '21:00',
        minPlayers: 2,
        maxPlayers: 6,
        gameId: 1,
        status: 'upcoming',
        rsvps: [],
        host: { name: 'Host', email: 'host@test.com', phone: '', playerId: 1 },
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service.downloadICS(eventWithSpecialChars);

      expect(mockLinkElement.download).toBe('Game_Night__Fun___Games_.ics');
    });
  });

  describe('openCalendar', () => {
    it('should open Google Calendar in new window', () => {
      service.openCalendar(mockEvent, 'google', mockGame);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://calendar.google.com'),
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('should open Outlook Calendar in new window', () => {
      service.openCalendar(mockEvent, 'outlook', mockGame);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://outlook.live.com'),
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        service.openCalendar(mockEvent, 'unsupported' as any, mockGame);
      }).toThrow('Unsupported calendar format: unsupported');
    });
  });
});
