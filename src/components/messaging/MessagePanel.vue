<script setup lang="ts">
import MessageList from './MessageList.vue';
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
  }
});

// Future enhancement: Add message composition functionality here
</script>

<template>
  <q-card v-if="title">
    <q-card-section class="bg-primary text-white">
      <div class="text-h6">{{ title }}</div>
    </q-card-section>
    <q-card-section class="q-pa-none">
      <MessageList :messages="messages" :show-sender="showSender" />
    </q-card-section>
    <!-- Future enhancement: Add message input form here -->
  </q-card>
  <div v-else class="text-center q-pa-lg text-grey">
    Select a conversation to view messages
  </div>
</template>
