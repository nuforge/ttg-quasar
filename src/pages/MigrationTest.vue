<template>
  <q-page padding class="migration-test">
    <div class="text-h4 q-mb-md">Games Migration Test</div>

    <q-banner class="bg-info text-white q-mb-md">
      <template v-slot:avatar>
        <q-icon name="mdi-information" />
      </template>
      This page allows you to test the Firebase games integration. You can switch between local JSON data and Firebase
      data to
      see the migration working.
    </q-banner>

    <!-- Controls -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">Migration Controls</div>

        <div class="q-gutter-md">
          <q-btn color="primary" icon="mdi-database-check" label="Check Migration Status" @click="checkStatus"
            :loading="loading" />

          <q-btn color="info" icon="mdi-cloud-check" label="Test Storage" @click="testStorage" :loading="loading" />

          <q-btn v-if="authService.isAuthenticated.value" color="positive" icon="mdi-upload" label="Run Migration"
            @click="runMigration" :loading="loading" :disable="migrationComplete" />

          <q-btn color="secondary" icon="mdi-reload" label="Load Firebase Games" @click="loadFirebaseGames"
            :loading="gamesStore.loading" />
        </div>

        <!-- Admin Controls -->
        <div v-if="authService.isAuthenticated.value" class="q-mt-md q-pt-md" style="border-top: 1px solid #e0e0e0;">
          <div class="text-subtitle2 q-mb-sm text-orange-8">⚠️ Admin Controls (Testing Only)</div>
          <div class="q-gutter-md">
            <q-btn color="negative" icon="mdi-delete-sweep" label="Clear All Games" @click="clearDatabase"
              :loading="loading" size="sm" outline />

            <q-btn color="warning" icon="mdi-backup-restore" label="Rollback Migration" @click="rollbackMigration"
              :loading="loading" size="sm" outline />
          </div>
        </div>

        <div class="q-mt-md">
          <q-toggle v-model="useFirebaseData" label="Use Firebase Data" color="primary" left-label />
        </div>
      </q-card-section>
    </q-card>

    <!-- Status Display -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">Status</div>

        <div class="row q-gutter-lg">
          <div class="col">
            <q-chip :color="migrationComplete ? 'positive' : 'warning'"
              :icon="migrationComplete ? 'mdi-check-circle' : 'mdi-clock'" text-color="white"
              :label="migrationComplete ? 'Migration Complete' : 'Migration Pending'" />
          </div>

          <div class="col">
            <q-chip color="info" icon="mdi-file-document" text-color="white" label="Local Games: Migrated" />
          </div>

          <div class="col">
            <q-chip color="secondary" icon="mdi-cloud" text-color="white"
              :label="`Firebase Games: ${gamesStore.approvedGames.length}`" />
          </div>
        </div>

        <div v-if="migrationResult" class="q-mt-md">
          <div class="text-subtitle2">Last Migration Result:</div>
          <div class="text-body2">
            Total: {{ migrationResult.total }},
            Successful: {{ migrationResult.successful }},
            Failed: {{ migrationResult.total - migrationResult.successful }}
          </div>
          <div v-if="migrationResult.errors.length > 0" class="text-negative q-mt-xs">
            {{ migrationResult.errors.length }} errors occurred
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Games Display -->
    <q-card>
      <q-card-section>
        <div class="text-h6 q-mb-md">
          Games ({{ useFirebaseData ? 'Firebase' : 'Local JSON' }})
        </div>

        <div v-if="displayedGames.length === 0" class="text-center q-py-lg text-grey-6">
          <q-icon name="mdi-gamepad-variant-outline" size="3em" />
          <div class="q-mt-md">No games available</div>
        </div>

        <div v-else class="games-grid">
          <q-card v-for="game in displayedGames.slice(0, 12)" :key="game.id" class="game-card"  bordered>
            <q-card-section class="q-pa-sm">
              <div class="text-weight-bold">{{ game.title }}</div>
              <div class="text-caption text-grey-6">{{ game.genre }}</div>
              <div class="text-body2 q-mt-xs">{{ game.numberOfPlayers }} players</div>
            </q-card-section>
          </q-card>
        </div>

        <div v-if="displayedGames.length > 12" class="q-mt-md text-center text-grey-6">
          ... and {{ displayedGames.length - 12 }} more games
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { type MigrationResult } from 'src/services/game-migration-service';
import { imageStorageService } from 'src/services/image-storage-service';
import { authService } from 'src/services/auth-service';

const $q = useQuasar();
const gamesStore = useGamesFirebaseStore();

// State
const loading = ref(false);
const useFirebaseData = ref(true); // Always use Firebase data
const migrationComplete = ref(false);
const migrationResult = ref<MigrationResult | null>(null);

// Computed
const displayedGames = computed(() => {
  return gamesStore.approvedGames; // Only show Firebase games
});

// Methods
const checkStatus = async () => {
  loading.value = true;
  try {
    // Migration is complete since we're only using Firebase data
    migrationComplete.value = gamesStore.games.length > 0;

    // Always load games to get accurate count
    await loadFirebaseGames();

    $q.notify({
      type: migrationComplete.value ? 'positive' : 'info',
      message: migrationComplete.value
        ? `Migration complete! Found ${gamesStore.approvedGames.length} games in Firebase.`
        : 'No games found in Firebase. Migration is needed.',
    });
  } catch (error) {
    console.error('Failed to check migration status:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to check migration status',
    });
  } finally {
    loading.value = false;
  }
};

const runMigration = () => {
  $q.notify({
    type: 'info',
    message: 'Migration has already been completed. All games are now in Firebase.',
    timeout: 2000,
  });
};

const loadFirebaseGames = async () => {
  try {
    await gamesStore.loadGames();
  } catch (error) {
    console.error('Failed to load Firebase games:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load games from Firebase',
    });
  }
};

const testStorage = async () => {
  loading.value = true;
  try {
    const result = await imageStorageService.testStorageConnectivity();

    $q.notify({
      type: result.success ? 'positive' : 'negative',
      message: result.success
        ? '✅ Firebase Storage is accessible and ready for image uploads'
        : `❌ Storage Error: ${result.error}`,
      timeout: result.success ? 3000 : 8000,
    });

    if (!result.success) {
      $q.dialog({
        title: 'Storage Configuration Issue',
        message: `${result.error}\n\nPlease check:\n• Firebase Storage rules allow write access\n• FIREBASE_STORAGE_BUCKET is correct in .env\n• Firebase project has Storage enabled`,
        html: true,
      });
    }
  } catch (error) {
    console.error('Storage test failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to test storage connectivity',
    });
  } finally {
    loading.value = false;
  }
};

const clearDatabase = () => {
  $q.notify({
    type: 'warning',
    message: 'Clear database function is disabled. Games are managed through Firebase Console.',
    timeout: 3000,
  });
};

const rollbackMigration = () => {
  $q.notify({
    type: 'warning',
    message: 'Rollback function is disabled. Migration is complete and games are managed through Firebase Console.',
    timeout: 3000,
  });
};

// Initialize
onMounted(async () => {
  await checkStatus();
});
</script>

<style scoped>
.migration-test {
  max-width: 1000px;
  margin: 0 auto;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.game-card {
  transition: transform 0.2s ease;
}

.game-card:hover {
  transform: translateY(-2px);
}
</style>
