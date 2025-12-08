<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMessagesFirebaseStore } from 'src/stores/messages-firebase-store';
import { usePlayersStore } from 'src/stores/players-store';
import type { Message } from 'src/models/Message';
import MessageItem from './MessageItem.vue';

const props = defineProps<{
  messages: Message[];
  showSender?: boolean;
}>();

const messagesStore = useMessagesFirebaseStore();
const playersStore = usePlayersStore();

// Initialize stores if needed
if (playersStore.players.length === 0) {
  void playersStore.fetchPlayers();
}

const currentUserId = computed(() => messagesStore.currentUserId);

// Scroll to bottom on new messages
const messageContainer = ref<HTMLElement | null>(null);

watch(() => props.messages.length, () => {
  // Use requestAnimationFrame to avoid forced reflow
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (messageContainer.value) {
        // Batch the read and write operations
        const scrollHeight = messageContainer.value.scrollHeight;
        messageContainer.value.scrollTop = scrollHeight;
      }
    });
  });
});
</script>

<template>
  <div ref="messageContainer" class="message-list q-pa-sm" style="max-height: 400px; overflow-y: auto;">
    <template v-if="messages.length">
      <MessageItem v-for="message in messages" :key="message.id" :message="message"
        :is-from-current-user="message.sender === currentUserId" :show-sender="showSender" />
    </template>
    <div v-else class="text-center q-pa-lg text-grey">
      No messages yet
    </div>
  </div>
</template>

<style scoped>
.message-list {
  display: flex;
  flex-direction: column;
}
</style>
