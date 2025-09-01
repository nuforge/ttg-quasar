<template>
  <q-page padding class="admin-games">
    <div class="page-header q-mb-md">
      <div class="text-h4">Game Administration</div>
      <div class="text-body1 text-grey-6">Manage game submissions and approvals</div>
    </div>

    <div class="row q-gutter-lg">
      <!-- Game Submissions Panel -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">
              <q-icon name="mdi-inbox" class="q-mr-sm" />
              Game Submissions
              <q-chip v-if="gamesStore.pendingGames.length > 0" :label="gamesStore.pendingGames.length" color="orange"
                text-color="white" size="sm" class="q-ml-sm" />
            </div>
            <div class="text-body2 text-grey-6 q-mt-sm">
              Review and approve submitted games
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-btn color="primary" icon="mdi-refresh" label="Refresh Submissions" @click="loadSubmissions"
              :loading="gamesStore.loading" />

            <div v-if="gamesStore.pendingGames.length === 0" class="q-mt-md text-center text-grey-6">
              <q-icon name="mdi-inbox-outline" size="2em" />
              <div class="q-mt-sm">No pending submissions</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Pending Submissions List -->
    <div v-if="gamesStore.pendingGames.length > 0" class="q-mt-lg">
      <q-card>
        <q-card-section>
          <div class="text-h6">Pending Game Submissions</div>
        </q-card-section>

        <q-list separator>
          <q-item v-for="game in gamesStore.pendingGames" :key="game.id">
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ game.title }}</q-item-label>
              <q-item-label caption>
                <strong>Genre:</strong> {{ game.genre }} |
                <strong>Players:</strong> {{ game.numberOfPlayers }} |
                <strong>Age:</strong> {{ game.recommendedAge }}
              </q-item-label>
              <q-item-label caption class="q-mt-xs">
                <strong>Description:</strong> {{ game.description }}
              </q-item-label>
              <q-item-label caption class="q-mt-xs text-grey-6">
                <q-icon name="mdi-account" size="xs" class="q-mr-xs" />
                <strong>Submitted by:</strong> {{ game.createdBy || 'Unknown' }}
              </q-item-label>
              <q-item-label caption class="text-grey-6">
                <q-icon name="mdi-calendar" size="xs" class="q-mr-xs" />
                <strong>Submitted on:</strong> {{ game.createdAt?.toLocaleDateString() || 'Unknown date' }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="column q-gutter-xs">
                <q-chip color="orange" label="Pending Review" text-color="white" size="sm" />
                <div class="row q-gutter-xs">
                  <q-btn color="positive" icon="mdi-check" size="sm" round @click="approveSubmission(game.id)"
                    :loading="gamesStore.loading">
                    <q-tooltip>Approve Submission</q-tooltip>
                  </q-btn>
                  <q-btn color="negative" icon="mdi-close" size="sm" round @click="rejectSubmission(game.id)"
                    :loading="gamesStore.loading">
                    <q-tooltip>Reject Submission</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>

    <!-- Games List -->
    <div class="q-mt-lg">
      <q-card>
        <q-card-section>
          <div class="text-h6">
            Current Games
            <q-chip :label="gamesStore.games.length" color="primary" text-color="white" size="sm" class="q-ml-sm" />
          </div>
        </q-card-section>

        <q-card-section v-if="gamesStore.loading" class="text-center">
          <q-spinner-dots size="40px" color="primary" />
          <div class="q-mt-sm text-grey-6">Loading games...</div>
        </q-card-section>

        <q-card-section v-else-if="gamesStore.error" class="text-center">
          <q-icon name="mdi-alert-circle" size="40px" color="negative" />
          <div class="q-mt-sm text-negative">{{ gamesStore.error }}</div>
        </q-card-section>

        <q-list v-else-if="gamesStore.games.length > 0" separator>
          <q-item v-for="game in gamesStore.games" :key="game.id">
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ game.title }}</q-item-label>
              <q-item-label caption>
                <strong>Genre:</strong> {{ game.genre }} |
                <strong>Players:</strong> {{ game.numberOfPlayers }} |
                <strong>ID:</strong> {{ game.id.substring(0, 8) }}...
              </q-item-label>
              <q-item-label caption class="q-mt-xs text-grey-6">
                <q-icon name="mdi-calendar-plus" size="xs" class="q-mr-xs" />
                <strong>Added:</strong> {{ game.createdAt?.toLocaleDateString() || 'Unknown' }}
                <span v-if="game.createdBy" class="q-ml-md">
                  <q-icon name="mdi-account" size="xs" class="q-mr-xs" />
                  <strong>By:</strong> {{ game.createdBy }}
                </span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row items-center q-gutter-xs">
                <q-chip :color="game.approved ? 'positive' : (game.status === 'pending' ? 'orange' : 'warning')"
                  :label="game.approved ? 'Approved' : game.status" text-color="white" size="sm" />

                <!-- Show approve/reject buttons for unapproved games -->
                <div v-if="!game.approved" class="q-gutter-xs">
                  <q-btn color="positive" icon="mdi-check" size="sm" round @click="approveGameInList(game.id)"
                    :loading="gamesStore.loading">
                    <q-tooltip>Approve Game</q-tooltip>
                  </q-btn>
                  <q-btn color="negative" icon="mdi-close" size="sm" round @click="rejectGameInList(game.id)"
                    :loading="gamesStore.loading">
                    <q-tooltip>Reject Game</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-item-section>
          </q-item>

          <q-item v-if="gamesStore.games.length > 10">
            <q-item-section class="text-center text-grey-6">
              ... and {{ gamesStore.games.length - 10 }} more games
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section v-else class="text-center text-grey-6">
          <q-icon name="mdi-gamepad-variant-outline" size="2em" />
          <div class="q-mt-sm">No games found</div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { authService } from 'src/services/auth-service';

