<script setup lang="ts">
import gamesData from 'src/assets/data/games.json';
import GameCard from 'src/components/GameCard.vue';
import { ref, computed, onMounted } from 'vue';
import { Game } from 'src/models/Game';

// Reactive state
const searchQuery = ref('');
const selectedGenres = ref<string[]>([]);
const selectedPlayerCounts = ref<string[]>([]);
const selectedAgeRanges = ref<string[]>([]);
const selectedPlayTimes = ref<string[]>([]);
const selectedComponents = ref<string[]>([]);
const sortBy = ref('title');
const sortDirection = ref('asc');
const viewMode = ref<'cards' | 'list'>('cards');
const showFilters = ref(false);

// Load games data
const games: Game[] = gamesData.map(gameData => Game.fromJSON(gameData));

// Extract unique filter options from games data
const availableGenres = computed(() => {
  const genres = [...new Set(games.map(game => game.genre))];
  return genres.sort();
});

const availablePlayerCounts = computed(() => {
  const counts = [...new Set(games.map(game => game.numberOfPlayers))];
  return counts.sort((a, b) => {
    // Custom sort for player counts
    const aNum = parseInt(a.replace(/\D/g, '')) || 0;
    const bNum = parseInt(b.replace(/\D/g, '')) || 0;
    return aNum - bNum;
  });
});

const availableAgeRanges = computed(() => {
  const ages = [...new Set(games.map(game => game.recommendedAge))];
  return ages.sort((a, b) => {
    const aNum = parseInt(a.replace(/\D/g, '')) || 0;
    const bNum = parseInt(b.replace(/\D/g, '')) || 0;
    return aNum - bNum;
  });
});

const availablePlayTimes = computed(() => {
  const times = [...new Set(games.map(game => game.playTime))];
  return times.sort();
});

const availableComponents = computed(() => {
  const components = [...new Set(games.flatMap(game => game.components || []))];
  return components.sort();
});

// Sort options
const sortOptions = [
  { label: 'Title', value: 'title' },
  { label: 'Genre', value: 'genre' },
  { label: 'Players', value: 'numberOfPlayers' },
  { label: 'Age', value: 'recommendedAge' },
  { label: 'Play Time', value: 'playTime' }
];

// Filter and sort logic
const filteredAndSortedGames = computed(() => {
  let filtered = games;

  // Apply text search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((game) => {
      return game.title.toLowerCase().includes(query) ||
        game.genre.toLowerCase().includes(query) ||
        game.description.toLowerCase().includes(query) ||
        game.numberOfPlayers.toLowerCase().includes(query) ||
        game.recommendedAge.toLowerCase().includes(query) ||
        game.playTime.toLowerCase().includes(query) ||
        (game.components && game.components.some(component => component.toLowerCase().includes(query)));
    });
  }

  // Apply genre filter
  if (selectedGenres.value.length > 0) {
    filtered = filtered.filter(game => selectedGenres.value.includes(game.genre));
  }

  // Apply player count filter
  if (selectedPlayerCounts.value.length > 0) {
    filtered = filtered.filter(game => selectedPlayerCounts.value.includes(game.numberOfPlayers));
  }

  // Apply age range filter
  if (selectedAgeRanges.value.length > 0) {
    filtered = filtered.filter(game => selectedAgeRanges.value.includes(game.recommendedAge));
  }

  // Apply play time filter
  if (selectedPlayTimes.value.length > 0) {
    filtered = filtered.filter(game => selectedPlayTimes.value.includes(game.playTime));
  }

  // Apply components filter
  if (selectedComponents.value.length > 0) {
    filtered = filtered.filter(game =>
      game.components && selectedComponents.value.some(component =>
        game.components.includes(component)
      )
    );
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aValue = a[sortBy.value as keyof Game] as string;
    let bValue = b[sortBy.value as keyof Game] as string;

    // Handle special sorting for player counts and ages
    if (sortBy.value === 'numberOfPlayers' || sortBy.value === 'recommendedAge') {
      const aNum = parseInt(aValue.replace(/\D/g, '')) || 0;
      const bNum = parseInt(bValue.replace(/\D/g, '')) || 0;
      aValue = aNum.toString();
      bValue = bNum.toString();
    }

    const comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });

  return filtered;
});

