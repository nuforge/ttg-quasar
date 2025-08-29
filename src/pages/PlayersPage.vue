<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import PlayerCard from 'src/components/players/PlayerCard.vue';
import PlayerDetails from 'src/components/players/PlayerDetails.vue';

// Type for readonly player objects from the store with additional Firebase fields
type ReadonlyPlayerWithFirebase = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly avatar?: string | undefined;
  readonly joinDate: Date;
  readonly bio?: string | undefined;
  readonly preferences?: {
    readonly favoriteGames?: readonly number[];
    readonly preferredGenres?: readonly string[];
  } | undefined;
  readonly firebaseId?: string | undefined;
  readonly role?: readonly string[] | undefined;
  readonly status?: 'active' | 'blocked' | 'pending' | undefined;
  readonly isActive?: () => boolean;
};

// Stores
const playersFirebaseStore = usePlayersFirebaseStore();
const eventsStore = useEventsFirebaseStore();

// State
const loading = ref(true);
const search = ref('');
const selectedPlayer = ref<ReadonlyPlayerWithFirebase | null>(null);
const showPlayerDetails = ref(false);

// Fetch data
onMounted(async () => {
  // Use Firebase data
  if (playersFirebaseStore.players.length === 0) {
    await playersFirebaseStore.fetchAllPlayers();
  }

  // Subscribe to events
  eventsStore.subscribeToEvents();

  loading.value = false;
});

// Get current players list from Firebase store
const currentPlayers = computed(() => {
  return playersFirebaseStore.players;
});

// Filtered players based on search
const filteredPlayers = computed(() => {
  if (!search.value) return currentPlayers.value;

  const searchLower = search.value.toLowerCase();
  // Using ReadonlyPlayerWithFirebase type for proper typing of store objects
  return currentPlayers.value.filter((player: ReadonlyPlayerWithFirebase) =>
    player.name?.toLowerCase().includes(searchLower) ||
    player.email?.toLowerCase().includes(searchLower) ||
    (player.bio && player.bio.toLowerCase().includes(searchLower))
  );
});

// Get events for a specific player - using proper typing
const getPlayerEvents = (player: ReadonlyPlayerWithFirebase) => {
  return eventsStore.events.filter(event =>
    event.rsvps.some(rsvp =>
      rsvp.playerId === player.id && rsvp.status === 'confirmed'
    )
  );
};

// Handle showing player details - using proper typing
const showDetails = (player: ReadonlyPlayerWithFirebase) => {
  selectedPlayer.value = player;
  showPlayerDetails.value = true;
};
</script>

<template>
  <div>
    <div class="text-h6 text-uppercase"><q-icon name="mdi-account-group" /> {{ $t('player', 2) }}</div>

    <!-- Loading state -->
    <div v-if="loading" class="q-pa-md text-center">
      <q-spinner color="primary" size="3em" />
      <div class="q-mt-sm">Loading players...</div>
    </div>

    <!-- Player search -->
    <div v-else class="q-mt-md">
      <q-input v-model="search" debounce="300" outlined dense clearable placeholder="Search players">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>

      <!-- Players grid -->
      <div class="row q-col-gutter-md q-mt-md">
        <div v-for="player in filteredPlayers" :key="player.id" class="col-xs-12 col-sm-6 col-md-4 col-lg-3">
          <PlayerCard :player="player" :player-events="getPlayerEvents(player)" @show-details="showDetails" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredPlayers.length === 0" class="text-center q-pa-lg">
        <q-icon name="sentiment_dissatisfied" size="3rem" color="grey-7" />
        <p class="text-grey-7 q-mt-sm">No players found matching your search.</p>
      </div>
    </div>

    <!-- Player details dialog -->
    <q-dialog v-model="showPlayerDetails" persistent backdrop-filter="blur(4px) saturate(150%)">
      <PlayerDetails v-if="selectedPlayer" :player="selectedPlayer" :player-events="getPlayerEvents(selectedPlayer)">
        <template v-slot:actions>
          <q-btn flat label="Close" color="primary" v-close-popup />
        </template>
      </PlayerDetails>
    </q-dialog>
  </div>
</template>

<style scoped>
/* Styles moved to PlayerCard component */
</style>
