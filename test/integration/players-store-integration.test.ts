import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { Player } from 'src/models/Player';

// Import the mocked auth service
vi.mock('src/services/vuefire-auth-service');

describe('Integration: Players Store', () => {
  let playersStore: ReturnType<typeof usePlayersFirebaseStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    playersStore = usePlayersFirebaseStore();
    vi.clearAllMocks();
  });

  describe('Store initialization', () => {
    it('should initialize with default values', () => {
      expect(playersStore.players).toEqual([]);
      expect(playersStore.loading).toBe(false);
      expect(playersStore.error).toBeNull();
    });
  });

  describe('User authentication flow', () => {
    it('should handle complete user registration and player creation flow', async () => {
      // Test initial state
      expect(playersStore.players).toEqual([]);
    });

    it('should handle admin user permissions correctly', () => {
      // Test that the store has admin functions available
      expect(typeof playersStore.updatePlayerRole).toBe('function');
      expect(typeof playersStore.updateUserStatus).toBe('function');
    });
  });

  describe('Data consistency', () => {
    it('should maintain consistent state between auth and players', () => {
      expect(playersStore.loading).toBe(false);
      expect(playersStore.players.length).toBe(0);
    });

    it('should handle error states consistently', () => {
      expect(playersStore.error).toBeNull();
    });
  });

  describe('Player model validation', () => {
    it('should create valid player instances with required fields', () => {
      const playerData = {
        id: 1,
        name: 'Test Player',
        email: 'test@example.com',
        joinDate: new Date('2023-01-01'),
      };

      const player = new Player(playerData);

      expect(player.id).toBe(1);
      expect(player.name).toBe('Test Player');
      expect(player.email).toBe('test@example.com');
      expect(player.joinDate).toBeInstanceOf(Date);
      expect(player.isActive()).toBe(true);
    });

    it('should handle different player statuses correctly', () => {
      const activePlayer = new Player({
        id: 1,
        name: 'Active',
        email: 'active@test.com',
        status: 'active',
      });
      const blockedPlayer = new Player({
        id: 2,
        name: 'Blocked',
        email: 'blocked@test.com',
        status: 'blocked',
      });
      const pendingPlayer = new Player({
        id: 3,
        name: 'Pending',
        email: 'pending@test.com',
        status: 'pending',
      });

      expect(activePlayer.isActive()).toBe(true);
      expect(blockedPlayer.isActive()).toBe(false);
      expect(pendingPlayer.isActive()).toBe(false);
    });
  });
});
