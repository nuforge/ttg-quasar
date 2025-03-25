<script setup lang="ts">
import type { Player } from 'src/models/Player';
import PlayerAvatar from 'src/components/PlayerAvatar.vue';

defineOptions({
  name: 'PlayerCardMini',
});

const props = defineProps({
  player: {
    type: Object as () => Player,
    required: true
  },
  showEmail: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: true
  }
});


const navigateToPlayer = () => {
  if (props.clickable) {
    // This could be updated once you have player profile pages
    // For now, we'll emit an event that parent components can handle
    emit('click', props.player);
  }
};

const emit = defineEmits(['click']);
</script>

<template>
  <q-item :clickable="clickable" @click="navigateToPlayer">
    <q-item-section avatar>
      <PlayerAvatar :player="player" size="40px" />
    </q-item-section>
    <q-item-section>
      <q-item-label>{{ player.name }}</q-item-label>
      <q-item-label v-if="showEmail" caption>{{ player.email }}</q-item-label>
      <q-item-label v-if="player.joinDate && !showEmail" caption>
        Member since {{ player.getFormattedJoinDate() }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>
