<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon name="cloud_sync" class="q-mr-sm" />
        {{ $t('admin.clcaIntegration') }}
      </div>

      <!-- CLCA Health Status -->
      <div class="q-mb-lg">
        <q-banner
          :class="healthBannerClass"
          rounded
          dense
        >
          <template v-slot:avatar>
            <q-icon :name="healthIcon" :color="healthColor" />
          </template>
          <div class="text-body2">
            <strong>{{ $t('admin.clcaStatus') }}:</strong> {{ healthStatusText }}
            <span v-if="healthLatency" class="text-caption q-ml-sm">
              ({{ healthLatency }}ms)
            </span>
          </div>
        </q-banner>
      </div>

      <!-- Sync Statistics -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4 text-positive">{{ syncStats.eventsSynced }}</div>
              <div class="text-caption">{{ $t('admin.eventsSynced') }}</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4 text-info">{{ syncStats.gamesSynced }}</div>
              <div class="text-caption">{{ $t('admin.gamesSynced') }}</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4 text-negative">{{ syncStats.failed }}</div>
              <div class="text-caption">{{ $t('admin.syncFailures') }}</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4 text-warning">{{ dlqStats.totalItems }}</div>
              <div class="text-caption">{{ $t('admin.dlqItems') }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- DLQ Statistics -->
      <div class="q-mb-lg">
        <div class="text-subtitle1 q-mb-sm">
          <q-icon name="queue" class="q-mr-sm" />
          {{ $t('admin.deadLetterQueue') }}
        </div>
        <div class="row q-col-gutter-sm">
          <div class="col-6 col-md-3">
            <q-chip
              :label="`${$t('admin.readyForRetry')}: ${dlqStats.readyForRetry}`"
              color="orange"
              text-color="white"
              dense
            />
          </div>
          <div class="col-6 col-md-3">
            <q-chip
              :label="`${$t('admin.pendingRetry')}: ${dlqStats.pendingRetry}`"
              color="blue"
              text-color="white"
              dense
            />
          </div>
          <div class="col-6 col-md-3">
            <q-chip
              :label="`${$t('admin.avgAttempts')}: ${dlqStats.averageAttempts}`"
              color="grey"
              text-color="white"
              dense
            />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="row q-gutter-sm">
        <q-btn
          color="primary"
          icon="cloud_sync"
          :label="$t('admin.syncAllEvents')"
          :loading="bulkSyncingEvents"
          @click="syncAllEvents"
        />

        <q-btn
          color="info"
          icon="games"
          :label="$t('admin.syncAllGames')"
          :loading="bulkSyncingGames"
          @click="syncAllGames"
        />

        <q-btn
          color="warning"
          icon="refresh"
          :label="$t('admin.processDLQ')"
          :loading="processingDLQ"
          @click="processDLQ"
        />

        <q-btn
          flat
          icon="health_and_safety"
          :label="$t('admin.healthCheck')"
          :loading="checkingHealth"
          @click="performHealthCheck"
        />

        <q-btn
          flat
          icon="settings"
          :label="$t('admin.clcaSettings')"
          @click="openSettings"
        />
      </div>

      <!-- Advanced Actions -->
      <q-expansion-item
        icon="admin_panel_settings"
        :label="$t('admin.advancedActions')"
        class="q-mt-md"
      >
        <q-card-section class="q-pt-none">
          <div class="row q-gutter-sm">
            <q-btn
              color="negative"
              icon="clear_all"
              :label="$t('admin.clearDLQ')"
              :loading="clearingDLQ"
              @click="confirmClearDLQ"
            />

            <q-btn
              flat
              icon="list"
              :label="$t('admin.viewDLQItems')"
              @click="viewDLQItems"
            />
          </div>
        </q-card-section>
      </q-expansion-item>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { DeadLetterQueueService } from 'src/services/dead-letter-queue-service';
import { CLCAIngestService } from 'src/services/clca-ingest-service';

const { t } = useI18n();
const $q = useQuasar();
const eventsStore = useEventsFirebaseStore();
const gamesStore = useGamesFirebaseStore();
const dlqService = new DeadLetterQueueService();
const clcaService = new CLCAIngestService();

// State
const bulkSyncingEvents = ref(false);
const bulkSyncingGames = ref(false);
const processingDLQ = ref(false);
const clearingDLQ = ref(false);
const checkingHealth = ref(false);

const dlqStats = ref({
  totalItems: 0,
  readyForRetry: 0,
  pendingRetry: 0,
  averageAttempts: 0,
});

const healthStatus = ref<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
}>({ status: 'unhealthy' });

// Computed sync statistics
const syncStats = computed(() => {
  const events = eventsStore.events;
  const games = gamesStore.games;

  const eventSyncStatuses = events.map((e) =>
    eventsStore.getCLCASyncStatus(e.firebaseDocId || e.id.toString())
  );
  const gameSyncStatuses = games.map((g) =>
    gamesStore.getGameCLCASyncStatus(g.id)
  );

  return {
    eventsSynced: eventSyncStatuses.filter((s) => s?.synced).length,
    gamesSynced: gameSyncStatuses.filter((s) => s?.synced).length,
    failed: [...eventSyncStatuses, ...gameSyncStatuses].filter((s) => s?.error).length,
  };
});

