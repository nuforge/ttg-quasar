<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMessagesStore } from 'src/stores/messages-store';
import type { Message } from 'src/models/Message';
import { usePlayersStore } from 'src/stores/players-store';
import ConversationList from 'src/components/messaging/ConversationList.vue';
import MessagePanel from 'src/components/messaging/MessagePanel.vue';

const messagesStore = useMessagesStore();
const playersStore = usePlayersStore();
const tab = ref('direct');
const selectedConversation = ref<number>(0);
const selectedGroup = ref<string>('');

// Initialize stores
onMounted(async () => {
  if (messagesStore.messages.length === 0) {
    await messagesStore.fetchMessages();
  }
  if (playersStore.players.length === 0) {
    await playersStore.fetchPlayers();
  }
});

// Get messages for selected conversation
const conversationMessages = ref<Message[]>([]);
const updateConversationMessages = () => {
  if (selectedConversation.value) {
    conversationMessages.value = messagesStore.getConversationWith(selectedConversation.value);
    messagesStore.markConversationAsRead(selectedConversation.value);
  }
};

// Get messages for selected group
const groupMessages = ref<Message[]>([]);
const updateGroupMessages = () => {
  if (selectedGroup.value) {
    groupMessages.value = messagesStore.getGroupMessages(selectedGroup.value);
    messagesStore.markGroupAsRead(selectedGroup.value);
  }
};

// Handle conversation selection
const handleConversationSelect = (id: string | number) => {
  selectedConversation.value = Number(id);
  updateConversationMessages();
};

// Handle group selection
const handleGroupSelect = (id: string | number) => {
  selectedGroup.value = String(id);
  updateGroupMessages();
};

// Get conversation title
const getConversationTitle = () => {
  if (!selectedConversation.value) return '';
  return playersStore.getPlayerById(selectedConversation.value)?.name || 'Conversation';
};
</script>

<template>
  <q-page padding>
    <div class="text-h6 q-mb-md"><q-icon name="mdi-forum" /> {{ $t('message', 2) }}</div>

    <q-tabs v-model="tab" class="text-primary">
      <q-tab name="direct" icon="mdi-message" label="Direct" />
      <q-tab name="groups" icon="mdi-account-group" label="Groups" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <!-- Direct Messages Panel -->
      <q-tab-panel name="direct">
        <div class="row q-col-gutter-md">
          <!-- Conversations List -->
          <div class="col-12 col-sm-4">
            <ConversationList :items="messagesStore.conversations" :selected-id="selectedConversation" type="direct"
              @select="handleConversationSelect" />
          </div>

          <!-- Conversation Messages -->
          <div class="col-12 col-sm-8">
            <MessagePanel :title="getConversationTitle()" :messages="conversationMessages"
              :recipient-id="selectedConversation" />
          </div>
        </div>
      </q-tab-panel>

      <!-- Group Messages Panel -->
      <q-tab-panel name="groups">
        <div class="row q-col-gutter-md">
          <!-- Groups List -->
          <div class="col-12 col-sm-4">
            <ConversationList :items="messagesStore.messageGroups" :selected-id="selectedGroup" type="group"
              @select="handleGroupSelect" />
          </div>

          <!-- Group Messages -->
          <div class="col-12 col-sm-8">
            <MessagePanel :title="selectedGroup" :messages="groupMessages" :show-sender="true"
              :group-name="selectedGroup" />
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>
