<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { useEventAdmin } from 'src/composables/useEventAdmin';
import { authService } from 'src/services/auth-service';
import type { Event } from 'src/models/Event';
import AdminEventFilters from 'src/components/admin/AdminEventFilters.vue';
import AdminEventsList from 'src/components/admin/AdminEventsList.vue';
import AdminEventBulkActions from 'src/components/admin/AdminEventBulkActions.vue';
import EventFormDialog from 'src/components/events/EventFormDialog.vue';

const { t } = useI18n();

const $q = useQuasar();
const eventsStore = useEventsFirebaseStore();
const gamesStore = useGamesFirebaseStore();

// Event admin composable for selection, bulk actions, and filtering
const eventAdmin = useEventAdmin({
  onDeleted: () => {
    // Refresh events list after bulk delete
  },
  onCancelled: () => {
    // Refresh events list after bulk cancel
  },
  onError: (error) => {
    console.error('Event admin error:', error);
  },
});

// Dialog state
const showEventDialog = ref(false);
const editingEvent = ref<Event | null>(null);

// Computed: Game options for filters
const gameOptions = computed(() => {
  return eventAdmin.availableGameIds.value.map((gameId) => {
    const game = gamesStore.games.find((g) => g.id === gameId);
    return {
      label: game?.title ?? gameId,
      value: gameId,
    };
  });
});

// Computed: Games map for list component
const gamesMap = computed(() => {
  const map = new Map<string, { id: string; title: string }>();
  gamesStore.games.forEach((game) => {
    map.set(game.id, { id: game.id, title: game.title });
  });
  return map;
});

// Stats computed
const upcomingCount = computed(
  () => eventsStore.events.filter((e) => e.status === 'upcoming').length,
);
const completedCount = computed(
  () => eventsStore.events.filter((e) => e.status === 'completed').length,
);
const cancelledCount = computed(
  () => eventsStore.events.filter((e) => e.status === 'cancelled').length,
);

// Methods
const openAddDialog = () => {
  editingEvent.value = null;
  showEventDialog.value = true;
};

const openEditDialog = (event: Event) => {
  editingEvent.value = event;
  showEventDialog.value = true;
};

const handleEventSubmitted = () => {
  $q.notify({
    type: 'positive',
    message: t('eventForm.eventCreated'),
    icon: 'mdi-check-circle',
  });
};

const handleEventUpdated = (eventId: string) => {
  console.log('Event updated:', eventId);
};

// Single event actions
const handleCancel = async (event: Event) => {
  await eventAdmin.cancelWithConfirm(event);
};

const handleDelete = async (event: Event) => {
  await eventAdmin.deleteWithConfirm(event);
};

// Bulk actions with confirmation
const handleBulkCancel = () => {
  $q.dialog({
    title: t('adminEvents.cancelAllTitle'),
    message: t('adminEvents.areYouSureCancel', { count: eventAdmin.selectedCount.value }),
    cancel: true,
    persistent: true,
    color: 'warning',
  }).onOk(() => {
    void eventAdmin.bulkCancel();
  });
};

const handleBulkDelete = () => {
  $q.dialog({
    title: t('deleteAll'),
    message: t('adminEvents.areYouSureDelete', { count: eventAdmin.selectedCount.value }),
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    void eventAdmin.bulkDelete();
  });
};

// Initialize
onMounted(async () => {
  if (!authService.isAuthenticated.value) {
    $q.notify({
      type: 'negative',
      message: t('loginRequired'),
      icon: 'mdi-alert-circle',
    });
    return;
  }

  // Subscribe to real-time updates
  eventsStore.subscribeToEvents();

  // Load games for display
  if (gamesStore.games.length === 0) {
    await gamesStore.loadGames();
  }
});

onUnmounted(() => {
  eventsStore.cleanup();
});
</script>

<template>
  <q-page padding class="admin-events">
    <!-- Page Header -->
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <h1 class="text-h4 q-mb-xs">{{ t('adminEvents.title') }}</h1>
          <p class="text-body1 text-grey-6 q-mb-none">
            {{ t('adminEvents.subtitle') }}
          </p>
        </div>
        <q-btn
          color="primary"
          icon="mdi-calendar-plus"
          :label="t('adminEvents.addEvent')"
          @click="openAddDialog"
          unelevated
          :aria-label="t('adminEvents.addEvent')"
        />
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-sm-3">
        <q-card bordered class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="mdi-calendar-multiple" size="md" color="primary" />
            <div class="text-h4 q-mt-sm">{{ eventsStore.events.length }}</div>
            <div class="text-caption text-grey-6">{{ t('adminEvents.totalEvents') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card bordered class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="mdi-calendar-clock" size="md" color="positive" />
            <div class="text-h4 q-mt-sm">{{ upcomingCount }}</div>
            <div class="text-caption text-grey-6">{{ t('upcoming') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card bordered class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="mdi-calendar-check" size="md" color="info" />
            <div class="text-h4 q-mt-sm">{{ completedCount }}</div>
            <div class="text-caption text-grey-6">{{ t('completed') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card bordered class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="mdi-calendar-remove" size="md" color="negative" />
            <div class="text-h4 q-mt-sm">{{ cancelledCount }}</div>
            <div class="text-caption text-grey-6">{{ t('cancelled') }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <AdminEventBulkActions
      :selected-count="eventAdmin.selectedCount.value"
      :processing="eventAdmin.isProcessing.value"
      @cancel="handleBulkCancel"
      @delete="handleBulkDelete"
      @deselect-all="eventAdmin.deselectAll"
    />

    <!-- Filters -->
    <AdminEventFilters
      :search="eventAdmin.filters.value.search"
      :status="eventAdmin.filters.value.status"
      :game-id="eventAdmin.filters.value.gameId"
      :sort-by="eventAdmin.filters.value.sortBy"
      :sort-order="eventAdmin.filters.value.sortOrder"
      :game-options="gameOptions"
      :has-active-filters="eventAdmin.hasActiveFilters.value"
      :total-count="eventsStore.events.length"
      :filtered-count="eventAdmin.filteredEvents.value.length"
      @update:search="eventAdmin.filters.value.search = $event"
      @update:status="eventAdmin.filters.value.status = $event"
      @update:game-id="eventAdmin.filters.value.gameId = $event"
      @update:sort-by="eventAdmin.filters.value.sortBy = $event"
      @update:sort-order="eventAdmin.filters.value.sortOrder = $event"
      @reset="eventAdmin.resetFilters"
      class="q-mb-lg"
    />

    <!-- Events List -->
    <AdminEventsList
      :events="eventAdmin.filteredEvents.value"
      :selected-ids="eventAdmin.selectedEventIds.value"
      :games="gamesMap"
      :loading="eventsStore.loading"
      :processing="eventAdmin.isProcessing.value"
      @toggle="eventAdmin.toggleEventSelection"
      @select-all="eventAdmin.selectAll"
      @deselect-all="eventAdmin.deselectAll"
      @edit="openEditDialog"
      @cancel="handleCancel"
      @delete="handleDelete"
    />

    <!-- Event Form Dialog -->
    <EventFormDialog
      v-model="showEventDialog"
      :event="editingEvent"
      :is-admin="true"
      @submitted="handleEventSubmitted"
      @updated="handleEventUpdated"
    />
  </q-page>
</template>

<style scoped>
.admin-events {
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