// Health status computed properties
const healthIcon = computed(() => {
  return healthStatus.value.status === 'healthy' ? 'check_circle' : 'error';
});

const healthColor = computed(() => {
  return healthStatus.value.status === 'healthy' ? 'positive' : 'negative';
});

const healthBannerClass = computed(() => {
  return healthStatus.value.status === 'healthy'
    ? 'text-positive bg-positive-1'
    : 'text-negative bg-negative-1';
});

const healthStatusText = computed(() => {
  return healthStatus.value.status === 'healthy'
    ? t('admin.clcaHealthy')
    : t('admin.clcaUnhealthy');
});

const healthLatency = computed(() => {
  return healthStatus.value.latency;
});

// Actions
const syncAllEvents = async (): Promise<void> => {
  bulkSyncingEvents.value = true;

  try {
    const result = await eventsStore.syncAllEventsToCLCA();

    $q.notify({
      type: result.successful > result.failed ? 'positive' : 'warning',
      message: t('admin.bulkSyncComplete'),
      caption: t('admin.bulkSyncResults', {
        success: result.successful,
        errors: result.failed
      }),
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('admin.bulkSyncFailed'),
      caption: (error as Error).message,
    });
  } finally {
    bulkSyncingEvents.value = false;
    await loadDLQStats(); // Refresh stats
  }
};

const syncAllGames = async (): Promise<void> => {
  bulkSyncingGames.value = true;

  try {
    const result = await gamesStore.syncAllGamesToCLCA();

    $q.notify({
      type: result.successful > result.failed ? 'positive' : 'warning',
      message: t('admin.bulkGameSyncComplete'),
      caption: t('admin.bulkSyncResults', {
        success: result.successful,
        errors: result.failed
      }),
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('admin.bulkSyncFailed'),
      caption: (error as Error).message,
    });
  } finally {
    bulkSyncingGames.value = false;
    await loadDLQStats(); // Refresh stats
  }
};

const processDLQ = async (): Promise<void> => {
  processingDLQ.value = true;

  try {
    const result = await dlqService.processDLQ();

    $q.notify({
      type: 'positive',
      message: t('admin.dlqProcessed'),
      caption: t('admin.dlqProcessResults', {
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
      }),
      icon: 'refresh',
    });

    await loadDLQStats(); // Refresh stats
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('admin.dlqProcessFailed'),
      caption: (error as Error).message,
    });
  } finally {
    processingDLQ.value = false;
  }
};

const performHealthCheck = async (): Promise<void> => {
  checkingHealth.value = true;

  try {
    const result = await clcaService.healthCheck();
    healthStatus.value = result;

    $q.notify({
      type: result.status === 'healthy' ? 'positive' : 'warning',
      message: result.status === 'healthy'
        ? t('admin.healthCheckPassed')
        : t('admin.healthCheckFailed'),
      caption: result.latency ? `${result.latency}ms` : undefined,
    });
  } catch (error) {
    healthStatus.value = { status: 'unhealthy' };
    $q.notify({
      type: 'negative',
      message: t('admin.healthCheckError'),
      caption: (error as Error).message,
    });
  } finally {
    checkingHealth.value = false;
  }
};

const confirmClearDLQ = (): void => {
  $q.dialog({
    title: t('admin.confirmClearDLQ'),
    message: t('admin.clearDLQWarning'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    clearingDLQ.value = true;
    try {
      const deletedCount = await dlqService.clearDLQ();

      $q.notify({
        type: 'positive',
        message: t('admin.dlqCleared'),
        caption: t('admin.dlqClearedCount', { count: deletedCount }),
      });

      await loadDLQStats(); // Refresh stats
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: t('admin.dlqClearFailed'),
        caption: (error as Error).message,
      });
    } finally {
      clearingDLQ.value = false;
    }
  });
};

const viewDLQItems = async (): Promise<void> => {
  try {
    const items = await dlqService.getDLQItems(10);

    $q.dialog({
      title: t('admin.dlqItems'),
      message: items.length > 0
        ? items.map((item, index) =>
            `${index + 1}. ${item.contentDoc.title} (${item.context.attempt} attempts)`
          ).join('\n')
        : t('admin.noDLQItems'),
      ok: t('common.close'),
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('admin.dlqItemsLoadFailed'),
      caption: (error as Error).message,
    });
  }
};

const openSettings = (): void => {
  $q.dialog({
    title: t('admin.clcaSettings'),
    message: t('admin.clcaSettingsDesc'),
    html: true,
    ok: t('common.close'),
  });
};

const loadDLQStats = async (): Promise<void> => {
  try {
    dlqStats.value = await dlqService.getDLQStats();
  } catch (error) {
    console.error('Failed to load DLQ stats:', error);
  }
};

// Initialize on mount
onMounted(async () => {
  await loadDLQStats();
  await performHealthCheck();
});
</script>

<style scoped>
.clca-sync-status {
  border-radius: 8px;
}
</style>
