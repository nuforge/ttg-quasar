<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import games from 'src/assets/data/games.json';
import GameCard from 'src/components/GameCard.vue';
import type { Game } from 'src/models/Game';
import { useMessagesFirebaseStore } from 'src/stores/messages-firebase-store';
import { usePlayersStore } from 'src/stores/players-store';
import { authService } from 'src/services/auth-service';
import MessageList from 'src/components/messaging/MessageList.vue';
import MessageComposer from 'src/components/messaging/MessageComposer.vue';

const route = useRoute();
const messagesStore = useMessagesFirebaseStore();
const playersStore = usePlayersStore();

const gameId = computed(() => {
  const idParam = route.params.id;
  // Get the first segment of the path as the ID
  return Array.isArray(idParam) ? idParam[0] : idParam;
});

const game = computed(() => {
  // Find the game that matches the ID from the URL
  return games.find(g => g.id.toString() === gameId.value) as Game | undefined;
});

const gameComments = computed(() => {
  if (!game.value) return [];
  return messagesStore.gameComments(game.value.id);
});

const sendGameComment = async (message: string) => {
  if (!game.value || !authService.isAuthenticated.value) return;

  try {
    await messagesStore.sendMessage({
      type: 'game',
      gameId: game.value.id,
      content: message,
      recipients: [], // Game comments are public
    });
  } catch (error) {
    console.error('Failed to send game comment:', error);
    // You might want to show a notification here
  }
};

// Initialize stores and subscriptions
let unsubscribe: (() => void) | undefined;

onMounted(async () => {
  if (playersStore.players.length === 0) {
    await playersStore.fetchPlayers();
  }

  // Subscribe to game messages if we have a game
  if (game.value) {
    unsubscribe = messagesStore.subscribeToGameMessages(game.value.id);
  }
});

onUnmounted(() => {
  // Clean up subscription
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<template>
  <q-page padding>
    <div class="q-pa-md flex justify-start" v-if="game">
      <game-card :game="game" />
    </div>

    <!-- Game Comments Section -->
    <div class="q-pa-md" v-if="game">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6">
            <q-icon name="mdi-comment-multiple" /> Game Discussion
          </div>
        </q-card-section>
        <q-card-section class="q-pa-none">
          <MessageList :messages="gameComments" :show-sender="true" />
        </q-card-section>
        <q-card-section>
          <MessageComposer @message-sent="sendGameComment" />
        </q-card-section>
      </q-card>
    </div>

    <div class="q-pa-md text-center" v-else>
      <p class="text-negative">{{ $t('game.notFound', 'Game not found') }}</p>
      <q-btn to="/games" color="primary" icon="mdi-arrow-left" :label="$t('back', 'Back to Games')" />
    </div>
  </q-page>
</template>
