<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { Event } from 'src/models/Event';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { useCalendarStore } from 'src/stores/calendar-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { authService } from 'src/services/auth-service';
import type { Player } from 'src/models/Player';
import GameIcon from '../GameIcon.vue';
import PlayerListDialog from 'src/components/players/PlayerListDialog.vue';
import EventRSVPButtons from './EventRSVPButtons.vue';

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
const playersStore = usePlayersFirebaseStore();
const gamesStore = useGamesFirebaseStore();

const calendarStore = useCalendarStore();
const showPlayersDialog = ref(false);
const attendingPlayers = ref<Player[]>([]);

// Fetch data on mount
onMounted(async () => {
  if (playersStore.players.length === 0) {
    await playersStore.fetchAllPlayers();
  }
  if (gamesStore.games.length === 0) {
    await gamesStore.loadGames();
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

// Current user's RSVP status
const currentUserId = computed(() => authService.currentUserId.value);
const currentUserRSVP = computed(() => {
  if (!currentUserId.value) return null;
  return props.event.getPlayerRSVP(parseInt(currentUserId.value));
});

const isUserConfirmed = computed(() => currentUserRSVP.value?.status === 'confirmed');
const isUserInterested = computed(() => currentUserRSVP.value?.status === 'interested');

// Status badge with RSVP indicator
const statusBadgeColor = computed(() => {
  if (isUserConfirmed.value) return 'green';
  if (isUserInterested.value) return 'orange';
  return statusColor.value;
});

const statusBadgeText = computed(() => {
  if (isUserConfirmed.value) return '✓ Confirmed';
  if (isUserInterested.value) return '♡ Interested';
  return props.event.status;
});

const statusColor = computed(() => {
  return props.event.status === 'upcoming' ? 'green' : 'grey';
});

// Replace gameTitle with full game object
const game = computed(() => {
  return gamesStore.games.find(g => g.legacyId === props.event.gameId) || null;
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


// Function to handle date click and update calendar
const selectEventDate = () => {
  calendarStore.setSelectedDate(props.event.date);
};
</script>

<template>
  <q-card :class="`${isUserConfirmed ? 'border-l-4 border-green' : isUserInterested ? 'border-l-4 border-orange' : ''}`"
    dark>
    <q-card-section class="q-pb-xs">
      <div class="row items-center justify-between">

        <router-link :to="`/events/${event.id}`" class="text-h6 text-uppercase no-underline">{{ event.title
        }}</router-link>
        <q-badge :color="statusBadgeColor"
          :icon="isUserConfirmed ? 'mdi-check' : isUserInterested ? 'mdi-heart' : undefined">
          {{ statusBadgeText }}
        </q-badge>
      </div>
    </q-card-section>
    <q-card-section class="text-grey-5 q-px-md " horizontal>
      <div class=" text-body2">
        {{ event.description }}
        <q-list dense class="q-mt-sm">
          <q-item clickable @click="selectEventDate">
            <q-item-section avatar>
              <q-tooltip class="bg-primary text-black">Date: {{ formattedDate }} @ {{ timeDisplay }}</q-tooltip>
              <q-icon name="mdi-calendar" :color="statusBadgeColor" size="xs" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ formattedDate }}</q-item-label>
              <q-item-label caption>{{ timeDisplay }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable @click="getEventPlayers">
            <q-item-section avatar>
              <q-icon
                :name="isUserConfirmed ? 'mdi-account-check' : isUserInterested ? 'mdi-account-heart' : 'mdi-account-group'"
                :color="statusBadgeColor" size="xs" />
              <q-tooltip class="bg-primary text-black">
                Confirmed: {{ event.getConfirmedCount() }} / {{ event.maxPlayers }}
                <br>Interested: {{ event.getInterestedCount() }}
                <span v-if="isUserConfirmed"><br>✓ You're confirmed!</span>
                <span v-else-if="isUserInterested"><br>♡ You're interested</span>
              </q-tooltip>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ event.getConfirmedCount() }} / {{ event.maxPlayers }} {{ $t('player', 2)
              }}</q-item-label>
              <q-item-label v-if="event.getInterestedCount() > 0" caption class="text-orange">
                +{{ event.getInterestedCount() }} interested
              </q-item-label>
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
      </div>

      <q-card-actions vertical v-if="game">
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
      </q-card-actions>
    </q-card-section>

    <!-- RSVP Actions -->
    <q-card-actions align="center" class="q-pa-md">
      <EventRSVPButtons :event="event" :show-labels="false" size="sm" />
    </q-card-actions>

    <!-- Players Dialog - replaced with reusable component -->
    <PlayerListDialog :players="attendingPlayers" v-model:visible="showPlayersDialog" :title="$t('player', 2)" />
  </q-card>
</template>

<style scoped>
.border-l-4 {
  border-left: 4px solid !important;
}

.border-green {
  border-left-color: #4caf50 !important;
}

.border-orange {
  border-left-color: #ff9800 !important;
}
</style>
