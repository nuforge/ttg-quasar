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
        {{ player.getInitials ? player.getInitials() : getInitials(player.name) }}
      </div>
    </template>
  </q-avatar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface PlayerLike {
  readonly id?: string | number;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl?: string | undefined;
  readonly avatar?: string | undefined;
  readonly bio?: string | undefined;
  readonly firebaseId?: string | undefined;
  readonly getInitials?: () => string;
}

const props = defineProps({
  player: {
    type: Object as () => PlayerLike,
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

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

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
