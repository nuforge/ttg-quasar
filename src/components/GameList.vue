<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCurrentUser } from 'vuefire';
import { useQuasar } from 'quasar';
import type { Game } from 'src/models/Game';
import GameCard from './GameCard.vue';
import { getGameImageUrl } from 'src/composables/useGameImage';
import { createGameUrl } from 'src/utils/slug';
import { useGamePreferences } from 'src/composables/useGamePreferences';
import { useGameOwnershipsStore } from 'src/stores/game-ownerships-store';

const { t } = useI18n();

// Props
const props = withDefaults(defineProps<{
  games: Game[];
  loading?: boolean;
  title?: string;
  showControls?: boolean;
  showActions?: boolean;
  showOwnershipActions?: boolean;
  showPreferenceActions?: boolean;
  showRemoveAction?: boolean;
  listType?: string;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  hideEmptyAction?: boolean;
}>(), {
  loading: false,
  title: 'Games',
  showControls: true,
  showActions: true,
  showOwnershipActions: true,
  showPreferenceActions: true,
  showRemoveAction: false,
  listType: 'list',
  emptyIcon: 'mdi-gamepad-variant-outline',
  emptyTitle: 'No games found',
  emptyMessage: 'Try adjusting your search or filters',
  hideEmptyAction: false,
});

// Emits
const emit = defineEmits<{
  remove: [gameId: string];
}>();

// Composables
const $q = useQuasar();
const user = useCurrentUser();
const gamePreferences = useGamePreferences();
const ownershipStore = useGameOwnershipsStore();

// State
const viewMode = ref<'cards' | 'list'>('cards');
const searchQuery = ref('');
const showFilters = ref(false);
const ownershipLoading = ref(false);

// Filters
const filters = ref({
  genre: null as string | null,
  playerCount: null as string | null,
  playTime: null as string | null,
});

const sortBy = ref('title');

// Computed
const genreOptions = computed(() => {
  const genres = [...new Set(props.games.map(game => game.genre))].sort();
  return genres.map(genre => ({ label: genre, value: genre }));
});

const playerCountOptions = computed(() => {
  const counts = [...new Set(props.games.map(game => game.numberOfPlayers))].sort();
  return counts.map(count => ({ label: count, value: count }));
});

const playTimeOptions = computed(() => {
  const times = [...new Set(props.games.map(game => game.playTime))].sort();
  return times.map(time => ({ label: time, value: time }));
});

const sortOptions = [
  { label: 'Title', value: 'title' },
  { label: 'Genre', value: 'genre' },
  { label: 'Player Count', value: 'numberOfPlayers' },
  { label: 'Play Time', value: 'playTime' },
  { label: 'Age', value: 'recommendedAge' },
];

const hasActiveFilters = computed(() => {
  return filters.value.genre || filters.value.playerCount || filters.value.playTime;
});

const filteredGames = computed(() => {
  let result = [...props.games];

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(game =>
      game.title.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query) ||
      game.genre.toLowerCase().includes(query)
    );
  }

  // Apply filters
  if (filters.value.genre) {
    result = result.filter(game => game.genre === filters.value.genre);
  }
  if (filters.value.playerCount) {
    result = result.filter(game => game.numberOfPlayers === filters.value.playerCount);
  }
  if (filters.value.playTime) {
    result = result.filter(game => game.playTime === filters.value.playTime);
  }

  return result;
});

const displayedGames = computed(() => {
  const sorted = [...filteredGames.value];

  sorted.sort((a, b) => {
    const aValue = a[sortBy.value as keyof Game];
    const bValue = b[sortBy.value as keyof Game];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue);
    }

    return String(aValue).localeCompare(String(bValue));
  });

  return sorted;
});

// Game state helpers
const ownsGame = (gameId: string) => ownershipStore.ownsGame(gameId);
const canBringGame = (gameId: string) => ownershipStore.canBringGame(gameId);
const isFavorite = (gameId: string) => gamePreferences.isFavorite(gameId);
const isBookmarked = (gameId: string) => gamePreferences.isBookmarked(gameId);

