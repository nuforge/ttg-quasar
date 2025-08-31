<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import EventCard from 'src/components/events/EventCard.vue';

const eventsStore = useEventsFirebaseStore();
const gamesStore = useGamesFirebaseStore();

// Load games on mount
onMounted(async () => {
  if (gamesStore.games.length === 0) {
    await gamesStore.loadGames();
  }

  // Subscribe to Firebase events
  eventsStore.subscribeToEvents();
});

// Filter and sorting options
const search = ref('');
const selectedGameId = ref(null);
const selectedStatus = ref(null);
const minPlayers = ref(null);
const sortBy = ref('date');
const sortDirection = ref('asc');

// List of statuses for dropdown
const statuses = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
];

// Filter options for game selection
const gameOptions = computed(() => {
  return gamesStore.games.map(game => ({
    label: game.title,
    value: game.legacyId // Use legacyId to match with event.gameId
  }));
});

// Filtered events based on search and filter criteria
const filteredEvents = computed(() => {
  return eventsStore.events.filter((event) => {
    // Text search filter
    if (search.value && !event.title.toLowerCase().includes(search.value.toLowerCase()) &&
      !event.description.toLowerCase().includes(search.value.toLowerCase())) {
      return false;
    }

    // Game filter
    if (selectedGameId.value && event.gameId !== selectedGameId.value) {
      return false;
    }

    // Status filter
    if (selectedStatus.value && event.status !== selectedStatus.value) {
      return false;
    }

    // Min players filter
    if (minPlayers.value && event.maxPlayers < minPlayers.value) {
      return false;
    }

    return true;
  });
});

// Sorted events
const sortedEvents = computed(() => {
  const sorted = [...filteredEvents.value];

  sorted.sort((a, b) => {
    let comparison = 0;

    if (sortBy.value === 'date') {
      comparison = a.getDateObject().getTime() - b.getDateObject().getTime();
    } else if (sortBy.value === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy.value === 'players') {
      comparison = a.currentPlayers - b.currentPlayers;
    }

    return sortDirection.value === 'asc' ? comparison : -comparison;
  });

  return sorted;
});

// Clear all filters
const clearFilters = () => {
  search.value = '';
  selectedGameId.value = null;
  selectedStatus.value = null;
  minPlayers.value = null;
  sortBy.value = 'date';
  sortDirection.value = 'asc';
};
</script>

<template>
  <q-page>
    <div class="text-h6 text-uppercase q-mb-md">
      <q-icon name="mdi-calendar-month" /> {{ $t('event', 2) }}
    </div>

    <!-- Filter Controls -->
    <div class="filter-container q-mb-md">
      <div class="row q-col-gutter-md">
        <!-- Search bar -->
        <div class="col-12 col-md-4">
          <q-input v-model="search" outlined dense placeholder="Search events" clearable>
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Game filter -->
        <div class="col-12 col-md-4">
          <q-select v-model="selectedGameId" :options="gameOptions" outlined dense label="Filter by Game" clearable
            emit-value map-options />
        </div>

        <!-- Status filter -->
        <div class="col-12 col-md-4">
          <q-select v-model="selectedStatus" :options="statuses" outlined dense label="Filter by Status" clearable
            emit-value map-options />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mt-sm">
        <!-- Min players filter -->
        <div class="col-12 col-md-4">
          <q-input v-model.number="minPlayers" type="number" outlined dense label="Min Players" clearable />
        </div>

        <!-- Sort options -->
        <div class="col-12 col-md-4">
          <q-select v-model="sortBy" outlined dense label="Sort by" :options="[
            { label: 'Date', value: 'date' },
            { label: 'Title', value: 'title' },
            { label: 'Players', value: 'players' }
          ]" map-options emit-value />
        </div>

        <!-- Sort direction -->
        <div class="col-12 col-md-4">
          <q-btn-toggle v-model="sortDirection" toggle-color="primary" text-color="primary" color="black"
            toggle-text-color="black" :options="[
              { label: 'Ascending', value: 'asc' },
              { label: 'Descending', value: 'desc' }
            ]" spread no-caps unelevated />
        </div>
      </div>

      <!-- Clear filters button -->
      <div class="row q-mt-sm">
        <q-btn label="Clear Filters" color="secondary" flat @click="clearFilters" />
      </div>
    </div>

    <!-- Events Grid -->
    <div class="row q-col-gutter-md" v-if="sortedEvents.length > 0">
      <div v-for="event in sortedEvents" :key="event.id" class="col-12 col-md-6 col-lg-4">
        <EventCard :event="event" />
      </div>
    </div>

    <!-- No results message -->
    <div v-else class="text-center q-mt-xl">
      <q-icon name="sentiment_dissatisfied" size="3rem" color="grey-7" />
      <p class="text-grey-7 q-mt-sm">No events match your criteria.</p>
    </div>
  </q-page>
</template>

<style scoped></style>
