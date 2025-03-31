<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMessagesStore } from 'src/stores/messages-store';
import type { Message } from 'src/models/Message';
import { usePlayersStore } from 'src/stores/players-store';
import MessageList from 'src/components/messaging/MessageList.vue';

const messagesStore = useMessagesStore();
const playersStore = usePlayersStore();
const tab = ref('direct');
const selectedConversation = ref<number | null>(null);
const selectedGroup = ref<string | null>(null);

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
            <q-list bordered separator>
              <q-item v-for="conversation in messagesStore.conversations" :key="conversation.partnerId"
                :active="selectedConversation === conversation.partnerId" active-class="bg-primary text-white" clickable
                v-ripple @click="selectedConversation = conversation.partnerId; updateConversationMessages()">
                <q-item-section avatar>
                  <q-avatar>
                    <img
                      :src="playersStore.getPlayerById(conversation.partnerId)?.avatar || 'https://cdn.quasar.dev/img/boy-avatar.png'">
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ playersStore.getPlayerById(conversation.partnerId)?.name || 'Unknown'
                  }}</q-item-label>
                  <q-item-label caption lines="1">{{ conversation.latestMessage?.content }}</q-item-label>
                </q-item-section>
                <q-item-section side v-if="conversation.unreadCount">
                  <q-badge color="red" rounded>{{ conversation.unreadCount }}</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Conversation Messages -->
          <div class="col-12 col-sm-8">
            <q-card v-if="selectedConversation">
              <q-card-section class="bg-primary text-white">
                <div class="text-h6">
                  {{ playersStore.getPlayerById(selectedConversation)?.name || 'Conversation' }}
                </div>
              </q-card-section>
              <q-card-section class="q-pa-none">
                <MessageList :messages="conversationMessages" />
              </q-card-section>
            </q-card>
            <div v-else class="text-center q-pa-lg text-grey">
              Select a conversation to view messages
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- Group Messages Panel -->
      <q-tab-panel name="groups">
        <div class="row q-col-gutter-md">
          <!-- Groups List -->
          <div class="col-12 col-sm-4">
            <q-list bordered separator>
              <q-item v-for="group in messagesStore.messageGroups" :key="group.groupName"
                :active="selectedGroup === group.groupName" active-class="bg-primary text-white" clickable v-ripple
                @click="selectedGroup = group.groupName; updateGroupMessages()">
                <q-item-section>
                  <q-item-label>{{ group.groupName }}</q-item-label>
                  <q-item-label caption lines="1">{{ group.latestMessage?.content }}</q-item-label>
                </q-item-section>
                <q-item-section side v-if="group.unreadCount">
                  <q-badge color="red" rounded>{{ group.unreadCount }}</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Group Messages -->
          <div class="col-12 col-sm-8">
            <q-card v-if="selectedGroup">
              <q-card-section class="bg-primary text-white">
                <div class="text-h6">{{ selectedGroup }}</div>
              </q-card-section>
              <q-card-section class="q-pa-none">
                <MessageList :messages="groupMessages" :show-sender="true" />
              </q-card-section>
            </q-card>
            <div v-else class="text-center q-pa-lg text-grey">
              Select a group to view messages
            </div>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>
