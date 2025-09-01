<script setup lang="ts">
import { computed } from 'vue';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import type { Message } from 'src/models/Message';

const props = defineProps<{
  message: Message;
  isFromCurrentUser: boolean;
  showSender?: boolean | undefined;
}>();

const playersStore = usePlayersFirebaseStore();

// Get sender information
const sender = computed(() => {
  return playersStore.getPlayerById(props.message.sender);
});

// Format timestamp
const formattedTime = computed(() => {
  const date = new Date(props.message.timestamp);

  // If message is from today, show only time
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  // Otherwise show date and time
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});
</script>

<template>
  <div :class="['message-item q-mb-sm', { 'message-from-me': isFromCurrentUser }]">
    <div v-if="showSender && !isFromCurrentUser" class="sender-name q-mb-xs text-caption text-grey">
      {{ sender?.name || 'Unknown User' }}
    </div>

    <div :class="['message-content', isFromCurrentUser ? 'sent' : 'received']">
      <div class="message-text">{{ message.content }}</div>
      <div class="message-time text-caption text-grey-7">{{ formattedTime }}</div>
    </div>
  </div>
</template>

<style scoped>
.message-item {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.message-from-me {
  align-self: flex-end;
}

.message-content {
  border-radius: 12px;
  padding: 8px 12px;
  position: relative;
}

.message-text {
  word-break: break-word;
}

.message-time {
  font-size: 0.7rem;
  margin-top: 2px;
  text-align: right;
}

.sent {
  background-color: var(--q-color-primary);
  color: var(--q-color-on-primary);
}

.received {
  background-color: var(--q-color-surface-variant);
  color: var(--q-color-on-surface);
}
</style>
