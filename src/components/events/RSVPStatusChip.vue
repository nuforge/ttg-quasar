<script setup lang="ts">
import { computed } from 'vue';
import type { Event } from 'src/models/Event';

defineOptions({
    name: 'RSVPStatusChip',
});

const props = defineProps({
    event: {
        type: Object as () => Event,
        required: true
    },
    playerId: {
        type: Number,
        required: true
    },
    size: {
        type: String,
        default: 'sm'
    }
});

const rsvpStatus = computed(() => {
    return props.event.getPlayerRSVP(props.playerId);
});

const statusConfig = computed(() => {
    if (!rsvpStatus.value) {
        return { color: 'grey-6', icon: 'mdi-help', label: 'No RSVP' };
    }

    switch (rsvpStatus.value.status) {
        case 'confirmed':
            return { color: 'positive', icon: 'mdi-check-circle', label: 'Confirmed' };
        case 'interested':
            return { color: 'warning', icon: 'mdi-heart', label: 'Interested' };
        case 'waiting':
            return { color: 'info', icon: 'mdi-clock-outline', label: 'Waiting' };
        case 'cancelled':
            return { color: 'negative', icon: 'mdi-close-circle', label: 'Cancelled' };
        default:
            return { color: 'grey-6', icon: 'mdi-help', label: 'Unknown' };
    }
});
</script>

<template>
    <q-chip :color="statusConfig.color" :icon="statusConfig.icon" :size="size" :label="statusConfig.label">
        <q-tooltip>RSVP Status: {{ statusConfig.label }}</q-tooltip>
    </q-chip>
</template>
