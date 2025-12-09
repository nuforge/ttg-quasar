import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { eventSubmissionService } from 'src/services/event-submission-service';
import { vueFireAuthService } from 'src/services/vuefire-auth-service';
import { googleCalendarService } from 'src/services/google-calendar-service';
import { gameEventNotificationService } from 'src/services/game-event-notification-service';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { Timestamp } from 'firebase/firestore';
import type { CreateEventSubmissionData, EventSubmission } from 'src/models/EventSubmission';
import type { FirebaseGame } from 'src/models/Game';
import type { User } from 'firebase/auth';

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
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
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

  const mockSubmissionData: CreateEventSubmissionData = {
    title: 'Test Event',
    gameId: 'game1',
    startDate: '2025-09-01',
    startTime: '19:00',
    endDate: '2025-09-01',
    endTime: '22:00',
    location: 'Test Location',
    description: 'Test description',
    minPlayers: 2,
    maxPlayers: 6,
    eventType: 'game_night',
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

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      vi.mocked(vueFireAuthService.currentUser).value = null;

      // Act & Assert
      await expect(eventSubmissionService.createSubmission(mockSubmissionData)).rejects.toThrow(
        'User must be authenticated to submit events',
      );
    });
  });

  describe('onSubmissionsChange', () => {
    it('should set up listener for submissions', async () => {
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
    });
  });
});