// Action handlers
const handleToggleOwnership = async (gameId: string) => {
  if (!user.value) return;

  ownershipLoading.value = true;
  try {
    const ownership = ownershipStore.getOwnership(gameId);
    if (ownership) {
      await ownershipStore.removeOwnership(ownership.id);
      $q.notify({
        type: 'positive',
        message: 'Game removed from your collection',
        position: 'top',
      });
    } else {
      await ownershipStore.addOwnership(gameId, user.value.uid);
      $q.notify({
        type: 'positive',
        message: 'Game added to your collection',
        position: 'top',
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to update game ownership',
      position: 'top',
    });
  } finally {
    ownershipLoading.value = false;
  }
};

const handleToggleCanBring = async (gameId: string) => {
  if (!user.value) return;

  ownershipLoading.value = true;
  try {
    const ownership = ownershipStore.getOwnership(gameId);
    if (ownership) {
      await ownershipStore.updateCanBring(ownership.id, !ownership.canBring);
      $q.notify({
        type: 'positive',
        message: ownership.canBring ? 'Marked as cannot bring' : 'Marked as can bring',
        position: 'top',
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to update can bring status',
      position: 'top',
    });
  } finally {
    ownershipLoading.value = false;
  }
};

const handleToggleFavorite = async (gameId: string) => {
  try {
    await gamePreferences.toggleFavorite(gameId);
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to update favorites',
      position: 'top',
    });
  }
};

const handleToggleBookmark = async (gameId: string) => {
  try {
    await gamePreferences.toggleBookmark(gameId);
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to update bookmarks',
      position: 'top',
    });
  }
};

const handleRemove = (gameId: string) => {
  emit('remove', gameId);
};

// Initialize ownership store
watch(user, (newUser) => {
  if (newUser && props.showOwnershipActions) {
    ownershipStore.subscribeToPlayerOwnerships(newUser.uid);
  }
}, { immediate: true });
</script>

