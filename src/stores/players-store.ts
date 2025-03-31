import { defineStore } from 'pinia';
import playersData from 'src/assets/data/players.json';
import { Player } from 'src/models/Player';

export const usePlayersStore = defineStore('players', {
  state: () => ({
    players: [] as Player[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getPlayerById: (state) => (id: number) => {
      return state.players.find((player) => player.id === id);
    },

    // Add new getter to retrieve multiple players by their IDs
    getPlayersByIds: (state) => (ids: number[]) => {
      return state.players.filter((player) => ids.includes(player.id));
    },
  },

  actions: {
    async fetchPlayers() {
      this.loading = true;
      this.error = null;

      try {
        // Simulate API request
        await Promise.resolve();
        this.players = Player.fromJSON(playersData);
      } catch (error) {
        this.error = (error as Error).message;
        console.error('Error fetching players:', error);
      } finally {
        this.loading = false;
      }
    },
  },
});
