<script setup lang="ts">
import GameCard from 'src/components/GameCard.vue';
import GameIcon from 'src/components/GameIcon.vue';
import QRCode from 'src/components/qrcode/QRCode.vue';
import { ref, computed, onMounted } from 'vue';
import type { Game } from 'src/models/Game';
import { useRouter } from 'vue-router';
import { gamesApiService } from 'src/services/api-service';
import { getGameImageUrl } from 'src/composables/useGameImage';
import { createGameUrl } from 'src/utils/slug';
import { useI18n } from 'vue-i18n';

// Router and i18n
const router = useRouter();
const { t } = useI18n();

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

// Game interaction states (using Map for per-game state)
const gameStates = ref<Map<number, {
  reserved: boolean;
  favorite: boolean;
  bookmark: boolean;
  showQRCode: boolean;
}>>(new Map());

// Initialize or get game state
const getGameState = (gameId: number) => {
  if (!gameStates.value.has(gameId)) {
    gameStates.value.set(gameId, {
      reserved: false,
      favorite: false,
      bookmark: false,
      showQRCode: false
    });
  }
  return gameStates.value.get(gameId)!;
};

// Web share support
const isWebShareSupported = ref(false);

// Load games data
const games = ref<Game[]>([]);
const loading = ref(true);

// Load games on component mount
onMounted(async () => {
  try {
    games.value = await gamesApiService.getGames();
  } catch (error) {
    console.error('Failed to load games:', error);
  } finally {
    loading.value = false;
  }
});

// Computed properties for filter options
const availableGenres = computed(() => {
  const genres = [...new Set(games.value.map(game => game.genre))];
  return genres.sort();
});

const availablePlayerCounts = computed(() => {
  const counts = [...new Set(games.value.map(game => game.numberOfPlayers))];
  return counts.sort((a: string, b: string) => {
    const aNum = parseInt(a.replace(/\D/g, '')) || 0;
    const bNum = parseInt(b.replace(/\D/g, '')) || 0;
    return aNum - bNum;
  });
});

const availableAgeRanges = computed(() => {
  const ages = [...new Set(games.value.map(game => game.recommendedAge))];
  return ages.sort((a: string, b: string) => {
    const aNum = parseInt(a.replace(/\D/g, '')) || 0;
    const bNum = parseInt(b.replace(/\D/g, '')) || 0;
    return aNum - bNum;
  });
});

const availablePlayTimes = computed(() => {
  const times = [...new Set(games.value.map(game => game.playTime))];
  return times.sort();
});

const availableComponents = computed(() => {
  const components = [...new Set(games.value.flatMap(game => game.components || []))];
  return components.sort();
});

// Sort options
const sortOptions = computed(() => [
  { label: t('title'), value: 'title' },
  { label: t('genre'), value: 'genre' },
  { label: t('players'), value: 'numberOfPlayers' },
  { label: t('age'), value: 'recommendedAge' },
  { label: t('playTime'), value: 'playTime' }
]);