<template>
  <div class="game-list">
    <!-- Header with controls -->
    <div class="list-header q-mb-md" v-if="showControls">
      <div class="row items-center justify-between">
        <div class="text-h6">
          {{ title }}
          <q-chip v-if="displayedGames.length !== games.length" :label="displayedGames.length + ' / ' + games.length"
            color="primary" text-color="white" size="sm" class="q-ml-sm" />
        </div>

        <div class="row items-center q-gutter-sm">
          <!-- View mode toggle -->
          <q-btn-toggle v-model="viewMode" :options="[
            { icon: 'mdi-view-grid', value: 'cards', tooltip: 'Card View' },
            { icon: 'mdi-view-list', value: 'list', tooltip: 'List View' }
          ]" outline color="primary" toggle-color="primary" />

          <!-- Search -->
          <q-input v-model="searchQuery" :placeholder="$t('searchGames') + '...'" outlined dense debounce="300"
            clearable style="min-width: 200px">
            <template v-slot:prepend>
              <q-icon name="mdi-magnify" />
            </template>
          </q-input>

          <!-- Filters toggle -->
          <q-btn flat round icon="mdi-tune" color="primary" @click="showFilters = !showFilters"
            :class="{ 'bg-primary text-white': hasActiveFilters }">
            <q-tooltip>Filters</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <q-slide-transition v-if="showControls">
      <div v-show="showFilters">
        <q-card bordered class="q-mb-md">
          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- Genre Filter -->
              <div class="col-12 col-sm-6 col-md-3">
                <q-select v-model="filters.genre" :options="genreOptions" label="Genre" outlined dense clearable />
              </div>

              <!-- Player Count Filter -->
              <div class="col-12 col-sm-6 col-md-3">
                <q-select v-model="filters.playerCount" :options="playerCountOptions" label="Player Count" outlined
                  dense clearable />
              </div>

              <!-- Play Time Filter -->
              <div class="col-12 col-sm-6 col-md-3">
                <q-select v-model="filters.playTime" :options="playTimeOptions" label="Play Time" outlined dense
                  clearable />
              </div>

              <!-- Sort -->
              <div class="col-12 col-sm-6 col-md-3">
                <q-select v-model="sortBy" :options="sortOptions" label="Sort By" outlined dense />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-slide-transition>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner size="lg" color="primary" />
      <div class="q-mt-md">Loading games...</div>
    </div>

    <!-- Empty State -->
    <q-card v-else-if="displayedGames.length === 0" flat bordered class="text-center q-pa-xl">
      <q-icon :name="emptyIcon" size="64px" color="grey-5" />
      <h6 class="text-h6 q-mt-md q-mb-sm">{{ emptyTitle }}</h6>
      <p class="text-body2 text-grey-6 q-mb-md">{{ emptyMessage }}</p>
      <q-btn v-if="!hideEmptyAction" flat color="primary" :label="t('browseAllGames')" to="/games" />
    </q-card>

    <!-- Games Grid/List -->
    <div v-else>
      <!-- Card View -->
      <div v-if="viewMode === 'cards'" class="row q-col-gutter-md">
        <div v-for="game in displayedGames" :key="game.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <GameCard :game="game" />
        </div>
      </div>

      <!-- List View -->
      <div v-else>
        <q-list bordered separator>
          <q-item v-for="game in displayedGames" :key="game.id" class="q-pa-md">
            <q-item-section avatar>
              <q-img :src="getGameImageUrl(game.image, game.title)" style="width: 60px; height: 60px;" fit="cover"
                @error="($event.target as HTMLImageElement).src = getGameImageUrl(undefined)" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-h6">
                <router-link :to="createGameUrl(game.id, game.title)" class="text-decoration-none text-primary">
                  {{ game.title }}
                </router-link>
              </q-item-label>
              <q-item-label caption lines="2">{{ game.description }}</q-item-label>

              <div class="row items-center q-gutter-sm q-mt-xs">
                <q-chip :label="game.genre" size="sm" color="primary" text-color="white" dense />
                <q-chip :label="`${game.numberOfPlayers} players`" size="sm" outline dense />
                <q-chip :label="game.playTime" size="sm" outline dense />
              </div>
            </q-item-section>

            <q-item-section side v-if="showActions">
              <div class="column q-gutter-xs">
                <!-- Ownership actions -->
                <div class="row q-gutter-xs" v-if="showOwnershipActions">
                  <q-btn :icon="ownsGame(game.id) ? 'mdi-package-variant' : 'mdi-package-variant-plus'"
                    :color="ownsGame(game.id) ? 'positive' : 'grey-6'" size="sm" flat round
                    @click="handleToggleOwnership(game.id)" :loading="ownershipLoading">
                    <q-tooltip>{{ t('toggleOwnership') }}</q-tooltip>
                  </q-btn>

                  <q-btn v-if="ownsGame(game.id)"
                    :icon="canBringGame(game.id) ? 'mdi-briefcase-check' : 'mdi-briefcase-plus'"
                    :color="canBringGame(game.id) ? 'secondary' : 'grey-6'" size="sm" flat round
                    @click="handleToggleCanBring(game.id)" :loading="ownershipLoading">
                    <q-tooltip>{{ t('canBringToEvents') }}</q-tooltip>
                  </q-btn>
                </div>

                <!-- Preference actions -->
                <div class="row q-gutter-xs" v-if="showPreferenceActions">
                  <q-btn :icon="isFavorite(game.id) ? 'mdi-star' : 'mdi-star-outline'"
                    :color="isFavorite(game.id) ? 'secondary' : 'grey-6'" size="sm" flat round
                    @click="handleToggleFavorite(game.id)">
                    <q-tooltip>{{ t('toggleFavorite') }}</q-tooltip>
                  </q-btn>

                  <q-btn :icon="isBookmarked(game.id) ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
                    :color="isBookmarked(game.id) ? 'accent' : 'grey-6'" size="sm" flat round
                    @click="handleToggleBookmark(game.id)">
                    <q-tooltip>{{ t('toggleBookmark') }}</q-tooltip>
                  </q-btn>
                </div>

                <!-- Remove action for specific lists -->
                <q-btn v-if="showRemoveAction" icon="mdi-close" color="negative" size="sm" flat round
                  @click="handleRemove(game.id)">
                  <q-tooltip>Remove from {{ listType }}</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </div>
</template>


<style scoped>
.list-header {
  border-bottom: 1px solid var(--q-color-separator);
  padding-bottom: 16px;
}

.game-image-container {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
}

.game-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.game-title-link {
  text-decoration: none;
  color: var(--q-color-on-surface);
}

.game-title-link:hover {
  color: var(--q-color-primary);
}

.meta-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
}

.age-badge {
  background: var(--q-color-secondary);
  color: var(--q-color-on-secondary);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
