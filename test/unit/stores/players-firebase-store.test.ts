import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { Player } from 'src/models/Player';

// Mock the Firebase auth service
vi.mock('src/services/auth-service', () => ({
  authService: {
    currentUser: { value: { uid: 'test-user-id', email: 'test@example.com' } },
    getCurrentUser: vi.fn(() => ({ uid: 'test-user-id' })),
    isAuthenticated: vi.fn(() => true),
  },
}));

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('src/boot/firebase', () => ({
  db: {},
  auth: {},
}));

describe('Players Firebase Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const store = usePlayersFirebaseStore();

      expect(store.players).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.userRoles.size).toBe(0);
      expect(store.userStatuses.size).toBe(0);
    });
  });

  describe('getters', () => {
    it('should have getPlayerById function', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.getPlayerById).toBe('function');
    });

    it('should have getPlayersByIds function', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.getPlayersByIds).toBe('function');
    });

    it('should have getPlayerByFirebaseId function', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.getPlayerByFirebaseId).toBe('function');
    });

    it('should have isCurrentUserAdmin computed property', () => {
      const store = usePlayersFirebaseStore();
      // Without proper admin roles, should return false (security fix)
      expect(store.isCurrentUserAdmin).toBe(false);
    });
  });

  describe('actions', () => {
    it('should have fetchAllPlayers method', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.fetchAllPlayers).toBe('function');
    });

    it('should have searchPlayers method', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.searchPlayers).toBe('function');
    });

    it('should have subscribeToPlayerUpdates method', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.subscribeToPlayerUpdates).toBe('function');
    });

    it('should have initializeAdminData method', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.initializeAdminData).toBe('function');
    });
  });

  describe('admin actions', () => {
    it('should have updatePlayerRole method', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.updatePlayerRole).toBe('function');
    });

    it('should have updateUserStatus method', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.updateUserStatus).toBe('function');
    });

    it('should have deleteUser method', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.deleteUser).toBe('function');
    });
  });

  describe('user role and status utilities', () => {
    it('should have getUserRole method', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.getUserRole).toBe('function');
    });

    it('should have getUserStatus method', () => {
      const store = usePlayersFirebaseStore();
      expect(typeof store.getUserStatus).toBe('function');
    });

    it('should have getCurrentUserPermissions computed', () => {
      const store = usePlayersFirebaseStore();
      const permissions = store.getCurrentUserPermissions;

      expect(permissions).toBeDefined();
      expect(permissions?.uid).toBe('test-user-id');
      expect(permissions?.email).toBe('test@example.com');
    });
  });
});
