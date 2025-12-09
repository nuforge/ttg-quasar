import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { eventSubmissionService } from 'src/services/event-submission-service';
import { vueFireAuthService } from 'src/services/vuefire-auth-service';
import { googleCalendarService } from 'src/services/google-calendar-service';
import { gameEventNotificationService } from 'src/services/game-event-notification-service';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { Timestamp } from 'firebase/firestore';
import type {
  CreateEventSubmissionData,
  EventSubmission,
  EventSubmissionFilter,
} from 'src/models/EventSubmission';
import type { FirebaseGame } from 'src/models/Game';
import type { CalendarEvent } from 'src/services/google-calendar-service';
import type { User } from 'firebase/auth';
import { Event } from 'src/models/Event';

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1725000000, nanoseconds: 0 })),
  },
}));

// Mock dependencies
vi.mock('src/boot/firebase', () => ({
  db: {},
}));

vi.mock('src/services/vuefire-auth-service', () => ({
  vueFireAuthService: {
    currentUser: { value: null },
  },
}));

vi.mock('src/services/google-calendar-service', () => ({
  googleCalendarService: {
    createEvent: vi.fn(),
  },
}));

vi.mock('src/services/game-event-notification-service', () => ({
  gameEventNotificationService: {
    notifyUsersAboutGameEvent: vi.fn(),
  },
}));

vi.mock('src/stores/games-firebase-store', () => ({
  useGamesFirebaseStore: vi.fn(),
}));