// Utility functions
const clearAllFilters = () => {
  searchQuery.value = '';
  selectedGenres.value = [];
  selectedPlayerCounts.value = [];
  selectedAgeRanges.value = [];
  selectedPlayTimes.value = [];
  selectedComponents.value = [];
};

const hasActiveFilters = computed(() => {
  return searchQuery.value ||
    selectedGenres.value.length > 0 ||
    selectedPlayerCounts.value.length > 0 ||
    selectedAgeRanges.value.length > 0 ||
    selectedPlayTimes.value.length > 0 ||
    selectedComponents.value.length > 0;
});

const activeFilterCount = computed(() => {
  return selectedGenres.value.length +
    selectedPlayerCounts.value.length +
    selectedAgeRanges.value.length +
    selectedPlayTimes.value.length +
    selectedComponents.value.length;
});

// Load saved preferences
onMounted(() => {
  const savedViewMode = localStorage.getItem('gamesViewMode');
  if (savedViewMode === 'cards' || savedViewMode === 'list') {
    viewMode.value = savedViewMode;
  }

  const savedSortBy = localStorage.getItem('gamesSortBy');
  if (savedSortBy) {
    sortBy.value = savedSortBy;
  }

  const savedSortDirection = localStorage.getItem('gamesSortDirection');
  if (savedSortDirection) {
    sortDirection.value = savedSortDirection;
  }
});

// Save preferences when changed
const savePreferences = () => {
  localStorage.setItem('gamesViewMode', viewMode.value);
  localStorage.setItem('gamesSortBy', sortBy.value);
  localStorage.setItem('gamesSortDirection', sortDirection.value);
};

// Watch for changes to save preferences
import { watch } from 'vue';
watch([viewMode, sortBy, sortDirection], savePreferences);
</script>

