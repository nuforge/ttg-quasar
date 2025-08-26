<template>
    <q-page padding class="admin-games">
        <div class="page-header q-mb-md">
            <div class="text-h4">Game Administration</div>
            <div class="text-body1 text-grey-6">Manage game submissions and data migration</div>
        </div>

        <div class="row q-gutter-lg">
            <!-- Migration Panel -->
            <div class="col-12 col-md-6">
                <q-card>
                    <q-card-section>
                        <div class="text-h6">
                            <q-icon name="mdi-database-sync" class="q-mr-sm" />
                            Data Migration
                        </div>
                        <div class="text-body2 text-grey-6 q-mt-sm">
                            Migrate games from JSON files to Firebase
                        </div>
                    </q-card-section>

                    <q-card-section class="q-pt-none">
                        <div class="q-gutter-sm">
                            <q-btn color="primary" icon="mdi-check-circle" label="Check Migration Status"
                                @click="checkMigrationStatus" :loading="migrationLoading" />

                            <q-btn color="positive" icon="mdi-upload" label="Run Migration" @click="confirmMigration"
                                :loading="migrationLoading" :disable="migrationComplete" />

                            <q-btn v-if="migrationComplete" color="negative" icon="mdi-delete"
                                label="Rollback Migration" @click="confirmRollback" :loading="migrationLoading"
                                outline />
                        </div>

                        <div v-if="migrationStatus" class="q-mt-md">
                            <q-chip :color="migrationComplete ? 'positive' : 'warning'"
                                :icon="migrationComplete ? 'mdi-check' : 'mdi-clock'" text-color="white"
                                :label="migrationComplete ? 'Migration Complete' : 'Migration Pending'" />

                            <div v-if="migrationResult" class="q-mt-sm text-caption">
                                Total: {{ migrationResult.total }},
                                Successful: {{ migrationResult.successful }},
                                Failed: {{ migrationResult.total - migrationResult.successful }}
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <!-- Game Submissions Panel -->
            <div class="col-12 col-md-6">
                <q-card>
                    <q-card-section>
                        <div class="text-h6">
                            <q-icon name="mdi-inbox" class="q-mr-sm" />
                            Game Submissions
                            <q-chip v-if="gameSubmissionsStore.pendingSubmissions.length > 0"
                                :label="gameSubmissionsStore.pendingSubmissions.length" color="orange"
                                text-color="white" size="sm" class="q-ml-sm" />
                        </div>
                        <div class="text-body2 text-grey-6 q-mt-sm">
                            Review and approve submitted games
                        </div>
                    </q-card-section>

                    <q-card-section class="q-pt-none">
                        <q-btn color="primary" icon="mdi-refresh" label="Refresh Submissions" @click="loadSubmissions"
                            :loading="gameSubmissionsStore.loading" />

                        <div v-if="gameSubmissionsStore.pendingSubmissions.length === 0"
                            class="q-mt-md text-center text-grey-6">
                            <q-icon name="mdi-inbox-outline" size="2em" />
                            <div class="q-mt-sm">No pending submissions</div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>

        <!-- Pending Submissions List -->
        <div v-if="gameSubmissionsStore.pendingSubmissions.length > 0" class="q-mt-lg">
            <q-card>
                <q-card-section>
                    <div class="text-h6">Pending Game Submissions</div>
                </q-card-section>

                <q-list separator>
                    <q-item v-for="submission in gameSubmissionsStore.pendingSubmissions" :key="submission.id">
                        <q-item-section>
                            <q-item-label class="text-weight-bold">{{ submission.title }}</q-item-label>
                            <q-item-label caption>
                                Genre: {{ submission.genre }} |
                                Players: {{ submission.numberOfPlayers }} |
                                Age: {{ submission.recommendedAge }}
                            </q-item-label>
                            <q-item-label caption class="q-mt-xs">
                                {{ submission.description }}
                            </q-item-label>
                            <q-item-label caption class="q-mt-xs text-grey-6">
                                Submitted by {{ submission.submittedBy.userName }} on
                                {{ submission.submittedAt.toLocaleDateString() }}
                            </q-item-label>
                        </q-item-section>

                        <q-item-section side>
                            <div class="q-gutter-xs">
                                <q-btn color="positive" icon="mdi-check" size="sm" round
                                    @click="approveSubmission(submission.id)" :loading="gameSubmissionsStore.loading">
                                    <q-tooltip>Approve</q-tooltip>
                                </q-btn>
                                <q-btn color="negative" icon="mdi-close" size="sm" round
                                    @click="rejectSubmission(submission.id)" :loading="gameSubmissionsStore.loading">
                                    <q-tooltip>Reject</q-tooltip>
                                </q-btn>
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
                        <q-chip :label="gamesStore.approvedGames.length" color="primary" text-color="white" size="sm"
                            class="q-ml-sm" />
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

                <q-list v-else-if="gamesStore.approvedGames.length > 0" separator>
                    <q-item v-for="game in gamesStore.approvedGames.slice(0, 10)" :key="game.id">
                        <q-item-section>
                            <q-item-label class="text-weight-bold">{{ game.title }}</q-item-label>
                            <q-item-label caption>{{ game.genre }} | {{ game.numberOfPlayers }} players</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <q-chip :color="game.status === 'active' ? 'positive' : 'warning'" :label="game.status"
                                text-color="white" size="sm" />
                        </q-item-section>
                    </q-item>

                    <q-item v-if="gamesStore.approvedGames.length > 10">
                        <q-item-section class="text-center text-grey-6">
                            ... and {{ gamesStore.approvedGames.length - 10 }} more games
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
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { useGameSubmissionsStore } from 'src/stores/game-submissions-store';
import { gameMigrationService, type MigrationResult } from 'src/services/game-migration-service';
import { authService } from 'src/services/auth-service';

