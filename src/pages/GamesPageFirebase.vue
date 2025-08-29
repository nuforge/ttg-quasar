<template>
    <q-page padding class="games-page">
        <!-- Migration Notice -->
        <!-- Header with title and controls -->

        <!-- Header with title and controls -->
        <div class="page-header q-mb-md">
            <div class="text-h6 text-uppercase">
                <q-icon name="mdi-book-multiple" /> Games
                <q-chip v-if="displayedGames.length !== gamesStore.approvedGames.length"
                    :label="displayedGames.length + ' / ' + gamesStore.approvedGames.length" color="primary"
                    text-color="white" size="sm" class="q-ml-sm" />
            </div>

            <div class="header-actions">
                <!-- Submit Game Button -->
                <q-btn v-if="authService.isAuthenticated.value" color="positive" icon="mdi-plus" label="Submit Game"
                    @click="showGameSubmission = true" class="q-mr-sm" />

                <!-- View mode toggle -->
                <q-btn-toggle v-model="viewMode" :options="[
                    { icon: 'mdi-view-grid', value: 'cards', tooltip: 'Card View' },
                    { icon: 'mdi-view-list', value: 'list', tooltip: 'List View' }
                ]" outline color="primary" toggle-color="primary" class="q-mr-sm" />

                <!-- Search -->
                <q-input v-model="searchQuery" placeholder="Search games..." outlined dense debounce="300" clearable
                    class="game-search" style="min-width: 200px">
                    <template v-slot:prepend>
                        <q-icon name="mdi-magnify" />
                    </template>
                </q-input>

                <!-- Filters button -->
                <q-btn flat round icon="mdi-tune" color="primary" @click="showFilters = !showFilters"
                    :class="{ 'bg-primary text-white': hasActiveFilters }">
                    <q-tooltip>Filters</q-tooltip>
                </q-btn>
            </div>
        </div>

        <!-- Filters -->
        <q-slide-transition>
            <div v-show="showFilters">
                <q-card bordered class="q-mb-md">
                    <q-card-section>
                        <div class="filters-grid">
                            <!-- Genre Filter -->
                            <div class="filter-group">
                                <div class="filter-label">Genre</div>
                                <q-select v-model="selectedGenres" :options="availableGenres" multiple outlined dense
                                    emit-value map-options use-chips placeholder="Any genre" class="filter-select" />
                            </div>

                            <!-- Other filters... (keeping same as original for now) -->
                            <div class="filter-actions">
                                <q-btn v-if="hasActiveFilters" @click="clearAllFilters" label="Clear All" color="grey-7"
                                    flat dense />
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </q-slide-transition>

        <!-- Loading State -->
        <div v-if="gamesStore.loading" class="text-center q-py-xl">
            <q-spinner-dots size="50px" color="primary" />
            <div class="q-mt-md text-grey-6">
                Loading games...
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="gamesStore.error" class="text-center q-py-xl">
            <q-icon name="mdi-alert-circle" size="50px" color="negative" />
            <div class="q-mt-md text-h6 text-negative">Error Loading Games</div>
            <div class="text-body2 text-grey-6 q-mt-sm">{{ gamesStore.error }}</div>
            <q-btn @click="loadGames" label="Retry" color="primary" flat class="q-mt-md" />
        </div>

        <!-- Games Display -->
        <div v-else>
            <!-- No results message -->
            <div v-if="displayedGames.length === 0" class="no-results text-center q-py-xl">
                <q-icon name="mdi-gamepad-variant-outline" size="4rem" color="grey-4" />
                <div class="text-h6 text-grey-6 q-mt-md">No games found</div>
                <div class="text-body2 text-grey-5">Try adjusting your search or filters</div>
                <q-btn v-if="hasActiveFilters" @click="clearAllFilters" label="Clear Filters" color="primary" flat
                    class="q-mt-md" />
            </div>

            <!-- Games grid view -->
            <div v-else-if="viewMode === 'cards'" class="games-grid">
                <game-card v-for="game in displayedGames" :key="game.id" :game="game" />
            </div>

            <!-- Games list view -->
            <div v-else class="games-list">
                <q-list bordered separator>
                    <q-item v-for="game in displayedGames" :key="game.id" class="game-list-item">
                        <q-item-section avatar class="game-avatar-section">
                            <div class="game-image-container">
                                <img v-if="game.image" :src="getGameImageUrl(game.image)" :alt="game.title"
                                    class="game-image"
                                    @error="($event.target as HTMLImageElement).src = '/images/games/default.svg'" />
                                <q-icon v-else name="mdi-gamepad-variant" size="60px" color="grey-5" />
                            </div>
                        </q-item-section>

                        <q-item-section>
                            <q-item-label>
                                <router-link :to="`/games-firebase/${game.id}`"
                                    class="game-title-link text-weight-bold">
                                    {{ game.title }}
                                </router-link>
                                <div class="text-caption text-grey-6">{{ game.genre }}</div>
                            </q-item-label>

                            <q-item-label caption class="game-description q-mt-xs">
                                {{ game.description }}
                            </q-item-label>

                            <q-item-label caption class="game-meta-with-icons q-mt-sm">
                                <div class="meta-row">
                                    <div class="meta-item">
                                        <q-icon name="mdi-account-group" size="xs" class="text-secondary q-mr-xs" />
                                        <span class="text-grey-6">{{ game.numberOfPlayers }} players</span>
                                    </div>
                                    <div class="meta-item">
                                        <q-icon name="mdi-clock-outline" size="xs" class="text-accent q-mr-xs" />
                                        <span class="text-grey-6">{{ game.playTime }}</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="age-badge">{{ game.recommendedAge }}</span>
                                    </div>
                                </div>
                            </q-item-label>
                        </q-item-section>
                    </q-item>
                </q-list>
            </div>
        </div>

        <!-- Game Submission Dialog -->
        <GameSubmissionDialog v-model="showGameSubmission" @submitted="onGameSubmitted" />
    </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import GameCard from 'src/components/GameCard.vue';