<template>
  <div class="games-page">
    <!-- Header with title and view toggle -->
    <div class="page-header q-mb-md">
      <div class="text-h6 text-uppercase">
        <q-icon name="mdi-book-multiple" /> {{ $t('game', 2) }}
        <q-chip v-if="filteredAndSortedGames.length !== games.length"
          :label="filteredAndSortedGames.length + ' / ' + games.length" color="primary" text-color="white" size="sm"
          class="q-ml-sm" />
      </div>

      <div class="header-actions">
        <!-- View mode toggle -->
        <q-btn-toggle v-model="viewMode" toggle-color="primary" :options="[
          { label: '', value: 'cards', icon: 'mdi-view-grid' },
          { label: '', value: 'list', icon: 'mdi-view-list' }
        ]" flat dense class="q-mr-sm" />

        <!-- Filter toggle -->
        <q-btn @click="showFilters = !showFilters" :color="hasActiveFilters ? 'primary' : 'grey-6'"
          :icon="showFilters ? 'mdi-filter-off' : 'mdi-filter'" flat dense round>
          <q-badge v-if="activeFilterCount > 0" :label="activeFilterCount" color="red" floating />
        </q-btn>
      </div>
    </div>

    <!-- Search input -->
    <div class="search-section q-mb-md">
      <q-input v-model="searchQuery" outlined dense clearable :placeholder="$t('searchGames')" class="game-search">
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Filters panel -->
    <q-slide-transition>
      <div v-show="showFilters" class="filters-panel q-mb-md">
        <q-card flat bordered class="q-pa-md">
          <div class="filter-header q-mb-md">
            <div class="text-subtitle2 text-weight-medium">Filters</div>
            <q-btn v-if="hasActiveFilters" @click="clearAllFilters" label="Clear All" color="negative" flat dense
              size="sm" />
          </div>

          <div class="filters-grid">
            <!-- Genre Filter -->
            <div class="filter-group">
              <div class="filter-label">Genre</div>
              <q-select v-model="selectedGenres" :options="availableGenres" multiple outlined dense emit-value
                map-options use-chips placeholder="All genres" class="filter-select"
                popup-content-class="filter-popup" />
            </div>

            <!-- Player Count Filter -->
            <div class="filter-group">
              <div class="filter-label">Players</div>
              <q-select v-model="selectedPlayerCounts" :options="availablePlayerCounts" multiple outlined dense
                emit-value map-options use-chips placeholder="Any count" class="filter-select" />
            </div>

            <!-- Age Range Filter -->
            <div class="filter-group">
              <div class="filter-label">Age</div>
              <q-select v-model="selectedAgeRanges" :options="availableAgeRanges" multiple outlined dense emit-value
                map-options use-chips placeholder="Any age" class="filter-select" />
            </div>

            <!-- Play Time Filter -->
            <div class="filter-group">
              <div class="filter-label">Play Time</div>
              <q-select v-model="selectedPlayTimes" :options="availablePlayTimes" multiple outlined dense emit-value
                map-options use-chips placeholder="Any duration" class="filter-select" />
            </div>

            <!-- Components Filter -->
            <div class="filter-group">
              <div class="filter-label">Components</div>
              <q-select v-model="selectedComponents" :options="availableComponents" multiple outlined dense emit-value
                map-options use-chips placeholder="Any components" class="filter-select" />
            </div>
          </div>
        </q-card>
      </div>
    </q-slide-transition>

    <!-- Sort controls -->
    <div class="sort-section q-mb-md">
      <div class="sort-controls">
        <q-select v-model="sortBy" :options="sortOptions" outlined dense emit-value map-options label="Sort by"
          class="sort-select" />

        <q-btn @click="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'"
          :icon="sortDirection === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'" flat dense round
          color="primary" class="q-ml-sm" />
      </div>
    </div>

    <!-- Results -->
    <div class="results-section">
      <!-- No results message -->
      <div v-if="filteredAndSortedGames.length === 0" class="no-results text-center q-py-xl">
        <q-icon name="mdi-gamepad-variant-outline" size="4rem" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">No games found</div>
        <div class="text-body2 text-grey-5">Try adjusting your search or filters</div>
        <q-btn v-if="hasActiveFilters" @click="clearAllFilters" label="Clear Filters" color="primary" flat
          class="q-mt-md" />
      </div>

      <!-- Games grid view -->
      <div v-else-if="viewMode === 'cards'" class="games-grid">
        <game-card v-for="game in filteredAndSortedGames" :key="game.title" :game="game" />
      </div>

      <!-- Games list view -->
      <div v-else class="games-list">
        <q-list bordered separator>
          <q-item v-for="game in filteredAndSortedGames" :key="game.title" clickable v-ripple class="game-list-item">
            <q-item-section avatar>
              <q-avatar size="60px" square>
                <img :src="`/images/games/${game.image}`" :alt="game.title"
                  @error="(e) => { (e.target as HTMLImageElement).src = '/images/games/default.webp' }" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">{{ game.title }}</q-item-label>
              <q-item-label caption lines="2">{{ game.description }}</q-item-label>
              <q-item-label caption class="game-meta q-mt-xs">
                <q-chip :label="game.genre" size="sm" color="primary" text-color="white" class="q-mr-xs" />
                <span class="text-grey-6">
                  {{ game.numberOfPlayers }} players • {{ game.recommendedAge }} • {{ game.playTime }}
                </span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="list-actions">
                <q-btn icon="mdi-heart-outline" flat dense round size="sm" color="grey-6" />
                <q-btn icon="mdi-share-variant" flat dense round size="sm" color="grey-6" />
                <q-btn icon="mdi-dots-vertical" flat dense round size="sm" color="grey-6" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </div>
</template>

<style scoped>
.games-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
}

.game-search {
  max-width: 500px;
}

.filters-panel {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--q-primary);
  margin-bottom: 0.25rem;
}

.filter-select {
  min-width: 180px;
}

.sort-section {
  display: flex;
  justify-content: flex-end;
}

.sort-controls {
  display: flex;
  align-items: center;
}

.sort-select {
  min-width: 140px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2rem;
}

.games-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.game-list-item {
  padding: 1rem;
  transition: background-color 0.2s ease;
}

.game-list-item:hover {
  background-color: rgba(25, 118, 210, 0.04);
}

.game-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.list-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.no-results {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .games-page {
    padding: 0 0.5rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .sort-section {
    justify-content: flex-start;
  }

  .games-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .game-list-item {
    padding: 0.75rem;
  }

  .list-actions {
    flex-direction: row;
  }
}

@media (max-width: 480px) {
  .game-search {
    max-width: 100%;
  }

  .sort-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .sort-select {
    min-width: 120px;
  }
}

/* Filter popup improvements */
:deep(.filter-popup) {
  max-height: 300px;
}

/* Animation for results */
.games-grid>*,
.games-list>* {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark theme adjustments */
.body--dark .filters-panel {
  background: rgba(0, 0, 0, 0.8);
}

.body--dark .games-list {
  background: var(--q-dark);
}

.body--dark .game-list-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}
</style>
