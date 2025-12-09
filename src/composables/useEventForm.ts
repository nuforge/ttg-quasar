import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import type { Event } from 'src/models/Event';

export interface EventFormData {
  title: string;
  gameId: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  description: string;
  notes: string;
  minPlayers: number;
  maxPlayers: number;
  syncToGoogleCalendar: boolean;
}

export interface UseEventFormOptions {
  onSubmitted?: (eventId?: string) => void;
  onUpdated?: (eventId: string) => void;
}

/**
 * Composable for event form logic
 * Handles form state, validation, and submission
 */
export function useEventForm(options: UseEventFormOptions = {}) {
  const $q = useQuasar();
  const { t } = useI18n();
  const eventsStore = useEventsFirebaseStore();
  const gamesStore = useGamesFirebaseStore();

  const loading = ref(false);
  const editingEvent = ref<Event | null>(null);

  const getDefaultFormData = (): EventFormData => ({
    title: '',
    gameId: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    description: '',
    notes: '',
    minPlayers: 2,
    maxPlayers: 6,
    syncToGoogleCalendar: false,
  });

  const formData = ref<EventFormData>(getDefaultFormData());

  const isEditMode = computed(() => !!editingEvent.value);

  const gameOptions = computed(() =>
    gamesStore.approvedGames.map((game) => ({ label: game.title, value: game.id })),
  );

  const isFormValid = computed(() => {
    const d = formData.value;
    return !!(
      d.title && d.gameId && d.date && d.time && d.endTime && d.location &&
      d.minPlayers > 0 && d.maxPlayers >= d.minPlayers
    );
  });

  // Validation rules
  const requiredRule = (val: string | number) => !!val || t('fieldRequired');
  const minPlayersRule = (val: number) => val >= 1 || t('eventForm.minPlayersError');
  const maxPlayersRule = (val: number) =>
    val >= formData.value.minPlayers || t('eventForm.maxPlayersError');

  const setEvent = (event: Event | null) => {
    editingEvent.value = event;
    if (event) {
      formData.value = {
        title: event.title,
        gameId: event.gameId,
        date: event.date,
        time: event.time,
        endTime: event.endTime,
        location: event.location,
        description: event.description,
        notes: event.notes,
        minPlayers: event.minPlayers,
        maxPlayers: event.maxPlayers,
        syncToGoogleCalendar: !!event.googleCalendarEventId,
      };
    } else {
      formData.value = getDefaultFormData();
    }
  };

  const resetForm = () => {
    formData.value = getDefaultFormData();
    editingEvent.value = null;
  };

  const submitForm = async (): Promise<boolean> => {
    if (!isFormValid.value) {
      $q.notify({ type: 'negative', message: t('pleaseFillAllRequiredFields'), icon: 'mdi-alert-circle' });
      return false;
    }

    loading.value = true;
    try {
      if (isEditMode.value && editingEvent.value) {
        const docId = editingEvent.value.firebaseDocId ?? editingEvent.value.id.toString();
        await eventsStore.updateEvent(docId, { ...formData.value });
        $q.notify({ type: 'positive', message: t('eventForm.eventUpdated'), icon: 'mdi-check-circle' });
        options.onUpdated?.(docId);
      } else {
        const eventId = await eventsStore.createEvent({ ...formData.value });
        $q.notify({ type: 'positive', message: t('eventForm.eventCreated'), timeout: 5000, icon: 'mdi-check-circle' });
        options.onSubmitted?.(eventId);
      }
      return true;
    } catch (error) {
      console.error('Failed to save event:', error);
      $q.notify({
        type: 'negative',
        message: isEditMode.value ? t('eventForm.updateFailed') : t('eventForm.createFailed'),
        icon: 'mdi-alert-circle',
      });
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Auto-set end time when start time changes
  watch(() => formData.value.time, (newTime) => {
    if (newTime && !formData.value.endTime) {
      const [hours, minutes] = newTime.split(':').map(Number);
      const endHours = ((hours ?? 0) + 2) % 24;
      formData.value.endTime = `${endHours.toString().padStart(2, '0')}:${(minutes ?? 0).toString().padStart(2, '0')}`;
    }
  });

  // Load games if needed
  onMounted(async () => {
    if (gamesStore.games.length === 0) {
      await gamesStore.loadGames();
    }
  });

  return {
    formData,
    loading,
    isEditMode,
    isFormValid,
    gameOptions,
    requiredRule,
    minPlayersRule,
    maxPlayersRule,
    setEvent,
    resetForm,
    submitForm,
  };
}

