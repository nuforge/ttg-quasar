<script setup lang="ts">
import QrcodeVue from 'qrcode.vue';
import { useQuasar } from 'quasar';
import { colors } from 'quasar';
import { ref, watch } from 'vue';
const $q = useQuasar();

const primaryColor = colors.getPaletteColor('primary');
import type { Event } from 'src/models/Event';

const qrback = $q.dark.isActive ? 'black' : 'white';

import type { PropType } from 'vue';

const props = defineProps({
    event: {
        type: Object as PropType<Event>,
        required: true,
    },
    size: {
        type: Number,
        default: 200,
    },
    showQR: {
        type: Boolean,
        required: true,
    },
});

const emit = defineEmits(['update:showQR']);

// Local state to track dialog visibility
const dialogVisible = ref(props.showQR);

// Watch for prop changes to update local state
watch(() => props.showQR, (newVal) => {
    dialogVisible.value = newVal;
});

// When dialog visibility changes locally, emit update to parent
watch(() => dialogVisible.value, (newVal) => {
    if (newVal !== props.showQR) {
        emit('update:showQR', newVal);
    }
});
</script>

<template>
    <q-dialog v-model="dialogVisible" backdrop-filter="blur(4px) saturate(150%)">
        <q-card flat>
            <q-card-section align="center">
                <div class="text-h6">{{ event.title }}</div>
                <qrcode-vue :value="`/events/${event.id}/${event.title}`" :size="size" level="H" class="qrcode-image"
                    :margin="2" :background="qrback" :foreground="primaryColor" />
            </q-card-section>
            <q-card-actions align="center">
                <q-btn class="full-width" label="Close" @click="dialogVisible = false" flat />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>