// Filter and sort logic
const filteredAndSortedGames = computed(() => {
  let filtered = games.value;

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
        (game.components && game.components.some((component: string) => component.toLowerCase().includes(query)));
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

// Game interaction handlers
const toggleReserved = (gameId: number) => {
  const state = getGameState(gameId);
  state.reserved = !state.reserved;
};

const toggleFavorite = (gameId: number) => {
  const state = getGameState(gameId);
  state.favorite = !state.favorite;
};

const toggleBookmark = (gameId: number) => {
  const state = getGameState(gameId);
  state.bookmark = !state.bookmark;
};

const toggleQRCode = (gameId: number) => {
  const state = getGameState(gameId);
  state.showQRCode = !state.showQRCode;
};

const navigateToGame = (game: Game) => {
  router.push(createGameUrl(game.id, game.title)).catch((err) => {
    console.error('Navigation error:', err);
  });
};

const shareGame = async (game: Game) => {
  if (isWebShareSupported.value) {
    try {
      await navigator.share({
        title: game.title,
        text: t('checkOutThisGame', { description: game.description }),
        url: `${window.location.origin}/games/${game.legacyId}`
      });
    } catch {
      // Share was canceled by user - no action needed
    }
  }
};

const mainGameComponents = (game: Game) => {
  if (!game.components || !Array.isArray(game.components)) return [];
  return game.components.slice(0, 3).map(component => ({
    original: component,
    category: component
  }));
};

// Load saved preferences
onMounted(() => {
  // Check for web share support
  isWebShareSupported.value = !!navigator.share;

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
  <q-page>
    <div v-if="loading" class="flex justify-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>

    <div v-else class="games-page">
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
          <q-card bordered class="q-pa-md">
            <div class="filter-header q-mb-md">
              <div class="text-subtitle2 text-weight-medium">{{ t('filters') }}</div>
              <q-btn v-if="hasActiveFilters" @click="clearAllFilters" :label="t('clearAll')" color="negative" flat dense
                size="sm" />
            </div>

            <div class="filters-grid">
              <!-- Genre Filter -->
              <div class="filter-group">
                <div class="filter-label">{{ t('genre') }}</div>
                <q-select v-model="selectedGenres" :options="availableGenres" multiple outlined dense emit-value
                  map-options use-chips :placeholder="t('allGenres')" class="filter-select"
                  popup-content-class="filter-popup" />
              </div>

              <!-- Player Count Filter -->
              <div class="filter-group">
                <div class="filter-label">{{ t('players') }}</div>
                <q-select v-model="selectedPlayerCounts" :options="availablePlayerCounts" multiple outlined dense
                  emit-value map-options use-chips :placeholder="t('anyCount')" class="filter-select" />
              </div>

              <!-- Age Range Filter -->
              <div class="filter-group">
                <div class="filter-label">{{ t('age') }}</div>
                <q-select v-model="selectedAgeRanges" :options="availableAgeRanges" multiple outlined dense emit-value
                  map-options use-chips :placeholder="t('anyAge')" class="filter-select" />
              </div>

              <!-- Play Time Filter -->
              <div class="filter-group">
                <div class="filter-label">{{ t('playTime') }}</div>
                <q-select v-model="selectedPlayTimes" :options="availablePlayTimes" multiple outlined dense emit-value
                  map-options use-chips :placeholder="t('anyDuration')" class="filter-select" />
              </div>

              <!-- Components Filter -->
              <div class="filter-group">
                <div class="filter-label">{{ t('components') }}</div>
                <q-select v-model="selectedComponents" :options="availableComponents" multiple outlined dense emit-value
                  map-options use-chips :placeholder="t('anyComponents')" class="filter-select" />
              </div>
            </div>
          </q-card>
        </div>
      </q-slide-transition>

      <!-- Sort controls -->
      <div class="sort-section q-mb-md">
        <div class="sort-controls">
          <q-select v-model="sortBy" :options="sortOptions" outlined dense emit-value map-options :label="t('sortBy')"
            class="sort-select" />

          <q-btn @click="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'"
            :icon="sortDirection === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'" flat dense round
            color="primary" class="q-ml-sm">
            <q-tooltip>{{ sortDirection === 'asc' ? t('sortDescending') : t('sortAscending') }}</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Results -->
      <div class="results-section">
        <!-- No results message -->
        <div v-if="filteredAndSortedGames.length === 0" class="no-results text-center q-py-xl">
          <q-icon name="mdi-gamepad-variant-outline" size="4rem" color="grey-4" />
          <div class="text-h6 text-grey-6 q-mt-md">{{ t('noGamesFound') }}</div>
          <div class="text-body2 text-grey-5">{{ t('tryAdjustingFilters') }}</div>
          <q-btn v-if="hasActiveFilters" @click="clearAllFilters" :label="t('clearFilters')" color="primary" flat
            class="q-mt-md" />
        </div>

        <!-- Games grid view -->
        <div v-else-if="viewMode === 'cards'" class="games-grid">
          <game-card v-for="game in filteredAndSortedGames" :key="game.title" :game="game" />
        </div>

        <!-- Games list view -->
        <div v-else class="games-list">
          <q-list bordered separator>
            <q-item v-for="game in filteredAndSortedGames" :key="game.title" class="game-list-item">
              <q-item-section avatar class="game-avatar-section">
                <div class="game-image-container">
                  <img :src="getGameImageUrl(game.image)" :alt="game.title"
                    @error="(e) => { (e.target as HTMLImageElement).src = getGameImageUrl(undefined) }"
                    class="game-image" />
                </div>
              </q-item-section>

              <q-item-section @click="navigateToGame(game)" clickable class="game-content-section">
                <q-item-label class="text-weight-medium game-title-link">{{ game.title }}</q-item-label>
                <q-item-label caption lines="2" class="game-description">{{ game.description }}</q-item-label>

                <!-- Game attributes with icons -->
                <q-item-label caption class="game-meta-with-icons q-mt-sm">
                  <div class="meta-row">
                    <q-chip :label="game.genre" size="sm" color="primary" text-color="white" class="q-mr-sm" />
                  </div>

                  <div class="meta-row q-mt-xs">
                    <div class="meta-item">
                      <game-icon category="players" :value="game.numberOfPlayers" size="xs"
                        class="text-secondary q-mr-xs" />
                      <span class="text-grey-6">{{ game.numberOfPlayers }} {{ t('players') }}</span>
                    </div>

                    <div class="meta-item">
                      <q-icon name="mdi-clock-outline" size="xs" class="text-accent q-mr-xs" />
                      <span class="text-grey-6">{{ game.playTime }}</span>
                    </div>

                    <div class="meta-item">
                      <span class="age-badge">{{ game.recommendedAge }}</span>
                    </div>
                  </div>

                  <!-- Components -->
                  <div v-if="game.components && game.components.length > 0" class="meta-row q-mt-xs">
                    <div class="components-container">
                      <div v-for="(component, index) in mainGameComponents(game)" :key="index" class="component-item">
                        <game-icon category="components" :value="component.category" size="xs"
                          class="text-grey-5 q-mr-xs" />
                        <span class="text-grey-5 component-text">{{ component.original }}</span>
                      </div>
                    </div>
                  </div>
                </q-item-label>
              </q-item-section>

              <q-item-section side class="list-actions-section">
                <div class="list-actions">
                  <!-- Top row actions -->
                  <div class="action-row">
                    <q-btn :icon="`mdi-calendar-clock${getGameState(game.legacyId).reserved ? '' : '-outline'}`"
                      @click="toggleReserved(game.legacyId)"
                      :color="getGameState(game.legacyId).reserved ? 'primary' : 'grey-6'" flat dense round size="sm">
                      <q-tooltip class="bg-primary">
                        {{ getGameState(game.legacyId).reserved ? t('removeReservation') : t('reserveGame') }}
                      </q-tooltip>
                    </q-btn>

                    <q-btn :icon="`mdi-bookmark${getGameState(game.legacyId).bookmark ? '' : '-outline'}`"
                      @click="toggleBookmark(game.legacyId)"
                      :color="getGameState(game.legacyId).bookmark ? 'accent' : 'grey-6'" flat dense round size="sm">
                      <q-tooltip class="bg-accent">
                        {{ getGameState(game.legacyId).bookmark ? t('removeFromBookmarks') : t('addToBookmarks') }}
                      </q-tooltip>
                    </q-btn>

                    <q-btn :icon="`mdi-star${getGameState(game.legacyId).favorite ? '' : '-outline'}`"
                      @click="toggleFavorite(game.legacyId)"
                      :color="getGameState(game.legacyId).favorite ? 'secondary' : 'grey-6'" flat dense round size="sm">
                      <q-tooltip class="bg-secondary">
                        {{ getGameState(game.legacyId).favorite ? t('removeFromFavorites') : t('addToFavorites') }}
                      </q-tooltip>
                    </q-btn>
                  </div>

                  <!-- Bottom row actions -->
                  <div class="action-row q-mt-xs">
                    <q-btn icon="mdi-qrcode" @click="toggleQRCode(game.legacyId)" flat dense round size="sm"
                      color="grey-6">
                      <q-tooltip>{{ t('showQrCode') }}</q-tooltip>
                    </q-btn>

                    <q-btn icon="mdi-share" @click="shareGame(game)" flat dense round size="sm" color="grey-6">
                      <q-tooltip>{{ t('shareGame') }}</q-tooltip>
                    </q-btn>

                    <q-btn v-if="game.link" icon="mdi-open-in-new" :href="game.link" target="_blank" flat dense round
                      size="sm" color="grey-6">
                      <q-tooltip>{{ t('openExternalLink') }}</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </q-item-section>

              <!-- QR Code modal for each game -->
              <QRCode :game="game" v-model:showQR="getGameState(game.legacyId).showQRCode" />
            </q-item>
          </q-list>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
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
  align-items: flex-start;
}

.game-list-item:hover {
  background-color: rgba(25, 118, 210, 0.04);
}

.game-avatar-section {
  flex: 0 0 auto;
  margin-right: 1rem;
  width: auto;
}

.game-image-container {
  border-radius: 4px;
  background: #f5f5f5;
  display: inline-block;
  width: auto;
  height: auto;
}

.game-image {
  max-width: 120px;
  max-height: 120px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  display: block;
}

.game-content-section {
  flex: 1 1 auto;
  cursor: pointer;
  transition: color 0.2s ease;
}

.game-content-section:hover .game-title-link {
  color: var(--q-primary);
}

.game-title-link {
  font-size: 1.1rem;
  line-height: 1.3;
  transition: color 0.2s ease;
}

.game-description {
  margin: 0.25rem 0;
  line-height: 1.4;
}

.game-meta-with-icons {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
}

.age-badge {
  background: var(--q-accent);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.components-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.component-item {
  display: flex;
  align-items: center;
}

.component-text {
  font-size: 0.8rem;
}

.list-actions-section {
  flex: 0 0 auto;
  align-self: flex-start;
}

.list-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
}

.action-row {
  display: flex;
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
    flex-direction: column;
    align-items: stretch;
  }

  .game-avatar-section {
    margin-right: 0;
    margin-bottom: 0.5rem;
    align-self: center;
    width: auto;
  }

  .game-image-container {
    background: #f5f5f5;
  }

  .game-image {
    max-width: 80px !important;
    max-height: 80px !important;
  }

  .list-actions-section {
    align-self: stretch;
    margin-top: 0.5rem;
  }

  .list-actions {
    flex-direction: row;
    justify-content: center;
    gap: 0.5rem;
  }

  .action-row {
    display: contents;
  }

  .meta-row {
    justify-content: center;
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

  .game-image {
    max-width: 60px !important;
    max-height: 60px !important;
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

.body--dark .game-image-container {
  background: #2d2d2d;
}

.body--dark .game-list-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.body--dark .game-content-section:hover .game-title-link {
  color: var(--q-secondary);
}

.body--dark .age-badge {
  background: var(--q-secondary);
  color: var(--q-dark);
}
</style>
