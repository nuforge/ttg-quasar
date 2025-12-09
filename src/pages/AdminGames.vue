<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { useGameAdmin } from 'src/composables/useGameAdmin';
import { authService } from 'src/services/auth-service';
import type { Game } from 'src/models/Game';
import AdminGameFilters from 'src/components/admin/AdminGameFilters.vue';
import AdminGamesList from 'src/components/admin/AdminGamesList.vue';
import AdminBulkActions from 'src/components/admin/AdminBulkActions.vue';
import GameFormDialog from 'src/components/games/GameFormDialog.vue';

const $q = useQuasar();
const gamesStore = useGamesFirebaseStore();

// Game admin composable for selection, bulk actions, and filtering
const gameAdmin = useGameAdmin({
  onApproved: () => {
    // Refresh games list after bulk approve
  },
  onRejected: () => {
    // Refresh games list after bulk reject
  },
  onError: (error) => {
    console.error('Game admin error:', error);
  },
});

// Dialog state
const showGameDialog = ref(false);
const editingGame = ref<Game | null>(null);

// Methods
const openAddDialog = () => {
  editingGame.value = null;
  showGameDialog.value = true;
};

const openEditDialog = (game: Game) => {
  editingGame.value = game;
  showGameDialog.value = true;
};

const handleGameSubmitted = () => {
  // Game was submitted, dialog closes automatically
  $q.notify({
    type: 'positive',
    message: 'Game submitted successfully!',
    icon: 'mdi-check-circle',
  });
};

const handleGameUpdated = (gameId: string) => {
  // Game was updated, dialog closes automatically
  console.log('Game updated:', gameId);
};

// Single game actions
const handleApprove = async (game: Game) => {
  await gameAdmin.approveWithConfirm(game);
};

const handleReject = async (game: Game) => {
  await gameAdmin.rejectWithReason(game);
};

const handleDelete = async (game: Game) => {
  await gameAdmin.deleteWithConfirm(game);
};

// Bulk actions with confirmation
const handleBulkApprove = () => {
  $q.dialog({
    title: 'Bulk Approve',
    message: `Are you sure you want to approve ${gameAdmin.selectedCount.value} game(s)?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void gameAdmin.bulkApprove();
  });
};

const handleBulkReject = () => {
  $q.dialog({
    title: 'Bulk Reject',
    message: `Please provide a reason for rejecting ${gameAdmin.selectedCount.value} game(s):`,
    prompt: {
      model: '',
      type: 'text',
      label: 'Rejection reason (optional)',
    },
    cancel: true,
    persistent: true,
  }).onOk((reason: string) => {
    void gameAdmin.bulkReject(reason || undefined);
  });
};

const handleBulkDelete = () => {
  $q.dialog({
    title: 'Bulk Delete',
    message: `Are you sure you want to permanently delete ${gameAdmin.selectedCount.value} game(s)? This cannot be undone.`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    void gameAdmin.bulkDelete();
  });
};

// Initialize
onMounted(() => {
  if (!authService.isAuthenticated.value) {
    $q.notify({
      type: 'negative',
      message: 'You must be logged in to access admin features',
      icon: 'mdi-alert-circle',
    });
    return;
  }

  // Subscribe to real-time updates
  gamesStore.subscribeToGames();
});

onUnmounted(() => {
  gamesStore.cleanup();
});
</script>

<template>
  <q-page padding class="admin-games">
    <!-- Page Header -->
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <h1 class="text-h4 q-mb-xs">Game Administration</h1>
          <p class="text-body1 text-grey-6 q-mb-none">
            Manage game submissions, approvals, and catalog
          </p>
        </div>
        <q-btn
          color="primary"
          icon="mdi-plus"
          label="Add Game"
          @click="openAddDialog"
          unelevated
          aria-label="Add new game"
        />
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-sm-3">
        <q-card bordered class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="mdi-gamepad-variant" size="md" color="primary" />
            <div class="text-h4 q-mt-sm">{{ gamesStore.games.length }}</div>
            <div class="text-caption text-grey-6">Total Games</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card bordered class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="mdi-clock-outline" size="md" color="warning" />
            <div class="text-h4 q-mt-sm">{{ gamesStore.pendingGames.length }}</div>
            <div class="text-caption text-grey-6">Pending Review</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card bordered class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="mdi-check-circle" size="md" color="positive" />
            <div class="text-h4 q-mt-sm">{{ gamesStore.approvedGames.length }}</div>
            <div class="text-caption text-grey-6">Approved</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card bordered class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="mdi-tag-multiple" size="md" color="accent" />
            <div class="text-h4 q-mt-sm">{{ gameAdmin.availableGenres.value.length }}</div>
            <div class="text-caption text-grey-6">Genres</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <AdminBulkActions
      :selected-count="gameAdmin.selectedCount.value"
      :processing="gameAdmin.isProcessing.value"
      @approve="handleBulkApprove"
      @reject="handleBulkReject"
      @delete="handleBulkDelete"
      @deselect-all="gameAdmin.deselectAll"
    />

    <!-- Filters -->
    <AdminGameFilters
      :search="gameAdmin.filters.value.search"
      :status="gameAdmin.filters.value.status"
      :genre="gameAdmin.filters.value.genre"
      :sort-by="gameAdmin.filters.value.sortBy"
      :sort-order="gameAdmin.filters.value.sortOrder"
      :available-genres="gameAdmin.availableGenres.value"
      :has-active-filters="gameAdmin.hasActiveFilters.value"
      :total-count="gamesStore.games.length"
      :filtered-count="gameAdmin.filteredGames.value.length"
      @update:search="gameAdmin.filters.value.search = $event"
      @update:status="gameAdmin.filters.value.status = $event"
      @update:genre="gameAdmin.filters.value.genre = $event"
      @update:sort-by="gameAdmin.filters.value.sortBy = $event"
      @update:sort-order="gameAdmin.filters.value.sortOrder = $event"
      @reset="gameAdmin.resetFilters"
      class="q-mb-lg"
    />

    <!-- Games List -->
    <AdminGamesList
      :games="gameAdmin.filteredGames.value"
      :selected-ids="gameAdmin.selectedGameIds.value"
      :loading="gamesStore.loading"
      :processing="gameAdmin.isProcessing.value"
      @toggle="gameAdmin.toggleGameSelection"
      @select-all="gameAdmin.selectAll"
      @deselect-all="gameAdmin.deselectAll"
      @approve="handleApprove"
      @reject="handleReject"
      @edit="openEditDialog"
      @delete="handleDelete"
    />

    <!-- Game Form Dialog -->
    <GameFormDialog
      v-model="showGameDialog"
      :game="editingGame"
      :is-admin="true"
      @submitted="handleGameSubmitted"
      @updated="handleGameUpdated"
    />
  </q-page>
</template>

<style scoped>
.admin-games {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header h1 {
  margin: 0;
}

.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}
</style>
