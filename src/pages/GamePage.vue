<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import GameCard from 'src/components/GameCard.vue';
import type { Game } from 'src/models/Game';
import { useMessagesFirebaseStore } from 'src/stores/messages-firebase-store';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { authService } from 'src/services/auth-service';
import MessageList from 'src/components/messaging/MessageList.vue';
import MessageComposer from 'src/components/messaging/MessageComposer.vue';

const route = useRoute();
const messagesStore = useMessagesFirebaseStore();
const playersStore = usePlayersFirebaseStore();
const gamesStore = useGamesFirebaseStore();

const loading = ref(false);
const error = ref<string | null>(null);

const gameId = computed(() => {
  const idParam = route.params.id;
  return Array.isArray(idParam) ? idParam[0] : idParam;
});

const game = ref<Game | null>(null);

const loadGame = () => {
  if (!gameId.value) return;

  loading.value = true;
  error.value = null;

  try {
    // Get game from Firebase store
    let foundGame = gamesStore.getGameById(gameId.value);

    // If not found by document ID, try by legacy ID (for migrated games)
    if (!foundGame) {
      const numericId = parseInt(gameId.value);
      if (!isNaN(numericId)) {
        foundGame = gamesStore.getGameByLegacyId(numericId);
      }
    }

    game.value = foundGame || null;

    if (!game.value) {
      error.value = 'Game not found';
    }
  } catch (err) {
    console.error('Failed to load game:', err);
    error.value = 'Failed to load game';
  } finally {
    loading.value = false;
  }
};

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
  }
};

// Initialize stores and subscriptions
let unsubscribe: (() => void) | undefined;

// Watch for route changes and reload game
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      // Clean up previous subscription
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = undefined;
      }

      // Load the new game
      loadGame();

      // Subscribe to new game messages if we have a game
      if (game.value) {
        unsubscribe = messagesStore.subscribeToGameMessages(game.value.id);
      }
    }
  }
);

onMounted(async () => {
  // Load games from Firebase
  await gamesStore.loadGames();

  // Load the specific game
  loadGame();

  if (playersStore.players.length === 0) {
    await playersStore.fetchAllPlayers();
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
    <!-- Loading State -->
    <div v-if="loading" class="q-pa-md text-center">
      <q-spinner-dots size="50px" color="primary" />
      <p class="text-grey-6 q-mt-md">Loading game...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="q-pa-md text-center">
      <q-icon name="mdi-alert-circle" size="64px" color="negative" />
      <p class="text-negative q-mt-md">{{ error }}</p>
      <q-btn to="/games" color="primary" icon="mdi-arrow-left" label="Back to Games" />
    </div>

    <!-- Game Content -->
    <template v-else-if="game">
      <div class="q-pa-md flex justify-start">
        <game-card :game="game" />
      </div>

      <!-- Game Comments Section -->
      <div class="q-pa-md">
        <q-card bordered>
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
    </template>

    <!-- No Game Found -->
    <div v-else class="q-pa-md text-center">
      <q-icon name="mdi-gamepad-variant-outline" size="64px" color="grey-5" />
      <p class="text-grey-6 q-mt-md">Game not found</p>
      <q-btn to="/games" color="primary" icon="mdi-arrow-left" label="Back to Games" />
    </div>
  </q-page>
</template>
