import { describe, it, expect, vi } from 'vitest';
import {
  GameSubmission,
  type GameSubmissionData,
  type FirebaseGameSubmission,
} from 'src/models/GameSubmission';

// Mock Firebase Timestamp
vi.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    })),
    now: vi.fn(() => ({
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
    })),
  },
}));

const { Timestamp } = await import('firebase/firestore');

describe('GameSubmission', () => {
  const mockSubmissionData: GameSubmissionData = {
    title: 'Test Board Game',
    genre: 'Strategy',
    numberOfPlayers: '2-4',
    recommendedAge: '12+',
    playTime: '60-90 minutes',
    components: ['Board', 'Cards', 'Tokens'],
    description: 'A strategic board game for testing',
    releaseYear: 2023,
    image: 'test-game.jpg',
    link: 'https://example.com/game',
    tags: ['strategy', 'competitive'],
    difficulty: 'medium',
    publisher: 'Test Publisher',
  };

  const mockSubmittedBy = {
    userId: 'user123',
    userName: 'Test User',
    userEmail: 'test@example.com',
  };

  const mockDate = new Date('2025-01-15T10:00:00Z');

  describe('Constructor', () => {
    it('should create GameSubmission with all required fields', () => {
      const submission = new GameSubmission(
        'sub123',
        mockSubmissionData,
        mockSubmittedBy,
        'pending',
        mockDate,
      );

      expect(submission.id).toBe('sub123');
      expect(submission.title).toBe('Test Board Game');
      expect(submission.genre).toBe('Strategy');
      expect(submission.numberOfPlayers).toBe('2-4');
      expect(submission.recommendedAge).toBe('12+');
      expect(submission.playTime).toBe('60-90 minutes');
      expect(submission.components).toEqual(['Board', 'Cards', 'Tokens']);
      expect(submission.description).toBe('A strategic board game for testing');
      expect(submission.submittedBy).toEqual(mockSubmittedBy);
      expect(submission.status).toBe('pending');
      expect(submission.submittedAt).toEqual(mockDate);
    });

    it('should create GameSubmission with optional fields', () => {
      const submission = new GameSubmission(
        'sub123',
        mockSubmissionData,
        mockSubmittedBy,
        'pending',
        mockDate,
      );

      expect(submission.releaseYear).toBe(2023);
      expect(submission.image).toBe('test-game.jpg');
      expect(submission.link).toBe('https://example.com/game');
      expect(submission.tags).toEqual(['strategy', 'competitive']);
      expect(submission.difficulty).toBe('medium');
      expect(submission.publisher).toBe('Test Publisher');
    });

    it('should create GameSubmission with minimal data', () => {
      const minimalData: GameSubmissionData = {
        title: 'Minimal Game',
        genre: 'Card Game',
        numberOfPlayers: '2',
        recommendedAge: '8+',
        playTime: '30 min',
        components: ['Cards'],
        description: 'Minimal description',
      };

      const submission = new GameSubmission(
        'sub456',
        minimalData,
        mockSubmittedBy,
        'pending',
        mockDate,
      );

      expect(submission.title).toBe('Minimal Game');
      expect(submission.releaseYear).toBeUndefined();
      expect(submission.image).toBeUndefined();
      expect(submission.link).toBeUndefined();
      expect(submission.tags).toBeUndefined();
      expect(submission.difficulty).toBeUndefined();
      expect(submission.publisher).toBeUndefined();
    });

    it('should create GameSubmission with review data', () => {
      const reviewDate = new Date('2025-01-20T15:30:00Z');
      const submission = new GameSubmission(
        'sub789',
        mockSubmissionData,
        mockSubmittedBy,
        'approved',
        mockDate,
        reviewDate,
        'admin123',
        'Looks good!',
        'game456',
      );

      expect(submission.status).toBe('approved');
      expect(submission.reviewedAt).toEqual(reviewDate);
      expect(submission.reviewedBy).toBe('admin123');
      expect(submission.reviewNotes).toBe('Looks good!');
      expect(submission.gameId).toBe('game456');
    });
  });

  describe('fromFirebase static method', () => {
    it('should create GameSubmission from Firebase data', () => {
      const firebaseData: FirebaseGameSubmission = {
        ...mockSubmissionData,
        submittedBy: mockSubmittedBy,
        status: 'pending',
        submittedAt: Timestamp.fromDate(mockDate),
      };

      const submission = GameSubmission.fromFirebase('fb123', firebaseData);

      expect(submission.id).toBe('fb123');
      expect(submission.title).toBe('Test Board Game');
      expect(submission.submittedBy).toEqual(mockSubmittedBy);
      expect(submission.status).toBe('pending');
      expect(submission.submittedAt).toEqual(mockDate);
    });

    it('should create GameSubmission from Firebase data with review info', () => {
      const reviewDate = new Date('2025-01-20T15:30:00Z');
      const firebaseData: FirebaseGameSubmission = {
        ...mockSubmissionData,
        submittedBy: mockSubmittedBy,
        status: 'approved',
        submittedAt: Timestamp.fromDate(mockDate),
        reviewedAt: Timestamp.fromDate(reviewDate),
        reviewedBy: 'admin123',
        reviewNotes: 'Approved!',
        gameId: 'game789',
      };

      const submission = GameSubmission.fromFirebase('fb456', firebaseData);

      expect(submission.reviewedAt).toEqual(reviewDate);
      expect(submission.reviewedBy).toBe('admin123');
      expect(submission.reviewNotes).toBe('Approved!');
      expect(submission.gameId).toBe('game789');
    });
  });

  describe('toFirebase method', () => {
    it('should convert GameSubmission to Firebase format', () => {
      const submission = new GameSubmission(
        'sub123',
        mockSubmissionData,
        mockSubmittedBy,
        'pending',
        mockDate,
      );

      const firebaseData = submission.toFirebase();

      expect(firebaseData.title).toBe('Test Board Game');
      expect(firebaseData.genre).toBe('Strategy');
      expect(firebaseData.submittedBy).toEqual(mockSubmittedBy);
      expect(firebaseData.status).toBe('pending');
      expect(firebaseData.submittedAt).toEqual(mockDate);
      expect(firebaseData.releaseYear).toBe(2023);
      expect(firebaseData.image).toBe('test-game.jpg');
    });

    it('should convert GameSubmission with review data to Firebase format', () => {
      const reviewDate = new Date('2025-01-20T15:30:00Z');
      const submission = new GameSubmission(
        'sub123',
        mockSubmissionData,
        mockSubmittedBy,
        'approved',
        mockDate,
        reviewDate,
        'admin123',
        'Great game!',
        'game456',
      );

      const firebaseData = submission.toFirebase();

      expect(firebaseData.reviewedAt).toEqual(reviewDate);
      expect(firebaseData.reviewedBy).toBe('admin123');
      expect(firebaseData.reviewNotes).toBe('Great game!');
      expect(firebaseData.gameId).toBe('game456');
    });

    it('should exclude undefined optional fields from Firebase format', () => {
      const minimalData: GameSubmissionData = {
        title: 'Minimal Game',
        genre: 'Card Game',
        numberOfPlayers: '2',
        recommendedAge: '8+',
        playTime: '30 min',
        components: ['Cards'],
        description: 'Minimal description',
      };

      const submission = new GameSubmission(
        'sub456',
        minimalData,
        mockSubmittedBy,
        'pending',
        mockDate,
      );

      const firebaseData = submission.toFirebase();

      expect('releaseYear' in firebaseData).toBe(false);
      expect('image' in firebaseData).toBe(false);
      expect('link' in firebaseData).toBe(false);
      expect('tags' in firebaseData).toBe(false);
      expect('difficulty' in firebaseData).toBe(false);
      expect('publisher' in firebaseData).toBe(false);
    });
  });

  describe('toGameData method', () => {
    it('should convert to GameData format', () => {
      const submission = new GameSubmission(
        'sub123',
        mockSubmissionData,
        mockSubmittedBy,
        'pending',
        mockDate,
      );

      const gameData = submission.toGameData();

      expect(gameData.title).toBe('Test Board Game');
      expect(gameData.genre).toBe('Strategy');
      expect(gameData.numberOfPlayers).toBe('2-4');
      expect(gameData.recommendedAge).toBe('12+');
      expect(gameData.playTime).toBe('60-90 minutes');
      expect(gameData.components).toEqual(['Board', 'Cards', 'Tokens']);
      expect(gameData.description).toBe('A strategic board game for testing');
      expect(gameData.releaseYear).toBe(2023);
      expect(gameData.image).toBe('test-game.jpg');
      expect(gameData.link).toBe('https://example.com/game');
      expect(gameData.tags).toEqual(['strategy', 'competitive']);
      expect(gameData.difficulty).toBe('medium');
      expect(gameData.publisher).toBe('Test Publisher');
    });

    it('should convert minimal submission to GameData format', () => {
      const minimalData: GameSubmissionData = {
        title: 'Minimal Game',
        genre: 'Card Game',
        numberOfPlayers: '2',
        recommendedAge: '8+',
        playTime: '30 min',
        components: ['Cards'],
        description: 'Minimal description',
      };

      const submission = new GameSubmission(
        'sub456',
        minimalData,
        mockSubmittedBy,
        'pending',
        mockDate,
      );

      const gameData = submission.toGameData();

      expect(gameData.title).toBe('Minimal Game');
      expect(gameData.releaseYear).toBeUndefined();
      expect(gameData.image).toBeUndefined();
      expect(gameData.link).toBeUndefined();
      expect(gameData.tags).toBeUndefined();
      expect(gameData.difficulty).toBeUndefined();
      expect(gameData.publisher).toBeUndefined();
    });
  });

  describe('status handling', () => {
    it('should handle pending status', () => {
      const submission = new GameSubmission(
        'sub123',
        mockSubmissionData,
        mockSubmittedBy,
        'pending',
        mockDate,
      );

      expect(submission.status).toBe('pending');
      expect(submission.reviewedAt).toBeUndefined();
      expect(submission.reviewedBy).toBeUndefined();
      expect(submission.reviewNotes).toBeUndefined();
    });

    it('should handle approved status', () => {
      const reviewDate = new Date('2025-01-20T15:30:00Z');
      const submission = new GameSubmission(
        'sub123',
        mockSubmissionData,
        mockSubmittedBy,
        'approved',
        mockDate,
        reviewDate,
        'admin123',
        'Approved for publication',
        'game456',
      );

      expect(submission.status).toBe('approved');
      expect(submission.reviewedAt).toEqual(reviewDate);
      expect(submission.reviewedBy).toBe('admin123');
      expect(submission.reviewNotes).toBe('Approved for publication');
      expect(submission.gameId).toBe('game456');
    });

    it('should handle rejected status', () => {
      const reviewDate = new Date('2025-01-20T15:30:00Z');
      const submission = new GameSubmission(
        'sub123',
        mockSubmissionData,
        mockSubmittedBy,
        'rejected',
        mockDate,
        reviewDate,
        'admin123',
        'Needs more details',
      );

      expect(submission.status).toBe('rejected');
      expect(submission.reviewedAt).toEqual(reviewDate);
      expect(submission.reviewedBy).toBe('admin123');
      expect(submission.reviewNotes).toBe('Needs more details');
      expect(submission.gameId).toBeUndefined();
    });
  });
});
