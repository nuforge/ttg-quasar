import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import type { Event, EventStatus } from 'src/models/Event';

export type EventStatusFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';
export type EventSortField = 'title' | 'date' | 'status' | 'createdAt';
export type EventSortOrder = 'asc' | 'desc';

export interface EventFilters {
  search: string;
  status: EventStatusFilter;
  gameId: string | null;
  sortBy: EventSortField;
  sortOrder: EventSortOrder;
}

export interface EventAdminOptions {
  onDeleted?: (eventIds: string[]) => void;
  onCancelled?: (eventIds: string[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Composable for event administration operations
 * Handles selection, bulk actions, filtering, and CRUD operations
 */
export function useEventAdmin(options: EventAdminOptions = {}) {
  const $q = useQuasar();
  const eventsStore = useEventsFirebaseStore();

  // Selection state
  const selectedEventIds = ref<Set<string>>(new Set());
  const isProcessing = ref(false);

  // Filter state
  const filters = ref<EventFilters>({
    search: '',
    status: 'all',
    gameId: null,
    sortBy: 'date',
    sortOrder: 'asc',
  });

  // Computed getters
  const selectedCount = computed(() => selectedEventIds.value.size);
  const hasSelection = computed(() => selectedEventIds.value.size > 0);

  const selectedEvents = computed(() => {
    return eventsStore.events.filter((e) =>
      selectedEventIds.value.has(e.firebaseDocId ?? e.id.toString()),
    );
  });

  // Filter events based on current filters
  const filteredEvents = computed(() => {
    let result = [...eventsStore.events];

    // Status filter
    if (filters.value.status !== 'all') {
      result = result.filter((event) => event.status === filters.value.status);
    }

    // Game filter
    if (filters.value.gameId) {
      result = result.filter((event) => event.gameId === filters.value.gameId);
    }

    // Search filter
    if (filters.value.search.trim()) {
      const searchLower = filters.value.search.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower) ||
          event.host.name.toLowerCase().includes(searchLower),
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      const field = filters.value.sortBy;

      if (field === 'date') {
        comparison = a.getDateObject().getTime() - b.getDateObject().getTime();
      } else if (field === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (field === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (field === 'createdAt') {
        const aTime = a.createdAt?.getTime() ?? 0;
        const bTime = b.createdAt?.getTime() ?? 0;
        comparison = aTime - bTime;
      }

      return filters.value.sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  });

  // Available game IDs from all events
  const availableGameIds = computed(() => {
    const gameIds = new Set<string>();
    eventsStore.events.forEach((event) => {
      if (event.gameId) gameIds.add(event.gameId);
    });
    return Array.from(gameIds);
  });

  // Selection actions
  const selectEvent = (eventId: string) => {
    selectedEventIds.value.add(eventId);
  };

  const deselectEvent = (eventId: string) => {
    selectedEventIds.value.delete(eventId);
  };

  const toggleEventSelection = (eventId: string) => {
    if (selectedEventIds.value.has(eventId)) {
      selectedEventIds.value.delete(eventId);
    } else {
      selectedEventIds.value.add(eventId);
    }
  };

  const selectAll = () => {
    filteredEvents.value.forEach((event) => {
      const id = event.firebaseDocId ?? event.id.toString();
      selectedEventIds.value.add(id);
    });
  };

  const deselectAll = () => {
    selectedEventIds.value.clear();
  };

  const isSelected = (eventId: string) => selectedEventIds.value.has(eventId);

  // Bulk actions
  const bulkCancel = async (): Promise<void> => {
    if (!hasSelection.value) return;

    isProcessing.value = true;
    const ids = Array.from(selectedEventIds.value);
    const errors: string[] = [];

    try {
      for (const id of ids) {
        try {
          await eventsStore.updateEvent(id, { status: 'cancelled' as EventStatus });
        } catch (err) {
          errors.push(id);
          console.error(`Failed to cancel event ${id}:`, err);
        }
      }

      if (errors.length === 0) {
        $q.notify({
          type: 'positive',
          message: `Successfully cancelled ${ids.length} event(s)`,
          icon: 'mdi-check-circle',
        });
        options.onCancelled?.(ids);
        deselectAll();
      } else {
        $q.notify({
          type: 'warning',
          message: `Cancelled ${ids.length - errors.length} event(s), ${errors.length} failed`,
          icon: 'mdi-alert',
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Bulk cancel failed');
      options.onError?.(error);
      $q.notify({
        type: 'negative',
        message: 'Bulk cancel operation failed',
        icon: 'mdi-alert-circle',
      });
    } finally {
      isProcessing.value = false;
    }
  };

  const bulkDelete = async (): Promise<void> => {
    if (!hasSelection.value) return;

    isProcessing.value = true;
    const ids = Array.from(selectedEventIds.value);
    const errors: string[] = [];

    try {
      for (const id of ids) {
        try {
          await eventsStore.deleteEvent(id);
        } catch (err) {
          errors.push(id);
          console.error(`Failed to delete event ${id}:`, err);
        }
      }

      if (errors.length === 0) {
        $q.notify({
          type: 'positive',
          message: `Deleted ${ids.length} event(s)`,
          icon: 'mdi-delete',
        });
        options.onDeleted?.(ids);
        deselectAll();
      } else {
        $q.notify({
          type: 'warning',
          message: `Deleted ${ids.length - errors.length} event(s), ${errors.length} failed`,
          icon: 'mdi-alert',
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Bulk delete failed');
      options.onError?.(error);
      $q.notify({
        type: 'negative',
        message: 'Bulk delete operation failed',
        icon: 'mdi-alert-circle',
      });
    } finally {
      isProcessing.value = false;
    }
  };

  // Single event actions with confirmation
  const cancelWithConfirm = (event: Event): Promise<boolean> => {
    return new Promise((resolve) => {
      $q.dialog({
        title: 'Cancel Event',
        message: `Are you sure you want to cancel "${event.title}"? All attendees will be notified.`,
        cancel: true,
        persistent: true,
        color: 'warning',
      })
        .onOk(() => {
          void (async () => {
            try {
              const docId = event.firebaseDocId ?? event.id.toString();
              await eventsStore.updateEvent(docId, { status: 'cancelled' as EventStatus });
              $q.notify({
                type: 'positive',
                message: `"${event.title}" cancelled`,
                icon: 'mdi-cancel',
              });
              resolve(true);
            } catch {
              $q.notify({
                type: 'negative',
                message: 'Failed to cancel event',
                icon: 'mdi-alert-circle',
              });
              resolve(false);
            }
          })();
        })
        .onCancel(() => resolve(false));
    });
  };

  const deleteWithConfirm = (event: Event): Promise<boolean> => {
    return new Promise((resolve) => {
      $q.dialog({
        title: 'Delete Event',
        message: `Are you sure you want to permanently delete "${event.title}"? This action cannot be undone.`,
        cancel: true,
        persistent: true,
        color: 'negative',
      })
        .onOk(() => {
          void (async () => {
            try {
              const docId = event.firebaseDocId ?? event.id.toString();
              await eventsStore.deleteEvent(docId);
              $q.notify({
                type: 'positive',
                message: `"${event.title}" deleted`,
                icon: 'mdi-delete',
              });
              resolve(true);
            } catch {
              $q.notify({
                type: 'negative',
                message: 'Failed to delete event',
                icon: 'mdi-alert-circle',
              });
              resolve(false);
            }
          })();
        })
        .onCancel(() => resolve(false));
    });
  };

  // Filter actions
  const resetFilters = () => {
    filters.value = {
      search: '',
      status: 'all',
      gameId: null,
      sortBy: 'date',
      sortOrder: 'asc',
    };
  };

  const hasActiveFilters = computed(() => {
    return (
      filters.value.search !== '' ||
      filters.value.status !== 'all' ||
      filters.value.gameId !== null
    );
  });

  return {
    // State
    selectedEventIds,
    isProcessing,
    filters,

    // Computed
    selectedCount,
    hasSelection,
    selectedEvents,
    filteredEvents,
    availableGameIds,
    hasActiveFilters,

    // Selection actions
    selectEvent,
    deselectEvent,
    toggleEventSelection,
    selectAll,
    deselectAll,
    isSelected,

    // Bulk actions
    bulkCancel,
    bulkDelete,

    // Single actions with dialogs
    cancelWithConfirm,
    deleteWithConfirm,

    // Filter actions
    resetFilters,
  };
}