describe('EventSubmissionService', () => {
  const mockUser = {
    uid: 'user123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: '2023-01-01T00:00:00.000Z',
      lastSignInTime: '2023-01-01T00:00:00.000Z',
    },
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: vi.fn(),
    getIdToken: vi.fn(),
    getIdTokenResult: vi.fn(),
    reload: vi.fn(),
    toJSON: vi.fn(),
  } as unknown as User;

  const mockAdminUser = {
    ...mockUser,
    uid: 'admin123',
    email: 'admin@example.com',
    displayName: 'Admin User',
  } as unknown as User;

  const mockSubmissionData: CreateEventSubmissionData = {
    title: 'Test Event',
    gameId: 'game1',
    startDate: '2025-09-01',
    startTime: '19:00',
    endDate: '2025-09-01',
    endTime: '22:00',
    location: 'Test Location',
    locationDetails: 'Room 101',
    description: 'Test description',
    minPlayers: 2,
    maxPlayers: 6,
    eventType: 'game_night',
    contactEmail: 'contact@example.com',
  };

  const mockSubmission: EventSubmission = {
    id: 'submission123',
    ...mockSubmissionData,
    submittedBy: {
      userId: mockUser.uid,
      email: mockUser.email || '',
      ...(mockUser.displayName && { displayName: mockUser.displayName }),
    },
    submittedAt: Timestamp.now(),
    status: 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const mockGame: FirebaseGame = {
    id: '1',
    title: 'Test Game',
    genre: 'Strategy',
    numberOfPlayers: '2-4',
    recommendedAge: '12+',
    playTime: '60-90 min',
    components: ['Cards', 'Board'],
    description: 'A test game',
    image: '',
    status: 'active',
    approved: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vueFireAuthService.currentUser).value = null;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createSubmission', () => {
    it('should create a submission successfully when user is authenticated', async () => {
      // Arrange
      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(vueFireAuthService.currentUser).value = mockUser;
      vi.mocked(addDoc).mockResolvedValue({ id: 'submission123' } as any);
      vi.mocked(collection).mockReturnValue({} as any);

      // Act
      const result = await eventSubmissionService.createSubmission(mockSubmissionData);

      // Assert
      expect(result).toBe('submission123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: mockSubmissionData.title,
          gameId: mockSubmissionData.gameId,
          submittedBy: {
            userId: mockUser.uid,
            email: mockUser.email,
            displayName: mockUser.displayName,
          },
          status: 'pending',
        }),
      );
    });

    it('should create submission without optional displayName', async () => {
      // Arrange
      const { addDoc, collection } = await import('firebase/firestore');
      const userWithoutDisplayName = { ...mockUser, displayName: null };
      vi.mocked(vueFireAuthService.currentUser).value = userWithoutDisplayName;
      vi.mocked(addDoc).mockResolvedValue({ id: 'submission456' } as any);
      vi.mocked(collection).mockReturnValue({} as any);

      // Act
      const result = await eventSubmissionService.createSubmission(mockSubmissionData);

      // Assert
      expect(result).toBe('submission456');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          submittedBy: {
            userId: userWithoutDisplayName.uid,
            email: userWithoutDisplayName.email,
          },
        }),
      );
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      vi.mocked(vueFireAuthService.currentUser).value = null;

      // Act & Assert
      await expect(eventSubmissionService.createSubmission(mockSubmissionData)).rejects.toThrow(
        'User must be authenticated to submit events',
      );
    });

    it('should throw error when Firebase operation fails', async () => {
      // Arrange
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(vueFireAuthService.currentUser).value = mockUser;
      vi.mocked(addDoc).mockRejectedValue(new Error('Firebase error'));

      // Act & Assert
      await expect(eventSubmissionService.createSubmission(mockSubmissionData)).rejects.toThrow(
        'Failed to submit event',
      );
    });

    it('should include all submission data with timestamps', async () => {
      // Arrange
      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(vueFireAuthService.currentUser).value = mockUser;
      vi.mocked(addDoc).mockResolvedValue({ id: 'submission789' } as any);
      vi.mocked(collection).mockReturnValue({} as any);

      // Act
      await eventSubmissionService.createSubmission(mockSubmissionData);

      // Assert
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...mockSubmissionData,
          status: 'pending',
          submittedAt: expect.any(Object),
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object),
        }),
      );
    });
  });

  describe('getSubmission', () => {
    it('should return submission when it exists', async () => {
      // Arrange
      const { doc, getDoc } = await import('firebase/firestore');
      const submissionDataWithoutId = { ...mockSubmission };
      delete (submissionDataWithoutId as any).id;
      const mockDocSnapshot = {
        exists: () => true,
        data: () => submissionDataWithoutId,
        id: 'submission123',
      };
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);

      // Act
      const result = await eventSubmissionService.getSubmission('submission123');

      // Assert
      expect(result).toEqual({ id: 'submission123', ...submissionDataWithoutId });
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'eventSubmissions', 'submission123');
    });

    it('should return null when submission does not exist', async () => {
      // Arrange
      const { doc, getDoc } = await import('firebase/firestore');
      const mockDocSnapshot = {
        exists: () => false,
      };
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);

      // Act
      const result = await eventSubmissionService.getSubmission('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when Firebase operation fails', async () => {
      // Arrange
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockRejectedValue(new Error('Firebase error'));

      // Act & Assert
      await expect(eventSubmissionService.getSubmission('submission123')).rejects.toThrow(
        'Failed to get event submission',
      );
    });
  });

  describe('getSubmissions', () => {
    const mockSubmissions = [
      { ...mockSubmission, id: 'submission1', title: 'Event 1', status: 'pending' },
      { ...mockSubmission, id: 'submission2', title: 'Event 2', status: 'approved' },
      {
        ...mockSubmission,
        id: 'submission3',
        title: 'Event 3',
        status: 'pending',
        eventType: 'tournament',
      },
    ];

    it('should return all submissions ordered by submittedAt', async () => {
      // Arrange
      const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
      const mockQuerySnapshot = {
        docs: mockSubmissions.map((sub) => ({
          id: sub.id,
          data: () => ({ ...sub, id: undefined }),
        })),
      };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      // Act
      const result = await eventSubmissionService.getSubmissions();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]?.title).toBe('Event 1');
      expect(orderBy).toHaveBeenCalledWith('submittedAt', 'desc');
    });

    it('should filter by status when provided', async () => {
      // Arrange
      const { collection, query, orderBy, where, getDocs } = await import('firebase/firestore');
      const filteredSubmissions = mockSubmissions.filter((sub) => sub.status === 'pending');
      const mockQuerySnapshot = {
        docs: filteredSubmissions.map((sub) => ({
          id: sub.id,
          data: () => ({ ...sub, id: undefined }),
        })),
      };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      const filters: EventSubmissionFilter = { status: 'pending' };

      // Act
      const result = await eventSubmissionService.getSubmissions(filters);

      // Assert
      expect(where).toHaveBeenCalledWith('status', '==', 'pending');
      expect(result).toHaveLength(2);
      expect(result.every((sub) => sub.status === 'pending')).toBe(true);
    });

    it('should filter by eventType when provided', async () => {
      // Arrange
      const { collection, query, orderBy, where, getDocs } = await import('firebase/firestore');
      const filteredSubmissions = mockSubmissions.filter((sub) => sub.eventType === 'tournament');
      const mockQuerySnapshot = {
        docs: filteredSubmissions.map((sub) => ({
          id: sub.id,
          data: () => ({ ...sub, id: undefined }),
        })),
      };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      const filters: EventSubmissionFilter = { eventType: 'tournament' };

      // Act
      const result = await eventSubmissionService.getSubmissions(filters);

      // Assert
      expect(where).toHaveBeenCalledWith('eventType', '==', 'tournament');
      expect(result).toHaveLength(1);
      expect(result[0]?.eventType).toBe('tournament');
    });

    it('should filter by submittedBy when provided', async () => {
      // Arrange
      const { collection, query, orderBy, where, getDocs } = await import('firebase/firestore');
      const mockQuerySnapshot = {
        docs: [mockSubmissions[0]].map((sub) => ({
          id: sub?.id || 'unknown',
          data: () => ({ ...sub, id: undefined }),
        })),
      };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      const filters: EventSubmissionFilter = { submittedBy: 'user123' };

      // Act
      const result = await eventSubmissionService.getSubmissions(filters);

      // Assert
      expect(where).toHaveBeenCalledWith('submittedBy.userId', '==', 'user123');
      expect(result).toHaveLength(1);
    });

    it('should apply multiple filters when provided', async () => {
      // Arrange
      const { collection, query, orderBy, where, getDocs } = await import('firebase/firestore');
      const mockQuerySnapshot = { docs: [] };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      const filters: EventSubmissionFilter = {
        status: 'pending',
        eventType: 'game_night',
        submittedBy: 'user123',
      };

      // Act
      await eventSubmissionService.getSubmissions(filters);

      // Assert
      expect(where).toHaveBeenCalledWith('status', '==', 'pending');
      expect(where).toHaveBeenCalledWith('eventType', '==', 'game_night');
      expect(where).toHaveBeenCalledWith('submittedBy.userId', '==', 'user123');
    });

    it('should throw error when Firebase operation fails', async () => {
      // Arrange
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValue(new Error('Firebase error'));

      // Act & Assert
      await expect(eventSubmissionService.getSubmissions()).rejects.toThrow(
        'Failed to get event submissions',
      );
    });
  });

  describe('getUserSubmissions', () => {
    it('should return user submissions when user is authenticated', async () => {
      // Arrange
      vi.mocked(vueFireAuthService.currentUser).value = mockUser;
      const { collection, query, orderBy, where, getDocs } = await import('firebase/firestore');
      const mockQuerySnapshot = {
        docs: [mockSubmission].map((sub) => ({
          id: sub.id,
          data: () => ({ ...sub, id: undefined }),
        })),
      };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      // Act
      const result = await eventSubmissionService.getUserSubmissions();

      // Assert
      expect(result).toHaveLength(1);
      expect(where).toHaveBeenCalledWith('submittedBy.userId', '==', mockUser.uid);
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      vi.mocked(vueFireAuthService.currentUser).value = null;

      // Act & Assert
      await expect(eventSubmissionService.getUserSubmissions()).rejects.toThrow(
        'User must be authenticated',
      );
    });
  });

  describe('updateSubmissionStatus', () => {
    it('should update submission status successfully', async () => {
      // Arrange
      const { doc, updateDoc } = await import('firebase/firestore');
      vi.mocked(vueFireAuthService.currentUser).value = mockAdminUser;
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await eventSubmissionService.updateSubmissionStatus('submission123', 'approved');

      // Assert
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'approved',
          reviewedBy: {
            userId: mockAdminUser.uid,
            email: mockAdminUser.email,
            displayName: mockAdminUser.displayName,
          },
          reviewedAt: expect.any(Object),
          updatedAt: expect.any(Object),
        }),
      );
    });

    it('should include review notes when provided', async () => {
      // Arrange
      const { doc, updateDoc } = await import('firebase/firestore');
      vi.mocked(vueFireAuthService.currentUser).value = mockAdminUser;
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await eventSubmissionService.updateSubmissionStatus(
        'submission123',
        'rejected',
        'Missing required information',
      );

      // Assert
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'rejected',
          reviewNotes: 'Missing required information',
        }),
      );
    });

    it('should handle user without display name', async () => {
      // Arrange
      const { doc, updateDoc } = await import('firebase/firestore');
      const userWithoutDisplayName = { ...mockAdminUser, displayName: null };
      vi.mocked(vueFireAuthService.currentUser).value = userWithoutDisplayName;
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await eventSubmissionService.updateSubmissionStatus('submission123', 'approved');

      // Assert
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reviewedBy: {
            userId: userWithoutDisplayName.uid,
            email: userWithoutDisplayName.email,
          },
        }),
      );
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      vi.mocked(vueFireAuthService.currentUser).value = null;

      // Act & Assert
      await expect(
        eventSubmissionService.updateSubmissionStatus('submission123', 'approved'),
      ).rejects.toThrow('User must be authenticated to review submissions');
    });

    it('should throw error when Firebase operation fails', async () => {
      // Arrange
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(vueFireAuthService.currentUser).value = mockAdminUser;
      vi.mocked(updateDoc).mockRejectedValue(new Error('Firebase error'));

      // Act & Assert
      await expect(
        eventSubmissionService.updateSubmissionStatus('submission123', 'approved'),
      ).rejects.toThrow('Failed to update submission status');
    });
  });

  describe('approveAndPublish', () => {
    const mockCalendarEvent = {
      id: 'calendar123',
      summary: 'Test Event',
      start: { dateTime: '2025-09-01T19:00:00Z' },
      end: { dateTime: '2025-09-01T22:00:00Z' },
      location: 'Test Location',
      description: 'Test description',
    };

    beforeEach(() => {
      // Mock the games store
      const mockGamesStore = {
        getGameById: vi.fn().mockReturnValue(mockGame),
      };
      vi.mocked(useGamesFirebaseStore).mockReturnValue(mockGamesStore as any);
    });

    it('should approve submission and create calendar event successfully', async () => {
      // Arrange
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ ...mockSubmission, id: undefined }),
        id: 'submission123',
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(googleCalendarService.createEvent).mockResolvedValue(mockCalendarEvent);
      vi.mocked(gameEventNotificationService.notifyUsersAboutGameEvent).mockResolvedValue(
        undefined,
      );
      vi.mocked(vueFireAuthService.currentUser).value = mockAdminUser;

      // Act
      const result = await eventSubmissionService.approveAndPublish('submission123');

      // Assert
      expect(result).toBe('calendar123');
      expect(googleCalendarService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: mockSubmission.title,
          location: `${mockSubmission.location}\n${mockSubmission.locationDetails}`,
          description: expect.stringContaining(mockSubmission.description),
        }),
      );
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'published',
          calendarEventId: 'calendar123',
        }),
      );
    });

    it('should include review notes when provided', async () => {
      // Arrange
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ ...mockSubmission, id: undefined }),
        id: 'submission123',
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(googleCalendarService.createEvent).mockResolvedValue(mockCalendarEvent);
      vi.mocked(gameEventNotificationService.notifyUsersAboutGameEvent).mockResolvedValue(
        undefined,
      );
      vi.mocked(vueFireAuthService.currentUser).value = mockAdminUser;

      // Act
      await eventSubmissionService.approveAndPublish('submission123', 'Looks good!');

      // Assert
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reviewNotes: 'Looks good!',
        }),
      );
    });

    it('should send game event notifications when gameId exists', async () => {
      // Arrange
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ ...mockSubmission, id: undefined }),
        id: 'submission123',
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(googleCalendarService.createEvent).mockResolvedValue(mockCalendarEvent);
      vi.mocked(gameEventNotificationService.notifyUsersAboutGameEvent).mockResolvedValue(
        undefined,
      );
      vi.mocked(vueFireAuthService.currentUser).value = mockAdminUser;

      // Act
      await eventSubmissionService.approveAndPublish('submission123');

      // Assert
      expect(gameEventNotificationService.notifyUsersAboutGameEvent).toHaveBeenCalledWith(
        mockGame,
        expect.any(Event),
        'new_event',
      );
    });

    it('should handle notification failures gracefully', async () => {
      // Arrange
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ ...mockSubmission, id: undefined }),
        id: 'submission123',
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(googleCalendarService.createEvent).mockResolvedValue(mockCalendarEvent);
      vi.mocked(gameEventNotificationService.notifyUsersAboutGameEvent).mockRejectedValue(
        new Error('Notification error'),
      );
      vi.mocked(vueFireAuthService.currentUser).value = mockAdminUser;

      // Act
      const result = await eventSubmissionService.approveAndPublish('submission123');

      // Assert
      expect(result).toBe('calendar123'); // Should still succeed
    });

    it('should handle missing game gracefully', async () => {
      // Arrange
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ ...mockSubmission, id: undefined }),
        id: 'submission123',
      };
      const mockGamesStore = {
        getGameById: vi.fn().mockReturnValue(null),
      };
      vi.mocked(useGamesFirebaseStore).mockReturnValue(mockGamesStore as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(googleCalendarService.createEvent).mockResolvedValue(mockCalendarEvent);
      vi.mocked(vueFireAuthService.currentUser).value = mockAdminUser;

      // Act
      const result = await eventSubmissionService.approveAndPublish('submission123');

      // Assert
      expect(result).toBe('calendar123'); // Should still succeed
      expect(gameEventNotificationService.notifyUsersAboutGameEvent).not.toHaveBeenCalled();
    });

    it('should throw error when submission does not exist', async () => {
      // Arrange
      const { doc, getDoc } = await import('firebase/firestore');
      const mockDocSnapshot = {
        exists: () => false,
      };
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);

      // Act & Assert
      await expect(eventSubmissionService.approveAndPublish('nonexistent')).rejects.toThrow(
        'Submission not found',
      );
    });

    it('should throw error when calendar event creation fails', async () => {
      // Arrange
      const { doc, getDoc } = await import('firebase/firestore');
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ ...mockSubmission, id: undefined }),
        id: 'submission123',
      };
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);
      vi.mocked(googleCalendarService.createEvent).mockRejectedValue(new Error('Calendar error'));

      // Act & Assert
      await expect(eventSubmissionService.approveAndPublish('submission123')).rejects.toThrow(
        'Failed to approve and publish event: Calendar error',
      );
    });

    it('should handle submission without locationDetails', async () => {
      // Arrange
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const submissionWithoutLocationDetails = { ...mockSubmission, locationDetails: undefined };
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ ...submissionWithoutLocationDetails, id: undefined }),
        id: 'submission123',
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(googleCalendarService.createEvent).mockResolvedValue(mockCalendarEvent);
      vi.mocked(gameEventNotificationService.notifyUsersAboutGameEvent).mockResolvedValue(
        undefined,
      );
      vi.mocked(vueFireAuthService.currentUser).value = mockAdminUser;

      // Act
      await eventSubmissionService.approveAndPublish('submission123');

      // Assert
      expect(googleCalendarService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          location: mockSubmission.location, // No locationDetails appended
        }),
      );
    });
  });

  describe('deleteSubmission', () => {
    it('should delete submission successfully', async () => {
      // Arrange
      const { doc, deleteDoc } = await import('firebase/firestore');
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      // Act
      await eventSubmissionService.deleteSubmission('submission123');

      // Assert
      expect(deleteDoc).toHaveBeenCalledWith(expect.anything());
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'eventSubmissions', 'submission123');
    });

    it('should throw error when Firebase operation fails', async () => {
      // Arrange
      const { deleteDoc } = await import('firebase/firestore');
      vi.mocked(deleteDoc).mockRejectedValue(new Error('Firebase error'));

      // Act & Assert
      await expect(eventSubmissionService.deleteSubmission('submission123')).rejects.toThrow(
        'Failed to delete submission',
      );
    });
  });

  describe('getPendingCount', () => {
    it('should return count of pending submissions', async () => {
      // Arrange
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const mockQuerySnapshot = {
        size: 5,
      };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      // Act
      const result = await eventSubmissionService.getPendingCount();

      // Assert
      expect(result).toBe(5);
      expect(where).toHaveBeenCalledWith('status', '==', 'pending');
    });

    it('should return 0 when Firebase operation fails', async () => {
      // Arrange
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValue(new Error('Firebase error'));

      // Act
      const result = await eventSubmissionService.getPendingCount();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('onSubmissionsChange', () => {
    it('should set up listener for all submissions when no filter provided', async () => {
      // Arrange
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
      const callback = vi.fn();
      const unsubscribe = vi.fn();
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockReturnValue(unsubscribe);

      // Act
      const result = eventSubmissionService.onSubmissionsChange(callback);

      // Assert
      expect(onSnapshot).toHaveBeenCalled();
      expect(result).toBe(unsubscribe);
      expect(orderBy).toHaveBeenCalledWith('submittedAt', 'desc');
    });

    it('should set up listener with status filter when provided', async () => {
      // Arrange
      const { collection, query, where, orderBy, onSnapshot } = await import('firebase/firestore');
      const callback = vi.fn();
      const unsubscribe = vi.fn();
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockReturnValue(unsubscribe);

      const filters: EventSubmissionFilter = { status: 'pending' };

      // Act
      const result = eventSubmissionService.onSubmissionsChange(callback, filters);

      // Assert
      expect(where).toHaveBeenCalledWith('status', '==', 'pending');
      expect(onSnapshot).toHaveBeenCalled();
      expect(result).toBe(unsubscribe);
    });

    it('should set up listener with eventType filter when provided', async () => {
      // Arrange
      const { collection, query, where, orderBy, onSnapshot } = await import('firebase/firestore');
      const callback = vi.fn();
      const unsubscribe = vi.fn();
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockReturnValue(unsubscribe);

      const filters: EventSubmissionFilter = { eventType: 'tournament' };

      // Act
      const result = eventSubmissionService.onSubmissionsChange(callback, filters);

      // Assert
      expect(where).toHaveBeenCalledWith('eventType', '==', 'tournament');
      expect(onSnapshot).toHaveBeenCalled();
      expect(result).toBe(unsubscribe);
    });

    it('should process snapshot data correctly', async () => {
      // Arrange
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
      const callback = vi.fn();
      const submissionDataWithoutId1 = { ...mockSubmission, title: 'Event 1' };
      const submissionDataWithoutId2 = { ...mockSubmission, title: 'Event 2' };
      delete (submissionDataWithoutId1 as any).id;
      delete (submissionDataWithoutId2 as any).id;

      const mockSnapshot = {
        docs: [
          {
            id: 'submission1',
            data: () => submissionDataWithoutId1,
          },
          {
            id: 'submission2',
            data: () => submissionDataWithoutId2,
          },
        ],
      };

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockImplementation((q, cb) => {
        (cb as any)(mockSnapshot);
        return vi.fn();
      });

      // Act
      eventSubmissionService.onSubmissionsChange(callback);

      // Assert
      expect(callback).toHaveBeenCalledWith([
        { id: 'submission1', ...submissionDataWithoutId1 },
        { id: 'submission2', ...submissionDataWithoutId2 },
      ]);
    });

    it('should handle error in snapshot listener', async () => {
      // Arrange
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
      const callback = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockImplementation((q, cb, errorCb) => {
        if (errorCb) {
          (errorCb as any)(new Error('Firestore error'));
        }
        return vi.fn();
      });

      // Act
      eventSubmissionService.onSubmissionsChange(callback);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Error in submissions listener:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('formatSubmissionForDisplay', () => {
    it('should format submission correctly', () => {
      // Arrange
      const submission = {
        ...mockSubmission,
        startDate: '2025-09-01',
        startTime: '19:00',
        endDate: '2025-09-01',
        endTime: '22:00',
      };

      // Act
      const result = eventSubmissionService.formatSubmissionForDisplay(submission);

      // Assert
      expect(result).toContain(submission.title);
      expect(result).toContain(submission.location);
      expect(result).toContain(submission.eventType);
      expect(result).toContain(submission.status);
    });

    it('should handle different date formats', () => {
      // Arrange
      const submission = {
        ...mockSubmission,
        title: 'Test Event Format',
        startDate: '2025-12-25',
        startTime: '10:30',
        endDate: '2025-12-25',
        endTime: '14:00',
        location: 'Community Center',
        eventType: 'tournament' as const,
        status: 'approved' as const,
      };

      // Act
      const result = eventSubmissionService.formatSubmissionForDisplay(submission);

      // Assert
      expect(result).toContain('Test Event Format');
      expect(result).toContain('Community Center');
      expect(result).toContain('tournament');
      expect(result).toContain('approved');
      expect(result).toMatch(/12\/25\/2025/); // Date format check
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle concurrent operations gracefully', async () => {
      // Arrange
      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(vueFireAuthService.currentUser).value = mockUser;
      vi.mocked(addDoc)
        .mockResolvedValueOnce({ id: 'submission1' } as any)
        .mockResolvedValueOnce({ id: 'submission2' } as any)
        .mockResolvedValueOnce({ id: 'submission3' } as any);
      vi.mocked(collection).mockReturnValue({} as any);

      // Act
      const promises = [
        eventSubmissionService.createSubmission({ ...mockSubmissionData, title: 'Event 1' }),
        eventSubmissionService.createSubmission({ ...mockSubmissionData, title: 'Event 2' }),
        eventSubmissionService.createSubmission({ ...mockSubmissionData, title: 'Event 3' }),
      ];
      const results = await Promise.all(promises);

      // Assert
      expect(results).toEqual(['submission1', 'submission2', 'submission3']);
      expect(addDoc).toHaveBeenCalledTimes(3);
    });

    it('should handle empty submission data fields', async () => {
      // Arrange
      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(vueFireAuthService.currentUser).value = mockUser;
      vi.mocked(addDoc).mockResolvedValue({ id: 'submission123' } as any);
      vi.mocked(collection).mockReturnValue({} as any);

      const minimalData: CreateEventSubmissionData = {
        title: 'Minimal Event',
        gameId: 'game1',
        startDate: '2025-09-01',
        startTime: '19:00',
        endDate: '2025-09-01',
        endTime: '22:00',
        location: 'Test Location',
        description: '',
        minPlayers: 1,
        maxPlayers: 10,
        eventType: 'game_night',
      };

      // Act
      const result = await eventSubmissionService.createSubmission(minimalData);

      // Assert
      expect(result).toBe('submission123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          description: '',
        }),
      );
    });

    it('should handle submissions without gameId for notifications', async () => {
      // Arrange
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const submissionWithoutGameId = { ...mockSubmission, gameId: undefined };
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ ...submissionWithoutGameId, id: undefined }),
        id: 'submission123',
      };
      const mockCalendarEvent: CalendarEvent = {
        id: 'calendar123',
        summary: 'Test Event',
        start: { dateTime: '2025-01-01T10:00:00.000Z' },
        end: { dateTime: '2025-01-01T12:00:00.000Z' },
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(googleCalendarService.createEvent).mockResolvedValue(mockCalendarEvent);
      vi.mocked(vueFireAuthService.currentUser).value = mockAdminUser;

      // Act
      const result = await eventSubmissionService.approveAndPublish('submission123');

      // Assert
      expect(result).toBe('calendar123');
      expect(gameEventNotificationService.notifyUsersAboutGameEvent).not.toHaveBeenCalled();
    });
  });
});
