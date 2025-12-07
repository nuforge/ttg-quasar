import { defineStore } from 'pinia';
import type { Player } from 'src/models/Player';
import { usePlayersFirebaseStore } from './players-firebase-store';

export const usePlayersStore = defineStore('players', {
  state: () => ({
    players: [] as Player[],
    loading: false,
    error: null as string | null,
    useFirebase: false, // Toggle for Firebase usage
  }),

  getters: {
    getPlayerById: (state) => (id: number) => {
      if (state.useFirebase) {
        const firebaseStore = usePlayersFirebaseStore();
        return firebaseStore.getPlayerById(id);
      }
      return state.players.find((player) => player.id === id);
    },

    // Add new getter to retrieve multiple players by their IDs
    getPlayersByIds: (state) => (ids: number[]) => {
      if (state.useFirebase) {
        const firebaseStore = usePlayersFirebaseStore();
        return firebaseStore.getPlayersByIds(ids);
      }
      return state.players.filter((player) => ids.includes(player.id));
    },

    allPlayers: (state) => {
      if (state.useFirebase) {
        const firebaseStore = usePlayersFirebaseStore();
        return firebaseStore.players;
      }
      return state.players;
    },
  },

  actions: {
    async enableFirebase() {
      this.useFirebase = true;
      const firebaseStore = usePlayersFirebaseStore();
      await firebaseStore.fetchAllPlayers();
    },

    async fetchPlayers() {
      if (this.useFirebase) {
        const firebaseStore = usePlayersFirebaseStore();
        return firebaseStore.fetchAllPlayers();
      }
    },
  },
});
