<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import games from 'src/assets/data/games.json';
import type { Event } from 'src/models/Event';
import { usePlayersStore } from 'src/stores/players-store';
import type { Player } from 'src/models/Player';
import GameIcon from '../GameIcon.vue';
import PlayerListDialog from 'src/components/players/PlayerListDialog.vue';

defineOptions({
  name: 'EventCard',
});

const props = defineProps({
  event: {
    type: Object as () => Event,
    required: true
  }
});

// Players store and dialog
const playersStore = usePlayersStore();
const showPlayersDialog = ref(false);
const attendingPlayers = ref<Player[]>([]);

// Fetch players on mount
onMounted(async () => {
  if (playersStore.players.length === 0) {
    await playersStore.fetchPlayers();
  }
});

// Get players for this event
const getEventPlayers = () => {
  const playerIds = props.event.getPlayerIds();
  attendingPlayers.value = playersStore.getPlayersByIds(playerIds);
  showPlayersDialog.value = true;
};

const formattedDate = computed(() => {
  return props.event.getFormattedDate();
});

const statusColor = computed(() => {
  return props.event.status === 'upcoming' ? 'green' : 'grey';
});

const isEventFull = computed(() => {
  return props.event.isFull();
});

// Replace gameTitle with full game object
const game = computed(() => {
  return games.find(g => g.id === props.event.gameId) || null;
});

// Simple time formatter that converts 24h to 12h format
const formatTo12Hour = (timeStr: string): string => {
  if (!timeStr) return '';

  const [hours, minutes] = timeStr.split(':');
  if (!hours || !minutes) return '';

  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return minutes === '00' ? `${hour12}${ampm}` : `${hour12}:${minutes}${ampm}`;
};

const timeDisplay = computed(() => {
  if (props.event.endTime) {
    return `${formatTo12Hour(props.event.time)} - ${formatTo12Hour(props.event.endTime)}`;
  }
  return formatTo12Hour(props.event.time);
});

// Add mainGameComponents computed property
const mainGameComponents = computed(() => {
  if (!game.value || !game.value.components || !Array.isArray(game.value.components)) return [];
  return game.value.components.slice(0, 3).map(component => {
    return {
      original: component,
      category: component
    };
  });
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

    <!-- Game information icons with tooltips -->
    <div class="col-1" v-if="game">
      <q-list dense class="text-grey-8">
        <q-item>
          <q-tooltip class="bg-primary text-black">Players: {{ game.numberOfPlayers }}</q-tooltip>
          <GameIcon category="players" :value="game.numberOfPlayers" size="xs" class="text-grey-9" />
        </q-item>

        <q-item>
          <q-tooltip class="bg-secondary text-black">Age: {{ game.recommendedAge }}</q-tooltip>
          <span class="font-aldrich text-grey-9 text-bold non-selectable">{{ game.recommendedAge }}</span>
        </q-item>

        <q-item>
          <q-tooltip class="bg-accent text-black">Genre: {{ game.genre }}</q-tooltip>
          <GameIcon category="genres" :value="game.genre" size="xs" class="text-grey-9" />
        </q-item>

        <q-item v-for="(component, index) in mainGameComponents" :key="index">
          <q-tooltip class="bg-info text-black">{{ component.original }}</q-tooltip>
          <GameIcon category="components" :value="component.category" size="xs" class="text-grey-9" />
        </q-item>
      </q-list>
    </div>
    <q-card-section class="text-grey-5 ">
      <div class=" text-body2">
        {{ event.description }}
        <div class="row items-center">
          <q-icon name="mdi-calendar" size="sm" class="q-mr-xs" />
          <span>{{ formattedDate }}</span>
        </div>
        <div class="row items-center">
          <q-icon name="mdi-clock-outline" size="sm" class="q-mr-xs" />
          <span>{{ timeDisplay }}</span>
        </div>
        <div class="row items-center" @click="getEventPlayers" style="cursor: pointer;">
          <q-icon name="mdi-account-group" size="sm" class="q-mr-xs" />
          <span>{{ event.currentPlayers }} / {{ event.maxPlayers }} players</span>
        </div>
        <div class="row items-center" v-if="game">
          <q-icon name="mdi-dice-multiple" size="sm" class="q-mr-xs" />
          <span>{{ game.title }}</span>
        </div>
      </div>
    </q-card-section>

    <q-card-actions>
      <!-- Replace text buttons with icon buttons -->
      <q-btn flat icon="mdi-information-outline" />
      <q-btn flat :disabled="isEventFull" icon="mdi-calendar-check" />
      <q-btn flat icon="mdi-account-group" @click="getEventPlayers" />
    </q-card-actions>

    <!-- Players Dialog - replaced with reusable component -->
    <PlayerListDialog :players="attendingPlayers" v-model:visible="showPlayersDialog" :title="$t('player', 2)" />
  </q-card>
</template>
