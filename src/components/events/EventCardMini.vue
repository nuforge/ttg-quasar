<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { Event } from 'src/models/Event';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import EventQRCode from 'src/components/qrcode/EventQRCode.vue';
import EventRSVPButtons from './EventRSVPButtons.vue';
import { createEventUrl, createGameUrl } from 'src/utils/slug';

defineOptions({
  name: 'EventCard',
});

const props = defineProps({
  event: {
    type: Object as () => Event,
    required: true
  }
});

// QR code state
const showQRCode = ref(false);

// Players store
const playersStore = usePlayersFirebaseStore();
const gamesStore = useGamesFirebaseStore();

// Fetch data on mount
onMounted(async () => {
  if (playersStore.players.length === 0) {
    await playersStore.fetchAllPlayers();
  }
  if (gamesStore.games.length === 0) {
    await gamesStore.loadGames();
  }
});

// Toggle QR code dialog visibility
const toggleQR = () => {
  showQRCode.value = !showQRCode.value;
};

const formattedDate = computed(() => {
  return props.event.getFormattedDate();
});

// Add playerStatus computed property
const playerStatus = computed(() => {
  const currentPlayers = props.event.getConfirmedCount();
  const maxPlayers = props.event.maxPlayers;

  // Simple check based on event capacity, not game requirements
  if (currentPlayers === 0) {
    return 'needsMore'; // Empty event
  } else if (currentPlayers < maxPlayers) {
    return 'needsMore'; // Not full yet
  } else if (currentPlayers === maxPlayers) {
    return 'optimal'; // Full capacity
  } else {
    return 'tooMany'; // Should not happen normally
  }
});

// Replace gameTitle with full game object
const game = computed(() => {
  return gamesStore.games.find(g => g.legacyId === props.event.gameId) || null;
});

// Simple time formatter that converts 24h to 12h format
const formatTo12Hour = (timeStr: string): string => {
  if (!timeStr) return '';

  const [hours = '0', minutes = '00'] = timeStr.split(':');
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

// Add computed property for badge color
const statusColor = computed(() => {
  switch (playerStatus.value) {
    case 'needsMore': return 'orange';
    case 'tooMany': return 'red';
    case 'optimal': return 'green';
    default: return 'grey';
  }
});
</script>

<template>
  <q-card class="event-card q-px-none q-mb-sm">
    <q-card-section class="q-py-xs">
      <div class="row items-center justify-between">
        <div class="col">
          <router-link :to="createEventUrl(event.firebaseDocId || event.id.toString(), event.title)"
            class="text-h6 text-primary no-underline">
            {{ event.title }}
          </router-link>
        </div>
        <div class="col-auto">
          <q-badge :color="statusColor">
            {{ event.getConfirmedCount() }}/{{ event.maxPlayers }}
          </q-badge>

        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-py-xs">
      <div class="row items-center justify-between q-gutter-md">

        <!-- Left: Event info (compact) -->
        <div class="col-auto">
          <div class="items-center q-gutter-xs text-body2">
            <div>
              <q-icon name="mdi-calendar" size="xs" /> {{ formattedDate }}
            </div>
            <div class="text-grey-6 text-caption">{{ timeDisplay }}</div>
          </div>
          <div v-if="game" class="row items-center q-gutter-xs q-mt-xs">
            <q-icon name="mdi-dice-multiple" size="xs" />
            <router-link :to="createGameUrl(game.id, game.title)" class="no-underline" @click.stop>{{
              game.title
            }}</router-link>
          </div>
        </div>
        <!-- Right: Action buttons (horizontal) -->
        <div class="" @click.stop>
          <div class="col wrap justify-between q-gutter-xs">
            <EventRSVPButtons :event="event" :show-labels="false" size="md" />
            <q-btn flat dense icon="mdi-qrcode" @click="toggleQR()" size="md" color="grey-6">
              <q-tooltip>Show QR Code</q-tooltip>
            </q-btn>
          </div>
        </div>

      </div>
    </q-card-section>

    <!-- Add the EventQRCode component -->
    <EventQRCode :event="event" v-model:showQR="showQRCode" />
  </q-card>
</template>

<style scoped>
.event-card {
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: var(--q-color-surface);
  color: var(--q-color-on-surface);
}

.event-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.no-underline {
  text-decoration: none;
}
</style>
