<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventFormatters } from 'src/composables/useEventFormatters';
import type { Event } from 'src/models/Event';

const { t } = useI18n();
const formatters = useEventFormatters();

interface GameInfo {
  id: string;
  title: string;
}

interface Props {
  events: Event[];
  selectedIds: Set<string>;
  games: Map<string, GameInfo>;
  loading?: boolean;
  processing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  processing: false,
});

const emit = defineEmits<{
  toggle: [eventId: string];
  selectAll: [];
  deselectAll: [];
  edit: [event: Event];
  cancel: [event: Event];
  delete: [event: Event];
}>();

// Pagination
const pagination = ref({ page: 1, rowsPerPage: 10 });

// Table columns definition
const columns = computed(() => [
  { name: 'select', label: '', field: 'id', align: 'center' as const, style: 'width: 50px' },
  { name: 'title', label: t('title'), field: 'title', align: 'left' as const, sortable: true },
  { name: 'game', label: t('game', 1), field: 'gameId', align: 'left' as const, sortable: true },
  { name: 'date', label: t('date'), field: 'date', align: 'left' as const, sortable: true },
  { name: 'time', label: t('time'), field: 'time', align: 'left' as const },
  { name: 'host', label: t('host'), field: 'host', align: 'left' as const },
  { name: 'attendance', label: t('adminEvents.attendance'), field: 'rsvps', align: 'center' as const },
  { name: 'status', label: t('status'), field: 'status', align: 'center' as const, sortable: true },
  { name: 'actions', label: t('actions'), field: 'id', align: 'right' as const },
]);

// Computed
const allSelected = computed(() => {
  return props.events.length > 0 && props.events.every((e) => {
    const id = e.firebaseDocId ?? e.id.toString();
    return props.selectedIds.has(id);
  });
});

const someSelected = computed(() => props.selectedIds.size > 0 && !allSelected.value);

const getEventId = (event: Event): string => event.firebaseDocId ?? event.id.toString();
const isSelected = (event: Event) => props.selectedIds.has(getEventId(event));
const getGameTitle = (gameId: string): string => props.games.get(gameId)?.title ?? t('unknown');

// Selection handlers
const toggleSelectAll = () => {
  if (allSelected.value) {
    emit('deselectAll');
  } else {
    emit('selectAll');
  }
};
</script>

