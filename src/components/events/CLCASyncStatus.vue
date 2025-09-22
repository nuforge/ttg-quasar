<template>
  <q-card flat bordered class="clca-sync-status">
    <q-card-section>
      <div class="row items-center q-gutter-sm">
        <q-icon
          :name="syncIcon"
          :color="syncColor"
          size="sm"
          :aria-label="$t('clca.syncStatus')"
        />

        <div class="col">
          <div class="text-body2 text-weight-medium">
            {{ $t('clca.newsletterSync') }}
          </div>
          <div class="text-caption text-grey-6">
            {{ syncStatusText }}
          </div>
        </div>

        <q-btn
          v-if="canRetry"
          flat
          dense
          icon="refresh"
          :loading="syncing"
          :aria-label="$t('clca.retrySync')"
          @click="retrySync"
        >
          <q-tooltip>{{ $t('clca.retrySync') }}</q-tooltip>
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { useQuasar } from 'quasar';

interface Props {
  eventId?: string;
  gameId?: string;
  type: 'event' | 'game';
}

const props = defineProps<Props>();
const { t } = useI18n();
const $q = useQuasar();
const eventsStore = useEventsFirebaseStore();
const gamesStore = useGamesFirebaseStore();

const syncing = ref(false);

// Computed properties for sync status
const syncStatus = computed(() => {
  if (props.type === 'event' && props.eventId) {
    return eventsStore.getCLCASyncStatus(props.eventId);
  }
  if (props.type === 'game' && props.gameId) {
    return gamesStore.getGameCLCASyncStatus(props.gameId);
  }
  return undefined;
});

const syncIcon = computed(() => {
  if (!syncStatus.value) return 'help_outline';
  if (syncStatus.value.synced) return 'cloud_done';
  if (syncStatus.value.error) return 'cloud_off';
  return 'cloud_queue';
});

const syncColor = computed(() => {
  if (!syncStatus.value) return 'grey-5';
  if (syncStatus.value.synced) return 'positive';
  if (syncStatus.value.error) return 'negative';
  return 'warning';
});

const syncStatusText = computed(() => {
  if (!syncStatus.value) {
    return t('clca.notSynced');
  }
  if (syncStatus.value.synced && syncStatus.value.syncedAt) {
    return t('clca.syncedAt', {
      date: syncStatus.value.syncedAt.toLocaleString(),
    });
  }
  if (syncStatus.value.error) {
    return t('clca.syncError', { error: syncStatus.value.error });
  }
  return t('clca.syncPending');
});

const canRetry = computed(() => {
  return syncStatus.value?.error && !syncing.value;
});

// Actions
const retrySync = async (): Promise<void> => {
  if (!props.eventId && !props.gameId) return;

  syncing.value = true;

  try {
    if (props.type === 'event' && props.eventId) {
      await eventsStore.publishEventToCLCA(props.eventId);
    } else if (props.type === 'game' && props.gameId) {
      await gamesStore.publishGameToCLCA(props.gameId);
    }

    $q.notify({
      type: 'positive',
      message: t('clca.syncSuccess'),
      icon: 'cloud_done',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('clca.syncFailed'),
      caption: (error as Error).message,
      icon: 'cloud_off',
    });
  } finally {
    syncing.value = false;
  }
};
</script>

<style scoped>
.clca-sync-status {
  border-radius: 8px;
}

.clca-sync-status .q-card__section {
  padding: 12px 16px;
}
</style>
