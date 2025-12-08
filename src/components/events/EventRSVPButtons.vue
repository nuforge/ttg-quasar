<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Event } from 'src/models/Event';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { authService } from 'src/services/auth-service';

defineOptions({
  name: 'EventRSVPButtons',
});

const props = defineProps({
  event: {
    type: Object as () => Event,
    required: true
  },
  showLabels: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'md'
  }
});

const $q = useQuasar();
const { t } = useI18n();
const eventsStore = useEventsFirebaseStore();
const rsvpLoading = ref(false);
const interestLoading = ref(false);

// Get current user's RSVP status from store (reactive)
const currentUserRSVP = computed(() => {
  const currentPlayer = authService.currentPlayer.value;
  if (!currentPlayer) return null;

  // Get the latest event data from the store
  const storeEvent = eventsStore.events.find(e => e.id === props.event.id);
  if (!storeEvent) return null;

  return storeEvent.getPlayerRSVP(currentPlayer.id);
});

const isConfirmed = computed(() => {
  const currentPlayer = authService.currentPlayer.value;
  if (!currentPlayer) return false;

  const storeEvent = eventsStore.events.find(e => e.id === props.event.id);
  return storeEvent?.isPlayerConfirmed(currentPlayer.id) || false;
});

const isInterested = computed(() => {
  const currentPlayer = authService.currentPlayer.value;
  if (!currentPlayer) return false;

  const storeEvent = eventsStore.events.find(e => e.id === props.event.id);
  return storeEvent?.isPlayerInterested(currentPlayer.id) || false;
});

const hasNoRSVP = computed(() => !currentUserRSVP.value);

// Check if user is authenticated
const isAuthenticated = computed(() => authService.isAuthenticated.value);

// Check if user is the host
const isHost = computed(() => {
  const currentPlayer = authService.currentPlayer.value;
  return currentPlayer && props.event.host.playerId === currentPlayer.id;
});

const handleConfirm = async () => {
  if (!isAuthenticated.value) {
    $q.notify({
      type: 'negative',
      message: t('loginRequiredRsvp')
    });
    return;
  }

  rsvpLoading.value = true;
  try {
    if (hasNoRSVP.value) {
      await eventsStore.joinEvent(props.event);
      $q.notify({
        type: 'positive',
        message: t('rsvpConfirmed')
      });
    } else {
      // If already have RSVP, join as confirmed (will replace existing)
      await eventsStore.joinEvent(props.event);
      $q.notify({
        type: 'positive',
        message: t('rsvpConfirmed')
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : t('rsvpFailed')
    });
  } finally {
    rsvpLoading.value = false;
  }
};

const handleCancel = async () => {
  rsvpLoading.value = true;
  try {
    await eventsStore.leaveEvent(props.event);
    $q.notify({
      type: 'positive',
      message: t('rsvpCancelled')
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : t('rsvpFailed')
    });
  } finally {
    rsvpLoading.value = false;
  }
};

const handleInterested = async () => {
  if (!isAuthenticated.value) {
    $q.notify({
      type: 'negative',
      message: t('loginRequiredInterest')
    });
    return;
  }

  interestLoading.value = true;
  try {
    await eventsStore.toggleInterest(props.event);
    $q.notify({
      type: 'positive',
      message: isInterested.value ? t('interestRemoved') : t('interestAdded')
    });
  } catch (error) {
    console.error('❌ toggleInterest failed:', error);
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : t('interestFailed')
    });
  } finally {
    interestLoading.value = false;
  }
};
</script>

<template>
  <div class="event-rsvp-buttons">
    <!-- Not authenticated -->
    <div v-if="!isAuthenticated" class="text-center">
      <q-btn flat color="primary" dense :size="size" icon="mdi-login"
        :label="showLabels ? t('loginRequiredRsvp') : undefined" to="/login" unelevated />
    </div>

    <!-- Host cannot change RSVP -->
    <div v-else-if="isHost" class="text-center">
      <q-chip color="primary" icon="mdi-crown" :size="size" outline>
        {{ showLabels ? t('eventHost') : t('host') }}
      </q-chip>
    </div>

    <!-- RSVP and Interest Buttons -->
    <div v-else class="column wrap q-gutter-xs">
      <!-- RSVP Button -->
      <q-btn flat :loading="rsvpLoading" :color="isConfirmed ? 'primary' : 'grey'" :size="size" dense
        :icon="isConfirmed ? 'mdi-calendar-check' : 'mdi-calendar-plus'"
        :label="showLabels ? (isConfirmed ? t('rsvpd') : t('rsvp')) : undefined"
        @click.stop="isConfirmed ? handleCancel() : handleConfirm()"
        :disabled="!isConfirmed && event.isFull() && !isInterested" unelevated>
        <q-tooltip v-if="!isConfirmed && event.isFull() && !isInterested">{{ t('eventIsFull') }}</q-tooltip>
        <q-tooltip v-else-if="isConfirmed">{{ t('clickToUnRsvp') }}</q-tooltip>
        <q-tooltip v-else-if="isInterested">{{ t('clickToRsvpUpgrade') }}</q-tooltip>
        <q-tooltip v-else>{{ t('clickToRsvp') }}</q-tooltip>
      </q-btn>

      <!-- Interested Button -->
      <q-btn flat :loading="interestLoading" :color="isInterested ? 'orange' : 'grey-6'" :size="size" dense
        :icon="isInterested ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
        :label="showLabels ? (isInterested ? t('interested') : t('interest')) : undefined"
        @click.stop="handleInterested" unelevated>
        <q-tooltip v-if="isInterested">{{ t('clickToRemoveInterest') }}</q-tooltip>
        <q-tooltip v-else>{{ t('clickToShowInterest') }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<style scoped>
.event-rsvp-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.row {
  align-items: center;
  gap: 4px;
}
</style>
