<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import games from 'src/assets/data/games.json';
import GameCard from 'src/components/GameCard.vue';
import type { Game } from 'src/models/Game';

const route = useRoute();
const gameId = computed(() => {
  const idParam = route.params.id;
  // Get the first segment of the path as the ID
  return Array.isArray(idParam) ? idParam[0] : idParam;
});

const game = computed(() => {
  // Find the game that matches the ID from the URL
  return games.find(g => g.id.toString() === gameId.value) as Game | undefined;
});
</script>

<template>

  <div class="q-pa-md flex justify-start" v-if="game">
    <game-card :game="game" />
  </div>

  <div class="q-pa-md text-center" v-else>
    <p class="text-negative">{{ $t('game.notFound', 'Game not found') }}</p>
    <q-btn to="/games" color="primary" icon="mdi-arrow-left" :label="$t('back', 'Back to Games')" />
  </div>
</template>
