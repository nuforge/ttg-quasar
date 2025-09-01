<template>
    <q-page padding class="games-page">
        <!-- Header with title and controls -->
        <div class="page-header q-mb-md">
            <div class="text-h6 text-uppercase">
                <q-icon name="mdi-book-multiple" /> Games
            </div>

            <div class="header-actions">
                <!-- Submit Game Button -->
                <q-btn v-if="authService.isAuthenticated.value" color="positive" icon="mdi-plus" label="Submit Game"
                    @click="showGameSubmission = true" flat />
            </div>
        </div>

        <!-- Unified Games List -->
        <GameList :games="gamesStore.approvedGames" :loading="gamesStore.loading" type="all"
            :show-ownership-actions="true" :show-preference-actions="true" />

        <!-- Game Submission Dialog -->
        <GameSubmissionDialog v-model="showGameSubmission" @submitted="onGameSubmitted" />
    </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import GameList from 'src/components/GameList.vue';
import GameSubmissionDialog from 'src/components/games/GameSubmissionDialog.vue';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { authService } from 'src/services/auth-service';

const $q = useQuasar();
const gamesStore = useGamesFirebaseStore();

// State
const showGameSubmission = ref(false);

// Methods
const onGameSubmitted = () => {
    $q.notify({
        type: 'info',
        message: 'Your game submission has been sent for review!',
        timeout: 3000,
    });
};
</script>

<style scoped>
.games-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1rem;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: stretch;
    }

    .header-actions {
        justify-content: center;
    }
}
</style>
