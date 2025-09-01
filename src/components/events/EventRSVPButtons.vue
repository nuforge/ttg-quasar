<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
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
const eventsStore = useEventsFirebaseStore();
const rsvpLoading = ref(false);
const interestLoading = ref(false);

// Get current user's RSVP status from store (reactive)
const currentUserRSVP = computed(() => {
  const currentPlayer = authService.currentPlayer.value;
  console.log('DEBUG: currentPlayer =', currentPlayer);
  console.log('DEBUG: props.event.id =', props.event.id);
  console.log('DEBUG: eventsStore.events.length =', eventsStore.events.length);

  if (!currentPlayer) return null;

  // Get the latest event data from the store
  const storeEvent = eventsStore.events.find(e => e.id === props.event.id);
  console.log('DEBUG: storeEvent found =', !!storeEvent);
  if (!storeEvent) return null;

  const rsvp = storeEvent.getPlayerRSVP(currentPlayer.id);
  console.log('DEBUG: RSVP from store =', rsvp);
  return rsvp;
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
  console.log('DEBUG: handleConfirm called, isConfirmed =', isConfirmed.value);
  console.log('DEBUG: currentUserRSVP =', currentUserRSVP.value);

  if (!isAuthenticated.value) {
    $q.notify({
      type: 'negative',
      message: 'Please log in to RSVP to events'
    });
    return;
  }

  rsvpLoading.value = true;
  try {
    if (hasNoRSVP.value) {
      await eventsStore.joinEvent(props.event);
      $q.notify({
        type: 'positive',
        message: 'Successfully RSVP\'d!'
      });
    } else {
      // If already have RSVP, join as confirmed (will replace existing)
      await eventsStore.joinEvent(props.event);
      $q.notify({
        type: 'positive',
        message: 'RSVP confirmed!'
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update RSVP'
    });
  } finally {
    rsvpLoading.value = false;
  }
};

const handleCancel = async () => {
  console.log('DEBUG: handleCancel called (UN-RSVP button clicked), isConfirmed =', isConfirmed.value);
  console.log('DEBUG: currentUserRSVP =', currentUserRSVP.value);

  rsvpLoading.value = true;
  try {
    await eventsStore.leaveEvent(props.event);
    $q.notify({
      type: 'positive',
      message: 'RSVP cancelled'
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to cancel RSVP'
    });
  } finally {
    rsvpLoading.value = false;
  }
};

const handleInterested = async () => {
  console.log('DEBUG: handleInterested called, isInterested =', isInterested.value);
  console.log('DEBUG: currentUserRSVP =', currentUserRSVP.value);

  if (!isAuthenticated.value) {
    $q.notify({
      type: 'negative',
      message: 'Please log in to show interest in events'
    });
    return;
  }

  interestLoading.value = true;
  try {
    console.log('🚀 About to call eventsStore.toggleInterest with event:', props.event.title);
    await eventsStore.toggleInterest(props.event);
    console.log('✅ toggleInterest completed successfully');
    $q.notify({
      type: 'positive',
      message: isInterested.value ? 'Interest removed' : 'Marked as interested!'
    });
  } catch (error) {
    console.error('❌ toggleInterest failed:', error);
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to toggle interest'
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
      <q-btn color="primary" :size="size" icon="mdi-login" :label="showLabels ? 'Login to RSVP' : undefined" to="/login"
        unelevated />
    </div>

    <!-- Host cannot change RSVP -->
    <div v-else-if="isHost" class="text-center">
      <q-chip color="green" icon="mdi-crown" :size="size" outline>
        {{ showLabels ? 'Event Host' : 'Host' }}
      </q-chip>
    </div>

    <!-- RSVP and Interest Buttons -->
    <div v-else class="column wrap q-gutter-xs">
      <!-- RSVP Button -->
      <q-btn flat :loading="rsvpLoading" :color="isConfirmed ? 'green' : 'grey'" :size="size" dense
        :icon="isConfirmed ? 'mdi-calendar-check' : 'mdi-calendar-plus'"
        :label="showLabels ? (isConfirmed ? 'RSVP\'d' : 'RSVP') : undefined"
        @click.stop="() => { console.log('DEBUG: RSVP button clicked, isConfirmed =', isConfirmed); isConfirmed ? handleCancel() : handleConfirm(); }"
        :disabled="!isConfirmed && event.isFull() && !isInterested" unelevated>
        <q-tooltip v-if="!isConfirmed && event.isFull() && !isInterested">Event is full</q-tooltip>
        <q-tooltip v-else-if="isConfirmed">Click to UN-RSVP</q-tooltip>
        <q-tooltip v-else-if="isInterested">Click to RSVP (upgrade from interested)</q-tooltip>
        <q-tooltip v-else>Click to RSVP (confirmed attendance)</q-tooltip>
      </q-btn>

      <!-- Interested Button -->
      <q-btn flat :loading="interestLoading" :color="isInterested ? 'orange' : 'grey-6'" :size="size" dense
        :icon="isInterested ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
        :label="showLabels ? (isInterested ? 'Interested' : 'Interest') : undefined"
        @click.stop="() => { console.log('DEBUG: Interest button clicked, isInterested =', isInterested); handleInterested(); }"
        unelevated>
        <q-tooltip v-if="isInterested">Click to remove interest</q-tooltip>
        <q-tooltip v-else>Click to show interest (no commitment)</q-tooltip>
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
