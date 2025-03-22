<script setup lang="ts">
import games from 'src/assets/data/games.json';

import GameCard from 'src/components/GameCard.vue';

</script>

<template>
  <q-page>
    <div class="text-h6 text-uppercase"><q-icon name="mdi-book multiple" /> {{ $t('game', 2) }}</div>
    <div class="q-pa-md row items-start q-gutter-md">
      <game-card v-for="game in games" :key="game.title" :game="game" />
    </div>
  </q-page>
</template>
