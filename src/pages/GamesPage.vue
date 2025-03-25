<script setup lang="ts">
import gamesData from 'src/assets/data/games.json';
import GameCard from 'src/components/GameCard.vue';
import { ref, computed } from 'vue';
import { Game } from 'src/models/Game';

const searchQuery = ref('');
const games: Game[] = gamesData.map(gameData => Game.fromJSON(gameData));

const filteredGames = computed(() => {
  if (!searchQuery.value) {
    return games;
  }

  const query = searchQuery.value.toLowerCase();
  return games.filter((game) => {
    return game.title.toLowerCase().includes(query) ||
      game.genre.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query) ||
      game.numberOfPlayers.toLowerCase().includes(query) ||
      game.recommendedAge.toLowerCase().includes(query) ||
      game.playTime.toLowerCase().includes(query) ||
      (game.components && game.components.some(component => component.toLowerCase().includes(query)));
  });
});
</script>

<template>
  <div class="text-h6 text-uppercase"><q-icon name="mdi-book-multiple" /> {{ $t('game', 2) }}</div>

  <!-- Search input -->
  <div class="q-mt-md">
    <q-input v-model="searchQuery" outlined dense clearable :placeholder="$t('search games')" class="game-search">
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>
    </q-input>
  </div>
  <div class="games-grid q-mt-sm q-gutter-sm">
    <game-card v-for="game in filteredGames" :key="game.title" :game="game" />
  </div>
</template>

<style scoped>
.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.game-search {
  max-width: 500px;
}
</style>