import GameSubmissionDialog from 'src/components/games/GameSubmissionDialog.vue';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { authService } from 'src/services/auth-service';
import { getGameImageUrl } from 'src/composables/useGameImage';

const $q = useQuasar();
const gamesStore = useGamesFirebaseStore();

// State
const searchQuery = ref('');
const selectedGenres = ref<string[]>([]);
const viewMode = ref<'cards' | 'list'>('cards');
const showFilters = ref(false);
const showGameSubmission = ref(false);

// Computed
const displayedGames = computed(() => {
    let filtered = gamesStore.approvedGames;

    // Apply text search
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter((game) => {
            return game.title.toLowerCase().includes(query) ||
                game.genre.toLowerCase().includes(query) ||
                game.description.toLowerCase().includes(query) ||
                game.publisher?.toLowerCase().includes(query) ||
                game.tags?.some(tag => tag.toLowerCase().includes(query)) ||
                game.components.some(component => component.toLowerCase().includes(query));
        });
    }

    // Apply genre filter
    if (selectedGenres.value.length > 0) {
        filtered = filtered.filter(game => selectedGenres.value.includes(game.genre));
    }

    return filtered;
});

const availableGenres = computed(() => {
    const genres = [...new Set(gamesStore.approvedGames.map(game => game.genre))];
    return genres.sort();
});

const hasActiveFilters = computed(() => {
    return selectedGenres.value.length > 0;
});

// Methods
const loadGames = async () => {
    try {
        await gamesStore.loadGames();
    } catch (error) {
        console.error('Failed to load games from Firebase:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to load games from Firebase.',
        });
    }
};

const clearAllFilters = () => {
    selectedGenres.value = [];
    searchQuery.value = '';
};

const onGameSubmitted = () => {
    $q.notify({
        type: 'info',
        message: 'Your game submission has been sent for review!',
        timeout: 3000,
    });
};

// Initialize
onMounted(async () => {
    // Load games
    await loadGames();

    // Load saved preferences
    const savedViewMode = localStorage.getItem('gamesViewMode');
    if (savedViewMode === 'cards' || savedViewMode === 'list') {
        viewMode.value = savedViewMode;
    }
});

// Save view mode preference
watch(viewMode, (newMode) => {
    localStorage.setItem('gamesViewMode', newMode);
});
</script>

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
    gap: 0.5rem;
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

.game-image-container {
    border-radius: 4px;
    background: #f5f5f5;
    display: inline-block;
    width: auto;
    height: auto;
    padding: 8px;
}

.game-image {
    max-width: 80px;
    max-height: 80px;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 4px;
    display: block;
}

.game-title-link {
    color: inherit;
    text-decoration: none;
    transition: color 0.2s ease;
}

.game-title-link:hover {
    color: var(--q-primary);
}

.age-badge {
    background: var(--q-accent);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
}

.meta-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.meta-item {
    display: flex;
    align-items: center;
    font-size: 0.85rem;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 200px;
}

.filter-label {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--q-dark);
}

.filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    align-items: end;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: stretch;
    }

    .header-actions {
        justify-content: space-between;
    }

    .games-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .filters-grid {
        grid-template-columns: 1fr;
    }
}
</style>
