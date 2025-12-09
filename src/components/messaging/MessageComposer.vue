<script setup lang="ts">
import { ref } from 'vue';
import { useMessagesFirebaseStore } from 'src/stores/messages-firebase-store';
import type { Message } from 'src/models/Message';

const props = defineProps<{
  recipientId?: number;
  groupName?: string;
  replyTo?: Message;
  gameId?: string;
  eventId?: number | string;
}>();

const emit = defineEmits<{
  (e: 'messageSent', message: string): void;
  (e: 'cancelReply'): void;
}>();

const messagesStore = useMessagesFirebaseStore();
const messageContent = ref('');
const sending = ref(false);

const sendMessage = async () => {
  if (!messageContent.value.trim()) return;

  sending.value = true;
  try {
    if (props.recipientId !== undefined) {
      await messagesStore.sendDirectMessage(props.recipientId, messageContent.value);
    } else if (props.groupName) {
      await messagesStore.sendGroupMessage(props.groupName, messageContent.value);
    } else if (props.gameId !== undefined) {
      await messagesStore.sendMessage({
        type: 'game',
        gameId: props.gameId,
        content: messageContent.value,
        replyTo: typeof props.replyTo?.id === 'number' ? props.replyTo.id : undefined,
        recipients: []
      });
    } else if (props.eventId !== undefined) {
      await messagesStore.sendMessage({
        type: 'event',
        eventId: props.eventId,
        content: messageContent.value,
        replyTo: typeof props.replyTo?.id === 'number' ? props.replyTo.id : undefined,
        recipients: []
      });
    }

    const content = messageContent.value;
    messageContent.value = '';
    emit('messageSent', content);
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <div class="message-composer q-pa-sm">
    <q-banner v-if="props.replyTo" class="text-grey-8 q-mb-sm">
      Replying to: {{ props.replyTo.content }}
      <template v-slot:action>
        <q-btn flat round icon="close" size="sm" @click="$emit('cancelReply')" />
      </template>
    </q-banner>
    <q-form @submit.prevent="sendMessage" class="row items-center q-col-gutter-sm">
      <q-input v-model="messageContent" dense outlined class="col" :placeholder="$t('typeMessage')" :disable="sending"
        @keydown.enter.prevent="sendMessage" />
      <q-btn :loading="sending" type="submit" color="primary" icon="send" flat round
        :disable="!messageContent.trim()" />
    </q-form>
  </div>
</template>

<style scoped>
.message-composer {
  border-top: 1px solid var(--q-color-separator);
}
</style>