const $q = useQuasar();
const gamesStore = useGamesFirebaseStore();
const gameSubmissionsStore = useGameSubmissionsStore();

// State
const migrationLoading = ref(false);
const migrationComplete = ref(false);
const migrationStatus = ref(false);
const migrationResult = ref<MigrationResult | null>(null);

// Methods
const checkMigrationStatus = async () => {
    migrationLoading.value = true;
    try {
        const isComplete = await gameMigrationService.checkMigrationStatus();
        migrationComplete.value = isComplete;
        migrationStatus.value = true;

        $q.notify({
            type: isComplete ? 'positive' : 'info',
            message: isComplete ? 'Migration is complete' : 'Migration is pending',
        });

        if (isComplete) {
            await gamesStore.loadGames();
        }
    } catch (error) {
        console.error('Failed to check migration status:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to check migration status',
        });
    } finally {
        migrationLoading.value = false;
    }
};

const confirmMigration = () => {
    $q.dialog({
        title: 'Confirm Migration',
        message: 'This will migrate all games from local JSON files to Firebase. This action cannot be undone easily. Continue?',
        cancel: true,
        persistent: true
    }).onOk(() => {
        void runMigration();
    });
};

const runMigration = async () => {
    if (!authService.isAuthenticated.value || !authService.currentUserId.value) {
        $q.notify({
            type: 'negative',
            message: 'You must be authenticated to run migration',
        });
        return;
    }

    migrationLoading.value = true;
    try {
        const result = gameMigrationService.migrateGamesToFirebase($q);

        migrationResult.value = result;
        migrationComplete.value = true;
        migrationStatus.value = true;

        $q.notify({
            type: result.errors.length === 0 ? 'positive' : 'warning',
            message: `Migration completed: ${result.successful}/${result.total} games migrated`,
            timeout: 5000,
        });

        if (result.errors.length > 0) {
            console.warn('Migration errors:', result.errors);
            $q.notify({
                type: 'warning',
                message: `${result.errors.length} games had errors during migration. Check console for details.`,
                timeout: 3000,
            });
        }

        await gamesStore.loadGames();
    } catch (error) {
        console.error('Migration failed:', error);
        $q.notify({
            type: 'negative',
            message: 'Migration failed. Check console for details.',
        });
    } finally {
        migrationLoading.value = false;
    }
};

const confirmRollback = () => {
    $q.dialog({
        title: 'Confirm Rollback',
        message: 'This will delete all games from Firebase. This action cannot be undone! Are you sure?',
        cancel: true,
        persistent: true,
        color: 'negative'
    }).onOk(() => {
        void runRollback();
    });
};

const runRollback = async () => {
    migrationLoading.value = true;
    try {
        const result = gameMigrationService.rollbackMigration($q);

        migrationComplete.value = false;
        migrationStatus.value = false;
        migrationResult.value = null;

        $q.notify({
            type: result.errors.length === 0 ? 'positive' : 'warning',
            message: `Rollback completed: ${result.deleted} games deleted`,
            timeout: 5000,
        });

        if (result.errors.length > 0) {
            console.warn('Rollback errors:', result.errors);
        }

        await gamesStore.loadGames();
    } catch (error) {
        console.error('Rollback failed:', error);
        $q.notify({
            type: 'negative',
            message: 'Rollback failed. Check console for details.',
        });
    } finally {
        migrationLoading.value = false;
    }
};

const loadSubmissions = async () => {
    try {
        await gameSubmissionsStore.loadSubmissions();
    } catch (error) {
        console.error('Failed to load submissions:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to load submissions',
        });
    }
};

const approveSubmission = async (submissionId: string) => {
    try {
        await gameSubmissionsStore.approveSubmission(submissionId);
        $q.notify({
            type: 'positive',
            message: 'Game approved and added to collection!',
        });
        // Reload games to show the new one
        await gamesStore.loadGames();
    } catch (error) {
        console.error('Failed to approve submission:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to approve submission',
        });
    }
};

const rejectSubmission = (submissionId: string) => {
    $q.dialog({
        title: 'Reject Submission',
        message: 'Why is this submission being rejected?',
        prompt: {
            model: '',
            type: 'text'
        },
        cancel: true,
    }).onOk((reason: string) => {
        void (async () => {
            try {
                await gameSubmissionsStore.rejectSubmission(submissionId, reason);
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
    await Promise.all([
        checkMigrationStatus(),
        loadSubmissions(),
    ]);
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
