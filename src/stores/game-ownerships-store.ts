import { defineStore } from 'pinia';
import { ref } from 'vue';
import { GameOwnershipService } from 'src/services/game-ownership-service';
import type { Timestamp } from 'firebase/firestore';

type GameOwnershipData = {
  gameId: string;
  playerId: string;
  canBring: boolean;
  notes?: string;
  addedAt: Timestamp;
  updatedAt?: Timestamp;
};

type GameOwnershipWithId = GameOwnershipData & { id: string };

export const useGameOwnershipsStore = defineStore('gameOwnerships', () => {
  const ownerships = ref<GameOwnershipWithId[]>([]);
  const loading = ref(false);

  const ownsGame = (gameId: string): boolean => {
    return ownerships.value.some((o) => o.gameId === gameId);
  };

  const canBringGame = (gameId: string): boolean => {
    const ownership = ownerships.value.find((o) => o.gameId === gameId);
    return ownership?.canBring || false;
  };

  const getOwnership = (gameId: string) => {
    return ownerships.value.find((o) => o.gameId === gameId);
  };

  const subscribeToPlayerOwnerships = (playerId: string) => {
    return GameOwnershipService.subscribeToPlayerOwnerships(
      playerId,
      (data: GameOwnershipWithId[]) => {
        ownerships.value = data;
      },
    );
  };

  const addOwnership = async (
    gameId: string,
    playerId: string,
    canBring = true,
    notes?: string,
  ) => {
    loading.value = true;
    try {
      await GameOwnershipService.addOwnership(gameId, playerId, canBring, notes);
    } finally {
      loading.value = false;
    }
  };

  const updateOwnership = async (
    ownershipId: string,
    updates: { canBring?: boolean; notes?: string },
  ) => {
    loading.value = true;
    try {
      await GameOwnershipService.updateOwnership(ownershipId, updates);
    } finally {
      loading.value = false;
    }
  };

  const removeOwnership = async (ownershipId: string) => {
    loading.value = true;
    try {
      await GameOwnershipService.removeOwnership(ownershipId);
    } finally {
      loading.value = false;
    }
  };

  return {
    ownerships,
    loading,
    ownsGame,
    canBringGame,
    getOwnership,
    subscribeToPlayerOwnerships,
    addOwnership,
    updateOwnership,
    removeOwnership,
  };
});
