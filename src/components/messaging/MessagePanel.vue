<script setup lang="ts">
import MessageList from './MessageList.vue';
import MessageComposer from './MessageComposer.vue';
import type { Message } from 'src/models/Message';

defineProps({
  title: {
    type: String,
    required: true
  },
  messages: {
    type: Array as () => Message[],
    required: true
  },
  showSender: {
    type: Boolean,
    default: false
  },
  recipientId: {
    type: Number,
    default: undefined
  },
  groupName: {
    type: String,
    default: undefined
  }
});
</script>

<template>
  <q-card v-if="title">
    <q-card-section class="message-panel-header">
      <div class="text-h6">{{ title }}</div>
    </q-card-section>
    <q-card-section class="q-pa-none">
      <MessageList :messages="messages" :show-sender="showSender" />
    </q-card-section>
    <MessageComposer v-if="recipientId || groupName" :recipient-id="recipientId" :group-name="groupName" />
  </q-card>
  <div v-else class="text-center q-pa-lg text-grey">
    Select a conversation to view messages
  </div>
</template>

<style scoped>
.message-panel-header {
  background-color: var(--q-color-primary);
  color: var(--q-color-on-primary);
}
</style>
