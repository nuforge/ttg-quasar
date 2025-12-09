<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Game } from 'src/models/Game';
import { getGameImageUrl } from 'src/composables/useGameImage';

const { t } = useI18n();

interface Props {
  games: Game[];
  selectedIds: Set<string>;
  loading?: boolean;
  processing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  processing: false,
});

const emit = defineEmits<{
  select: [gameId: string];
  deselect: [gameId: string];
  toggle: [gameId: string];
  selectAll: [];
  deselectAll: [];
  approve: [game: Game];
  reject: [game: Game];
  edit: [game: Game];
  delete: [game: Game];
}>();

// Pagination
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
});

// Table columns definition
const columns = computed(() => [
  {
    name: 'select',
    label: '',
    field: 'id',
    align: 'center' as const,
    style: 'width: 50px',
  },
  {
    name: 'image',
    label: '',
    field: 'image',
    align: 'center' as const,
    style: 'width: 60px',
  },
  {
    name: 'title',
    label: t('title'),
    field: 'title',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'genre',
    label: t('genre'),
    field: 'genre',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'players',
    label: t('players'),
    field: 'numberOfPlayers',
    align: 'center' as const,
  },
  {
    name: 'status',
    label: t('status'),
    field: 'status',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'createdAt',
    label: t('dateAdded'),
    field: 'createdAt',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: t('actions'),
    field: 'id',
    align: 'right' as const,
  },
]);

// Computed
const allSelected = computed(() => {
  return props.games.length > 0 && props.games.every((g) => props.selectedIds.has(g.id));
});

const someSelected = computed(() => {
  return props.selectedIds.size > 0 && !allSelected.value;
});

const isSelected = (gameId: string) => props.selectedIds.has(gameId);

// Helper functions
const getStatusColor = (game: Game): string => {
  if (game.approved && game.status === 'active') return 'positive';
  if (game.status === 'pending') return 'warning';
  if (game.status === 'inactive') return 'negative';
  return 'grey';
};

const getStatusLabel = (game: Game): string => {
  if (game.approved && game.status === 'active') return t('approved');
  if (game.status === 'pending') return t('pending');
  if (game.status === 'inactive') return t('rejected');
  return game.status;
};

const formatDate = (date?: Date): string => {
  if (!date) return 'Unknown';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

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
  <q-card bordered class="admin-games-list">
    <!-- Loading state -->
    <q-inner-loading :showing="loading">
      <q-spinner-dots size="50px" color="primary" />
    </q-inner-loading>

    <!-- Empty state -->
    <q-card-section v-if="!loading && games.length === 0" class="text-center q-pa-xl">
      <q-icon name="mdi-gamepad-variant-outline" size="64px" color="grey-5" />
      <h6 class="text-h6 q-mt-md q-mb-sm">{{ t('noGamesFound') }}</h6>
      <p class="text-body2 text-grey-6">
        {{ t('tryAdjustingFiltersOrAdd') }}
      </p>
    </q-card-section>

    <!-- Table -->
    <q-table
      v-else
      :rows="games"
      :columns="columns"
      row-key="id"
      flat
      bordered
      :pagination="pagination"
      :loading="loading"
      binary-state-sort
      class="games-table"
    >
      <!-- Header checkbox -->
      <template #header-cell-select>
        <q-th class="text-center">
            <q-checkbox
              :model-value="allSelected"
              :indeterminate="someSelected"
              @update:model-value="toggleSelectAll"
              :disable="loading || processing"
              :aria-label="t('selectAllGames')"
            />
        </q-th>
      </template>

      <!-- Body -->
      <template #body="tableProps">
        <q-tr :props="tableProps" :class="{ 'bg-grey-9': isSelected(tableProps.row.id) }">
          <!-- Selection checkbox -->
          <q-td key="select" :props="tableProps" class="text-center">
            <q-checkbox
              :model-value="isSelected(tableProps.row.id)"
              @update:model-value="emit('toggle', tableProps.row.id)"
              :disable="loading || processing"
              :aria-label="`Select ${tableProps.row.title}`"
            />
          </q-td>

          <!-- Image -->
          <q-td key="image" :props="tableProps">
            <q-avatar size="40px" rounded>
              <q-img
                :src="getGameImageUrl(tableProps.row.image, tableProps.row.title)"
                :alt="tableProps.row.title"
                fit="cover"
                @error="($event.target as HTMLImageElement).src = getGameImageUrl(undefined)"
              />
            </q-avatar>
          </q-td>

          <!-- Title -->
          <q-td key="title" :props="tableProps">
            <div class="text-weight-medium">{{ tableProps.row.title }}</div>
            <div v-if="tableProps.row.publisher" class="text-caption text-grey-6">
              {{ tableProps.row.publisher }}
            </div>
          </q-td>

          <!-- Genre -->
          <q-td key="genre" :props="tableProps">
            <q-chip
              :label="tableProps.row.genre"
              size="sm"
              color="primary"
              text-color="white"
              dense
            />
          </q-td>

          <!-- Players -->
          <q-td key="players" :props="tableProps" class="text-center">
            {{ tableProps.row.numberOfPlayers }}
          </q-td>

          <!-- Status -->
          <q-td key="status" :props="tableProps" class="text-center">
            <q-chip
              :label="getStatusLabel(tableProps.row)"
              :color="getStatusColor(tableProps.row)"
              text-color="white"
              size="sm"
              dense
            />
          </q-td>

          <!-- Created At -->
          <q-td key="createdAt" :props="tableProps">
            <div>{{ formatDate(tableProps.row.createdAt) }}</div>
            <div v-if="tableProps.row.createdBy" class="text-caption text-grey-6">
              {{ t('by') }} {{ tableProps.row.createdBy }}
            </div>
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
                :aria-label="t('editGame')"
              >
                <q-tooltip>{{ t('edit') }}</q-tooltip>
              </q-btn>

              <!-- Approve (only for non-approved) -->
              <q-btn
                v-if="!tableProps.row.approved"
                flat
                dense
                round
                icon="mdi-check"
                color="positive"
                @click="emit('approve', tableProps.row)"
                :disable="processing"
                :aria-label="t('approveGame')"
              >
                <q-tooltip>{{ t('approve') }}</q-tooltip>
              </q-btn>

              <!-- Reject (only for pending) -->
              <q-btn
                v-if="tableProps.row.status === 'pending'"
                flat
                dense
                round
                icon="mdi-close"
                color="warning"
                @click="emit('reject', tableProps.row)"
                :disable="processing"
                :aria-label="t('rejectGame')"
              >
                <q-tooltip>{{ t('reject') }}</q-tooltip>
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
                :aria-label="t('deleteGame')"
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
.games-table :deep(.q-table__top),
.games-table :deep(.q-table__bottom),
.games-table :deep(thead tr:first-child th) {
  background-color: var(--q-dark);
}

.games-table :deep(tbody td) {
  font-size: 0.875rem;
}
</style>

