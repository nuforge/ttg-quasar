<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { usePlayersStore } from 'src/stores/players-store';
import { useEventsStore } from 'src/stores/events-store';
import type { Player } from 'src/models/Player';
import PlayerCard from 'src/components/players/PlayerCard.vue';
import PlayerDetails from 'src/components/players/PlayerDetails.vue';

// Stores
const playersStore = usePlayersStore();
const eventsStore = useEventsStore();

// State
const loading = ref(true);
const search = ref('');
const selectedPlayer = ref<Player | null>(null);
const showPlayerDetails = ref(false);

// Fetch data
onMounted(async () => {
  if (playersStore.players.length === 0) {
    await playersStore.fetchPlayers();
  }
  if (eventsStore.events.length === 0) {
    await eventsStore.fetchEvents();
  }
  loading.value = false;
});

// Filtered players based on search
const filteredPlayers = computed(() => {
  if (!search.value) return playersStore.players;

  const searchLower = search.value.toLowerCase();
  return playersStore.players.filter(player =>
    player.name.toLowerCase().includes(searchLower) ||
    player.email.toLowerCase().includes(searchLower) ||
    (player.bio && player.bio.toLowerCase().includes(searchLower))
  );
});

// Get events for a specific player
const getPlayerEvents = (player: Player) => {
  return eventsStore.events.filter(event =>
    event.rsvps.some(rsvp =>
      rsvp.playerId === player.id && rsvp.status === 'confirmed'
    )
  );
};

// Show player details
const showDetails = (player: Player) => {
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
    <q-dialog v-model="showPlayerDetails" persistent>
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
