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
    getPlayerById: (state) => {
      return (id: number) => state.players.find((player) => player.id === id);
    },

    getPlayersByIds: (state) => {
      return (ids: number[]) =>
        ids
          .map((id) => state.players.find((player) => player.id === id))
          .filter((player): player is Player => player !== undefined);
    },
  },

  actions: {
    async fetchPlayers() {
      this.loading = true;
      this.error = null;

      try {
        // Simulate API call
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
