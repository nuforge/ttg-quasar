<script setup lang="ts">
import { computed, ref } from 'vue';
import games from 'src/assets/data/games.json';
import type { Event } from 'src/models/Event';
import { useCalendarStore } from 'src/stores/calendar-store';
import EventQRCode from 'src/components/qrcode/EventQRCode.vue';

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

// Toggle QR code dialog visibility
const toggleQR = () => {
  showQRCode.value = !showQRCode.value;
};

// Calendar store for date selection
const calendarStore = useCalendarStore();

const formattedDate = computed(() => {
  return props.event.getFormattedDate();
});

// Add playerStatus computed property
const playerStatus = computed(() => {
  const currentPlayers = props.event.currentPlayers;
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

// Function to handle date click and update calendar
const selectEventDate = () => {
  calendarStore.setSelectedDate(props.event.date);
};
</script>

<template>
  <q-card class="event-card q-px-none q-mb-sm" flat>
    <q-card-section class="text-h6 text-primary q-py-xs">
      {{ event.title }}
    </q-card-section>

    <q-card-section class="row items-center justify-between q-py-xs ">
      <q-list dense>
        <q-item clickable @click="selectEventDate">
          <q-item-section avatar>
            <q-tooltip class="bg-primary text-black">Date: {{ formattedDate }} @ {{ timeDisplay }}</q-tooltip>
            <q-icon name="mdi-calendar" size="xs" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ formattedDate }}</q-item-label>
            <q-item-label caption>{{ timeDisplay }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section avatar>
            <q-icon name="mdi-account-group" :color="statusColor" size="xs">
            </q-icon>
            <q-tooltip class="bg-primary text-black">
              Players: {{ event.currentPlayers }} / {{ event.maxPlayers }}
            </q-tooltip>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ event.currentPlayers }} / {{ event.maxPlayers }} {{ $t('player', 2) }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="game" :to="`/games/${game.id}`" clickable>
          <q-item-section avatar>
            <q-tooltip class="bg-primary text-black">Game: {{ game.title }}</q-tooltip>
            <q-icon name="mdi-dice-multiple" size="xs" />
          </q-item-section>
          <q-item-section>{{ game.title }}</q-item-section>
        </q-item>
      </q-list>
      <q-card-actions vertical class="q-pa-none text-grey-8">
        <q-btn flat :disabled="isEventFull" icon="mdi-calendar-check" />
        <q-btn flat icon="mdi-qrcode" @click="toggleQR()" size="md" />
      </q-card-actions>
    </q-card-section>

    <!-- Add the EventQRCode component -->
    <EventQRCode :event="event" v-model:showQR="showQRCode" />
  </q-card>
</template>
