<script setup lang="ts">
import games from 'src/assets/data/games.json';
import GameCard from 'src/components/GameCard.vue';

import type { Game } from 'src/models/Game';

</script>

<template>
  <div class="text-h6 text-uppercase"><q-icon name="mdi-book multiple" /> {{ $t('game', 2) }}</div>
  <div class="games-grid">
    <game-card v-for="game in games" :key="game.title" :game="(game as Game)" />
  </div>
</template>

<style scoped>
.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;

}
</style>
