<script setup lang="ts">
import type { Player } from 'src/models/Player';
import PlayersList from './PlayersList.vue';
import { ref, watch } from 'vue';

defineOptions({
  name: 'PlayerListDialog',
});

const props = defineProps({
  players: {
    type: Array as () => Player[],
    required: true
  },
  visible: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Players'
  }
});

const emit = defineEmits(['update:visible']);

const localVisible = ref(props.visible);

// When props.visible changes, update local value
watch(() => props.visible, (newVal) => {
  localVisible.value = newVal;
});

// When local value changes, emit update to parent
watch(localVisible, (newVal) => {
  emit('update:visible', newVal);
});

const closeDialog = () => {
  emit('update:visible', false);
};
</script>

<template>
  <q-dialog v-model="localVisible" @update:model-value="emit('update:visible', $event)"
    backdrop-filter="blur(4px) saturate(150%)">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">{{ title }} ({{ players.length }})</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <PlayersList :players="players" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" @click="closeDialog" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
