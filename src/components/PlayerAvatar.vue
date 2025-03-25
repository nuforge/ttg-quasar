<template>
  <q-avatar :size="size" class="player-avatar" v-bind="$attrs">
    <template v-if="!avatarFailed && player.avatar">
      <img :src="localAvatarUrl" @error="handleAvatarError" />
    </template>

    <template v-else>
      <!-- Show initials or generated avatar -->
      <template v-if="useGeneratedAvatar">
        <img :src="generatedAvatarUrl" />
      </template>
      <div v-else class="bg-primary text-black flex flex-center full-height">
        {{ player.getInitials() }}
      </div>
    </template>
  </q-avatar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Player } from 'src/models/Player';

const props = defineProps({
  player: {
    type: Object as () => Player,
    required: true
  },
  size: {
    type: String,
    default: '64px'
  },
  useGeneratedAvatar: {
    type: Boolean,
    default: true
  }
});

// Track avatar load failures
const avatarFailed = ref(false);

// Handle avatar image load error
const handleAvatarError = () => {
  avatarFailed.value = true;
};

// Generate local avatar URL
const localAvatarUrl = computed(() => {
  return `/images/avatars/${props.player.avatar}`;
});

// Generate avatar URL using DiceBear API
const generatedAvatarUrl = computed(() => {
  const encodedName = encodeURIComponent(props.player.name);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}&backgroundColor=0D47A1&textColor=ffffff`;
});
</script>

<style scoped>
.player-avatar {
  overflow: hidden;
}
</style>
