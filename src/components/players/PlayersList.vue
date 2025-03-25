<script setup lang="ts">
import type { Player } from 'src/models/Player';
import PlayerAvatar from 'src/components/PlayerAvatar.vue';

defineOptions({
  name: 'PlayersList',
});

defineProps({
  players: {
    type: Array as () => Player[],
    required: true
  }
});
</script>

<template>
  <q-list>
    <q-item v-for="player in players" :key="player.id">
      <q-item-section avatar>
        <PlayerAvatar :player="player" size="40px" />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ player.name }}</q-item-label>
        <q-item-label caption>{{ player.email }}</q-item-label>
      </q-item-section>
    </q-item>

    <q-item v-if="players.length === 0">
      <q-item-section>
        <q-item-label>No players registered yet.</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>