<template>
  <q-card bordered class="admin-events-list">
    <!-- Loading state -->
    <q-inner-loading :showing="loading">
      <q-spinner-dots size="50px" color="primary" />
    </q-inner-loading>

    <!-- Empty state -->
    <q-card-section v-if="!loading && events.length === 0" class="text-center q-pa-xl">
      <q-icon name="mdi-calendar-blank-outline" size="64px" color="grey-5" />
      <h6 class="text-h6 q-mt-md q-mb-sm">{{ t('adminEvents.noEventsFound') }}</h6>
      <p class="text-body2 text-grey-6">
        {{ t('adminEvents.tryAdjustingFiltersOrAdd') }}
      </p>
    </q-card-section>

    <!-- Table -->
    <q-table
      v-else
      :rows="events"
      :columns="columns"
      :row-key="getEventId"
      flat
      bordered
      :pagination="pagination"
      :loading="loading"
      binary-state-sort
      class="events-table"
    >
      <!-- Header checkbox -->
      <template #header-cell-select>
        <q-th class="text-center">
          <q-checkbox
            :model-value="allSelected"
            :indeterminate="someSelected"
            @update:model-value="toggleSelectAll"
            :disable="loading || processing"
            :aria-label="t('adminEvents.selectAllEvents')"
          />
        </q-th>
      </template>

      <!-- Body -->
      <template #body="tableProps">
        <q-tr :props="tableProps" :class="{ 'bg-grey-9': isSelected(tableProps.row) }">
          <!-- Selection checkbox -->
          <q-td key="select" :props="tableProps" class="text-center">
            <q-checkbox
              :model-value="isSelected(tableProps.row)"
              @update:model-value="emit('toggle', getEventId(tableProps.row))"
              :disable="loading || processing"
              :aria-label="`Select ${tableProps.row.title}`"
            />
          </q-td>

          <!-- Title -->
          <q-td key="title" :props="tableProps">
            <div class="text-weight-medium">{{ tableProps.row.title }}</div>
            <div class="text-caption text-grey-6">
              {{ tableProps.row.location }}
            </div>
          </q-td>

          <!-- Game -->
          <q-td key="game" :props="tableProps">
            <q-chip
              :label="getGameTitle(tableProps.row.gameId)"
              size="sm"
              color="primary"
              text-color="white"
              dense
            />
          </q-td>

          <!-- Date -->
          <q-td key="date" :props="tableProps">
            {{ formatters.formatDate(tableProps.row.date) }}
          </q-td>

          <!-- Time -->
          <q-td key="time" :props="tableProps">
            {{ formatters.formatTime(tableProps.row.time) }} - {{ formatters.formatTime(tableProps.row.endTime) }}
          </q-td>

          <!-- Host -->
          <q-td key="host" :props="tableProps">
            <div>{{ tableProps.row.host.name }}</div>
            <div v-if="tableProps.row.host.email" class="text-caption text-grey-6">
              {{ tableProps.row.host.email }}
            </div>
          </q-td>

          <!-- Attendance -->
          <q-td key="attendance" :props="tableProps" class="text-center">
            <q-chip
              :label="formatters.getAttendanceInfo(tableProps.row)"
              :color="formatters.getAttendanceColor(tableProps.row)"
              text-color="white"
              size="sm"
              dense
              icon="mdi-account-group"
            >
              <q-tooltip>
                {{ t('adminEvents.confirmedRsvps') }}: {{ tableProps.row.getConfirmedCount() }}
                <br />
                {{ t('adminEvents.interestedRsvps') }}: {{ tableProps.row.getInterestedCount() }}
                <br />
                {{ t('maxPlayers') }}: {{ tableProps.row.maxPlayers }}
              </q-tooltip>
            </q-chip>
          </q-td>

          <!-- Status -->
          <q-td key="status" :props="tableProps" class="text-center">
            <q-chip
              :label="t(tableProps.row.status)"
              :color="formatters.getStatusColor(tableProps.row.status)"
              :icon="formatters.getStatusIcon(tableProps.row.status)"
              text-color="white"
              size="sm"
              dense
            />
          </q-td>

          <!-- Actions -->
          <q-td key="actions" :props="tableProps" class="text-right">
            <q-btn-group flat>
              <!-- Edit -->
              <q-btn
                flat
                dense
                round
                icon="mdi-pencil"
                color="info"
                @click="emit('edit', tableProps.row)"
                :disable="processing"
                :aria-label="t('adminEvents.editEvent')"
              >
                <q-tooltip>{{ t('edit') }}</q-tooltip>
              </q-btn>

              <!-- Cancel (only for upcoming) -->
              <q-btn
                v-if="tableProps.row.status === 'upcoming'"
                flat
                dense
                round
                icon="mdi-calendar-remove"
                color="warning"
                @click="emit('cancel', tableProps.row)"
                :disable="processing"
                :aria-label="t('adminEvents.cancelEvent')"
              >
                <q-tooltip>{{ t('cancel') }}</q-tooltip>
              </q-btn>

              <!-- Delete -->
              <q-btn
                flat
                dense
                round
                icon="mdi-delete"
                color="negative"
                @click="emit('delete', tableProps.row)"
                :disable="processing"
                :aria-label="t('adminEvents.deleteEvent')"
              >
                <q-tooltip>{{ t('delete') }}</q-tooltip>
              </q-btn>
            </q-btn-group>
          </q-td>
        </q-tr>
      </template>

      <!-- Pagination -->
      <template #bottom="scope">
        <div class="row items-center justify-between full-width q-pa-sm">
          <div class="text-caption text-grey-6">
            {{ selectedIds.size > 0 ? `${selectedIds.size} ${t('selected')}` : '' }}
          </div>
          <q-pagination
            v-model="scope.pagination.page"
            :max="scope.pagesNumber"
            :max-pages="6"
            direction-links
            boundary-links
            icon-first="mdi-chevron-double-left"
            icon-last="mdi-chevron-double-right"
            icon-prev="mdi-chevron-left"
            icon-next="mdi-chevron-right"
          />
          <q-select
            v-model="scope.pagination.rowsPerPage"
            :options="[5, 10, 20, 50]"
            :label="t('perPage')"
            dense
            borderless
            style="min-width: 80px"
          />
        </div>
      </template>
    </q-table>
  </q-card>
</template>

<style scoped>
.events-table :deep(.q-table__top),
.events-table :deep(.q-table__bottom),
.events-table :deep(thead tr:first-child th) {
  background-color: var(--q-dark);
}

.events-table :deep(tbody td) {
  font-size: 0.875rem;
}
</style>