const $q = useQuasar();
const gamesStore = useGamesFirebaseStore();

// Methods
const loadSubmissions = async () => {
  try {
    await gamesStore.loadGames(); // Load all games including pending ones
  } catch (error) {
    console.error('Failed to load games:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load games',
    });
  }
};

const approveSubmission = async (gameId: string) => {
  try {
    await gamesStore.approveGame(gameId);
    $q.notify({
      type: 'positive',
      message: 'Game approved and added to collection!',
    });
  } catch (error) {
    console.error('Failed to approve submission:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to approve submission',
    });
  }
};

const rejectSubmission = (gameId: string) => {
  $q.dialog({
    title: 'Reject Submission',
    message: 'Why is this submission being rejected?',
    prompt: {
      model: '',
      type: 'text'
    },
    cancel: true,
  }).onOk(() => {
    void (async () => {
      try {
        await gamesStore.rejectGame(gameId);
        $q.notify({
          type: 'info',
          message: 'Submission rejected',
        });
      } catch (error) {
        console.error('Failed to reject submission:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to reject submission',
        });
      }
    })();
  });
};

// Game approval/rejection methods for main games list
const approveGameInList = async (gameId: string) => {
  try {
    await gamesStore.approveGame(gameId);
    $q.notify({
      type: 'positive',
      message: 'Game approved!',
    });
  } catch (error) {
    console.error('Failed to approve game:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to approve game',
    });
  }
};

const rejectGameInList = (gameId: string) => {
  $q.dialog({
    title: 'Reject Game',
    message: 'Why is this game being rejected?',
    prompt: {
      model: '',
      type: 'text'
    },
    cancel: true,
  }).onOk(() => {
    void (async () => {
      try {
        // TODO: Store rejection reason in game metadata
        await gamesStore.rejectGame(gameId);
        $q.notify({
          type: 'info',
          message: 'Game rejected',
        });
      } catch (error) {
        console.error('Failed to reject game:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to reject game',
        });
      }
    })();
  });
};

// Initialize
onMounted(async () => {
  if (!authService.isAuthenticated.value) {
    $q.notify({
      type: 'negative',
      message: 'You must be logged in to access admin features',
    });
    return;
  }

  // Load initial data
  await gamesStore.loadGames(); // Load all games including pending ones
});
</script>

<style scoped>
.admin-games {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  padding: 2rem 0;
}
</style>
