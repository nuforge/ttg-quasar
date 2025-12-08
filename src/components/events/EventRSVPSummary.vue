<script setup lang="ts">
import { computed } from 'vue';
import type { Event } from 'src/models/Event';

defineOptions({
  name: 'EventRSVPSummary',
});

const props = defineProps({
  event: {
    type: Object as () => Event,
    required: true
  },
  showDetails: {
    type: Boolean,
    default: false
  }
});

const confirmedCount = computed(() => props.event.getConfirmedCount());
const interestedCount = computed(() => props.event.getInterestedCount());
const maxPlayers = computed(() => props.event.maxPlayers);
const spotsRemaining = computed(() => Math.max(0, maxPlayers.value - confirmedCount.value));

const fillPercentage = computed(() => {
  if (maxPlayers.value === 0) return 0;
  return Math.round((confirmedCount.value / maxPlayers.value) * 100);
});

const statusColor = computed(() => {
  if (confirmedCount.value >= maxPlayers.value) return 'primary';
  if (confirmedCount.value >= maxPlayers.value * 0.7) return 'secondrary';
  return 'blue';
});
</script>

<template>
  <div class="event-rsvp-summary">
    <!-- Main count display -->
    <div class="rsvp-counts q-mb-sm">
      <q-chip :color="statusColor" icon="mdi-account-check" :label="`${confirmedCount} / ${maxPlayers}`" size="md">
        <q-tooltip>Confirmed RSVPs</q-tooltip>
      </q-chip>

      <q-chip v-if="interestedCount > 0" color="orange" icon="mdi-heart" :label="`+${interestedCount}`" size="md"
        outline>
        <q-tooltip>Players showing interest</q-tooltip>
      </q-chip>
    </div>

    <!-- Progress bar for event filling -->
    <q-linear-progress :value="fillPercentage / 100" :color="statusColor" class="q-mb-sm" size="8px" rounded>
      <q-tooltip>{{ fillPercentage }}% full</q-tooltip>
    </q-linear-progress>

    <!-- Detailed breakdown -->
    <div v-if="showDetails" class="rsvp-details text-caption text-grey-6">
      <div class="row justify-between">
        <span>Confirmed: {{ confirmedCount }}</span>
        <span>Spots left: {{ spotsRemaining }}</span>
      </div>
      <div v-if="interestedCount > 0" class="row">
        <span class="text-orange">Interested: {{ interestedCount }}</span>
      </div>
    </div>

    <!-- Status messages -->
    <div v-if="spotsRemaining === 0" class="text-center q-mt-sm">
      <q-chip color="red" icon="mdi-account-off" size="sm">
        Event Full
      </q-chip>
    </div>
    <div v-else-if="spotsRemaining === 1" class="text-center q-mt-sm">
      <q-chip color="orange" icon="mdi-account-alert" size="sm">
        1 Spot Left
      </q-chip>
    </div>
  </div>
</template>

<style scoped>
.event-rsvp-summary {
  min-width: 120px;
}

.rsvp-counts {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
