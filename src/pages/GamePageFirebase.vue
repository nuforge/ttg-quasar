<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { useMessagesFirebaseStore } from 'src/stores/messages-firebase-store';
import { usePlayersStore } from 'src/stores/players-store';
import { authService } from 'src/services/auth-service';
import type { Game } from 'src/models/Game';
import GameCard from 'src/components/GameCard.vue';
import MessageList from 'src/components/messaging/MessageList.vue';
import MessageComposer from 'src/components/messaging/MessageComposer.vue';

const route = useRoute();
const gamesStore = useGamesFirebaseStore();
const messagesStore = useMessagesFirebaseStore();
const playersStore = usePlayersStore();

const loading = ref(true);
const error = ref<string | null>(null);

const gameId = computed(() => {
    const idParam = route.params.id;
    return Array.isArray(idParam) ? idParam[0] : idParam;
});

const game = ref<Game | null>(null);

// Try to find the game from Firebase first, then fallback to local data
const findGame = async () => {
    loading.value = true;
    error.value = null;

    try {
        // First, try to load games from Firebase if not already loaded
        if (gamesStore.games.length === 0) {
            await gamesStore.loadGames();
        }

        // Try to find by Firebase document ID
        let foundGame = gamesStore.getGameById(gameId.value!);

        // If not found, try to find by legacy ID (numeric)
        if (!foundGame && gameId.value) {
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
    // For Firebase games, use the document ID; for legacy games, use legacy ID
    const commentGameId = game.value.legacyId || parseInt(game.value.id) || 0;
    return messagesStore.gameComments(commentGameId);
});

const sendGameComment = async (message: string) => {
    if (!game.value || !authService.isAuthenticated.value) return;

    try {
        // Use legacy ID for comment game ID to maintain compatibility
        const commentGameId = game.value.legacyId || parseInt(game.value.id) || 0;
        await messagesStore.sendMessage({
            type: 'game',
            gameId: commentGameId,
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
    // Load players if needed
    if (playersStore.players.length === 0) {
        await playersStore.fetchPlayers();
    }

    // Find the game
    await findGame();

    // Subscribe to game messages if we have a game
    if (game.value) {
        const commentGameId = game.value.legacyId || parseInt(game.value.id) || 0;
        unsubscribe = messagesStore.subscribeToGameMessages(commentGameId);
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
        <div v-if="loading" class="text-center q-py-xl">
            <q-spinner-dots size="50px" color="primary" />
            <div class="q-mt-md text-grey-6">Loading game...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="mdi-alert-circle" size="4rem" color="negative" />
            <div class="q-mt-md text-h6 text-negative">{{ error }}</div>
            <q-btn @click="findGame" label="Retry" color="primary" flat class="q-mt-md" />
        </div>

        <!-- Game Content -->
        <div v-else-if="game">
            <!-- Game Card -->
            <div class="q-pa-md flex justify-start">
                <game-card :game="game" />
            </div>

            <!-- Game Comments Section -->
            <div class="q-pa-md">
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
        </div>

        <!-- No Game Found -->
        <div v-else class="q-pa-md text-center">
            <q-icon name="mdi-gamepad-variant-outline" size="4rem" color="grey-4" />
            <p class="text-negative q-mt-md">Game not found</p>
            <q-btn to="/games" label="Browse Games" color="primary" flat />
        </div>
    </q-page>
</template>
