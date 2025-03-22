<script setup lang="ts">
import { computed } from 'vue';
import games from 'src/assets/data/games.json';
import type { Event } from 'src/models/Event';

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
  <q-card class="event-card " flat dark>
    <q-card-section class="q-pb-xs">
      <div class="row items-center justify-between">
        <div class="text-h6 text-primary ">{{ event.title }}</div>
        <q-badge :color="statusColor">{{ event.status }}</q-badge>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none q-pb-xs text-grey-5 row">
      <div class="col text-body2 text-grey ">
        {{ event.description }}
      </div>
      <div class="col">
        <div class="row items-center">
          <q-icon name="mdi-calendar" size="sm" class="q-mr-xs" />
          <span>{{ formattedDate }}</span>
        </div>
        <div class="row items-center">
          <q-icon name="mdi-clock-outline" size="sm" class="q-mr-xs" />
          <span>{{ event.time }}</span>
        </div>
        <div class="row items-center">
          <q-icon name="mdi-account-group" size="sm" class="q-mr-xs" />
          <span>{{ event.currentPlayers }} / {{ event.maxPlayers }} players</span>
        </div>
        <div class="row items-center" v-if="gameTitle">
          <q-icon name="mdi-dice-multiple" size="sm" class="q-mr-xs" />
          <span>{{ gameTitle }}</span>
        </div>
      </div>
    </q-card-section>

    <q-card-actions>
      <q-btn flat label="Details" />
      <q-btn flat :disabled="isEventFull" label="RSVP" />
    </q-card-actions>
  </q-card>
</template>
