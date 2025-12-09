<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EventStatusFilter, EventSortField, EventSortOrder } from 'src/composables/useEventAdmin';

const { t } = useI18n();

interface GameOption {
  label: string;
  value: string;
}

interface Props {
  search: string;
  status: EventStatusFilter;
  gameId: string | null;
  sortBy: EventSortField;
  sortOrder: EventSortOrder;
  gameOptions: GameOption[];
  hasActiveFilters: boolean;
  totalCount: number;
  filteredCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:search': [value: string];
  'update:status': [value: EventStatusFilter];
  'update:gameId': [value: string | null];
  'update:sortBy': [value: EventSortField];
  'update:sortOrder': [value: EventSortOrder];
  reset: [];
}>();

// Status options
const statusOptions = computed(() => [
  { label: t('adminEvents.allEvents'), value: 'all' as EventStatusFilter, icon: 'mdi-calendar-multiple', color: 'grey-7' },
  { label: t('upcoming'), value: 'upcoming' as EventStatusFilter, icon: 'mdi-calendar-clock', color: 'positive' },
  { label: t('completed'), value: 'completed' as EventStatusFilter, icon: 'mdi-calendar-check', color: 'info' },
  { label: t('cancelled'), value: 'cancelled' as EventStatusFilter, icon: 'mdi-calendar-remove', color: 'negative' },
]);

// Sort options
const sortOptions = computed(() => [
  { label: t('date'), value: 'date' as EventSortField },
  { label: t('title'), value: 'title' as EventSortField },
  { label: t('status'), value: 'status' as EventSortField },
  { label: t('dateAdded'), value: 'createdAt' as EventSortField },
]);

// Game options with "All" option
const gameSelectOptions = computed(() => {
  return [
    { label: t('adminEvents.allGamesFilter'), value: null },
    ...props.gameOptions,
  ];
});

// Toggle sort order
const toggleSortOrder = () => {
  emit('update:sortOrder', props.sortOrder === 'asc' ? 'desc' : 'asc');
};
</script>

<template>
  <q-card bordered class="admin-filters">
    <q-card-section class="q-pb-none">
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle1 text-weight-medium">
          <q-icon name="mdi-filter-variant" class="q-mr-sm" />
          {{ t('filters') }}
        </div>
        <q-chip
          v-if="filteredCount !== totalCount"
          :label="`${filteredCount} / ${totalCount}`"
          color="primary"
          text-color="white"
          size="sm"
          dense
        />
      </div>
    </q-card-section>

    <q-card-section>
      <div class="row q-col-gutter-md items-end">
        <!-- Search -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-input
            :model-value="search"
            @update:model-value="(val) => emit('update:search', val as string)"
            :label="t('adminEvents.searchEvents')"
            outlined
            dense
            clearable
            debounce="300"
            :aria-label="t('adminEvents.searchEvents')"
          >
            <template #prepend>
              <q-icon name="mdi-magnify" />
            </template>
          </q-input>
        </div>

        <!-- Status Filter -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            :model-value="status"
            @update:model-value="(val) => emit('update:status', val as EventStatusFilter)"
            :options="statusOptions"
            :label="t('status')"
            outlined
            dense
            emit-value
            map-options
            :aria-label="t('filterByStatus')"
          >
            <template #option="{ opt, itemProps }">
              <q-item v-bind="itemProps">
                <q-item-section avatar>
                  <q-icon :name="opt.icon" :color="opt.color" />
                </q-item-section>
                <q-item-section>{{ opt.label }}</q-item-section>
              </q-item>
            </template>
            <template #selected-item="{ opt }">
              <q-icon :name="opt.icon" :color="opt.color" class="q-mr-sm" size="xs" />
              {{ opt.label }}
            </template>
          </q-select>
        </div>

        <!-- Game Filter -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            :model-value="gameId"
            @update:model-value="(val) => emit('update:gameId', val as string | null)"
            :options="gameSelectOptions"
            :label="t('filterByGame')"
            outlined
            dense
            emit-value
            map-options
            :aria-label="t('filterByGame')"
          />
        </div>

        <!-- Sort -->
        <div class="col-12 col-sm-6 col-md-3">
          <div class="row q-gutter-xs items-center">
            <q-select
              :model-value="sortBy"
              @update:model-value="(val) => emit('update:sortBy', val as EventSortField)"
              :options="sortOptions"
              :label="t('sortBy')"
              outlined
              dense
              emit-value
              map-options
              class="col"
              :aria-label="t('sortBy')"
            />
            <q-btn
              flat
              round
              dense
              :icon="sortOrder === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
              @click="toggleSortOrder"
              :aria-label="sortOrder === 'asc' ? t('sortAscending') : t('sortDescending')"
            >
              <q-tooltip>{{ sortOrder === 'asc' ? t('ascending') : t('descending') }}</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Active filters indicator / Reset -->
      <div v-if="hasActiveFilters" class="row items-center q-mt-md">
        <q-chip
          color="primary"
          text-color="white"
          icon="mdi-filter"
          :label="t('filtersActive')"
          size="sm"
          dense
        />
        <q-btn
          flat
          dense
          color="primary"
          :label="t('clearAll')"
          icon="mdi-filter-remove"
          class="q-ml-sm"
          @click="emit('reset')"
          :aria-label="t('clearFilters')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.admin-filters {
  background: var(--q-dark);
}
</style>

