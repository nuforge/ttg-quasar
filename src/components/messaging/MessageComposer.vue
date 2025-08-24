<script setup lang="ts">
import { ref } from 'vue';
import { useMessagesStore } from 'src/stores/messages-store';
import type { Message } from 'src/models/Message';

const props = defineProps<{
    recipientId?: number;
    groupName?: string;
    replyTo?: Message;
    gameId?: number;
    eventId?: number;
}>();

const emit = defineEmits<{
    (e: 'messageSent', message: string): void;
    (e: 'cancelReply'): void;
}>();

const messagesStore = useMessagesStore();
const messageContent = ref('');
const sending = ref(false);

const sendMessage = () => {
    if (!messageContent.value.trim()) return;

    sending.value = true;
    try {
        if (props.recipientId !== undefined) {
            messagesStore.sendDirectMessage(props.recipientId, messageContent.value);
        } else if (props.groupName) {
            messagesStore.sendGroupMessage(props.groupName, messageContent.value);
        } else if (props.gameId !== undefined) {
            messagesStore.sendMessage({
                type: 'game',
                gameId: props.gameId,
                content: messageContent.value,
                sender: messagesStore.currentUserId,
                replyTo: typeof props.replyTo?.id === 'number' ? props.replyTo.id : undefined,
                recipients: []
            });
        } else if (props.eventId !== undefined) {
            messagesStore.sendMessage({
                type: 'event',
                eventId: props.eventId,
                content: messageContent.value,
                sender: messagesStore.currentUserId,
                replyTo: typeof props.replyTo?.id === 'number' ? props.replyTo.id : undefined,
                recipients: []
            });
        }

        const content = messageContent.value;
        messageContent.value = '';
        emit('messageSent', content);
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
        <q-form @submit.prevent="sendMessage" class="row items-center q-gutter-sm">
            <q-input v-model="messageContent" dense outlined class="col" placeholder="Type a message..."
                :disable="sending" @keydown.enter.prevent="sendMessage" />
            <q-btn :loading="sending" type="submit" color="primary" icon="send" flat round
                :disable="!messageContent.trim()" />
        </q-form>
    </div>
</template>

<style scoped>
.message-composer {
    border-top: 1px solid #ddd;
}
</style>
