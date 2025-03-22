<script setup lang="ts">
import { computed } from 'vue';
import games from 'src/assets/data/games.json';
import { Event } from 'src/models/Event';

defineOptions({
  name: 'EventCard',
});

const props = defineProps({
  event: {
    type: Object as () => Event,
    required: true
  }
});

const formattedDate = computed(() => {
  return props.event.getFormattedDate();
});

const statusColor = computed(() => {
  return props.event.status === 'upcoming' ? 'green' : 'grey';
});

const isEventFull = computed(() => {
  return props.event.isFull();
});

const gameTitle = computed(() => {
  const game = games.find(g => g.id === props.event.gameId);
  return game ? game.title : null;
});
</script>

<template>
  <q-card class="event-card q-mb-xs" flat>
    <q-card-section class="q-pb-xs">
      <div class="row items-center justify-between">
        <div class="text-h6 ">{{ event.title }}</div>
        <q-badge :color="statusColor">{{ event.status }}</q-badge>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none q-pb-xs">
      <div class="row items-center">
        <q-icon name="mdi-calendar" size="sm" class="q-mr-xs" />
        <span class="text-subtitle2">{{ formattedDate }}</span>
      </div>
      <div class="row items-center">
        <q-icon name="mdi-clock-outline" size="sm" class="q-mr-xs" />
        <span class="text-subtitle2">{{ event.time }}</span>
      </div>
      <div class="row items-center">
        <q-icon name="mdi-account-group" size="sm" class="q-mr-xs" />
        <span class="text-subtitle2">{{ event.currentPlayers }} / {{ event.maxPlayers }} players</span>
      </div>
      <div class="row items-center" v-if="gameTitle">
        <q-icon name="mdi-gamepad-variant" size="sm" class="q-mr-xs" />
        <span class="text-subtitle2">{{ gameTitle }}</span>
      </div>
    </q-card-section>

    <q-card-actions>
      <q-btn flat color="primary" label="Details" />
      <q-btn flat color="primary" :disabled="isEventFull" label="RSVP" />
    </q-card-actions>
  </q-card>
</template>
