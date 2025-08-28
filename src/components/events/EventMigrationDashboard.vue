<template>
  <div class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Event & Calendar Migration Dashboard</div>
        <div class="text-subtitle2 text-grey-7">
          Migrate event data from JSON to Firebase and sync with Google Calendar
        </div>
      </q-card-section>
    </q-card>

    <!-- Migration Status -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">Migration Status</div>

        <div class="row q-gutter-md">
          <div class="col-md-5 col-xs-12">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle1">📅 Events</div>
                <div v-if="migrationStatus">
                  <div class="text-body2">
                    Total: {{ migrationStatus.events.totalCount }}<br>
                    Migrated: {{ migrationStatus.events.migratedCount }}<br>
                    Calendar Synced: {{ migrationStatus.events.calendarSyncedCount }}
                  </div>
                  <q-linear-progress :value="migrationStatus.events.migratedCount / migrationStatus.events.totalCount"
                    color="primary" class="q-mt-sm" />
                </div>
                <div v-else>
                  <q-skeleton type="text" width="80%" />
                  <q-skeleton type="rect" height="6px" class="q-mt-sm" />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-5 col-xs-12">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle1">👥 Players</div>
                <div v-if="migrationStatus">
                  <div class="text-body2">
                    Total: {{ migrationStatus.players.totalCount }}<br>
                    Migrated: {{ migrationStatus.players.migratedCount }}
                  </div>
                  <q-linear-progress :value="migrationStatus.players.migratedCount / migrationStatus.players.totalCount"
                    color="secondary" class="q-mt-sm" />
                </div>
                <div v-else>
                  <q-skeleton type="text" width="80%" />
                  <q-skeleton type="rect" height="6px" class="q-mt-sm" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Migration Options -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">Migration Options</div>

        <q-form>
          <div class="row q-gutter-md">
            <div class="col-md-5 col-xs-12">
              <q-input v-model="migrationOptions.appBaseUrl" label="App Base URL"
                hint="Used for deep links in calendar events" outlined />
            </div>
            <div class="col-md-5 col-xs-12">
              <q-select v-model="migrationOptions.targetCalendarId" :options="availableCalendars" option-label="summary"
                option-value="id" label="Target Google Calendar" hint="Select which calendar to sync events to" outlined
                emit-value map-options :loading="loading.calendars" @focus="loadCalendars">
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      {{ loading.calendars ? 'Loading calendars...' : 'No calendars available' }}
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.summary }}</q-item-label>
                      <q-item-label caption>
                        {{ scope.opt.id }}
                        <q-badge v-if="scope.opt.primary" color="primary" label="Primary" class="q-ml-xs" />
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>
          <div class="row q-gutter-md q-mt-sm">
            <div class="col-md-5 col-xs-12">
              <q-toggle v-model="migrationOptions.syncToGoogleCalendar" label="Sync to Google Calendar" />
              <q-toggle v-model="migrationOptions.skipExisting" label="Skip existing events" class="q-ml-md" />
              <q-toggle v-model="migrationOptions.dryRun" label="Dry run (preview only)" class="q-ml-md" />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Migration Actions -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">Migration Actions</div>

        <div class="row q-gutter-md">
          <q-btn color="primary" icon="event" label="Migrate Events Only" :loading="loading.events"
            @click="migrateEvents" />

          <q-btn color="secondary" icon="people" label="Migrate Players Only" :loading="loading.players"
            @click="migratePlayers" />

          <q-btn color="positive" icon="all_inclusive" label="Migrate All Data" :loading="loading.all"
            @click="migrateAll" />

          <q-btn color="accent" icon="calendar_today" label="Sync to Calendar" :loading="loading.calendar"
            @click="syncToCalendar" />
        </div>
      </q-card-section>
    </q-card>

    <!-- Results -->
    <q-card v-if="lastResult">
      <q-card-section>
        <div class="text-h6 q-mb-md">Last Migration Results</div>

        <div v-if="lastResult.events">
          <div class="text-subtitle1 q-mb-sm">📅 Events:</div>
          <div class="text-body2 q-ml-md q-mb-md">
            <div>✅ Successfully migrated: {{ lastResult.events.successful }}/{{ lastResult.events.total }}
            </div>
            <div v-if="lastResult.events.skipped > 0">⏭️ Skipped (existing): {{ lastResult.events.skipped }}
            </div>
            <div v-if="lastResult.events.calendarSynced > 0">📅 Calendar synced: {{
              lastResult.events.calendarSynced }}</div>
            <div v-if="lastResult.events.errors?.length > 0" class="text-negative">❌ Errors: {{
              lastResult.events.errors.length }}</div>
            <div v-if="lastResult.events.warnings?.length > 0" class="text-warning">⚠️ Warnings: {{
              lastResult.events.warnings.length }}</div>
          </div>
        </div>

        <div v-if="lastResult.players">
          <div class="text-subtitle1 q-mb-sm">👥 Players:</div>
          <div class="text-body2 q-ml-md q-mb-md">
            <div>✅ Successfully migrated: {{ lastResult.players.successful }}/{{ lastResult.players.total }}
            </div>
            <div v-if="lastResult.players.errors?.length > 0" class="text-negative">❌ Errors: {{
              lastResult.players.errors.length }}</div>
          </div>
        </div>

        <!-- Show errors if any -->
        <div v-if="allErrors.length > 0">
          <q-expansion-item icon="error" label="View Errors" class="text-negative">
            <div class="q-pa-md">
              <div v-for="error in allErrors" :key="error" class="text-body2 q-mb-xs">
                • {{ error }}
              </div>
            </div>
          </q-expansion-item>
        </div>

        <!-- Show warnings if any -->
        <div v-if="allWarnings.length > 0">
          <q-expansion-item icon="warning" label="View Warnings" class="text-warning">
            <div class="q-pa-md">
              <div v-for="warning in allWarnings" :key="warning" class="text-body2 q-mb-xs">
                • {{ warning }}
              </div>
            </div>
          </q-expansion-item>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { dataMigrationService } from 'src/services/data-migration-service';
import { eventMigrationService } from 'src/services/event-migration-service';
import { googleCalendarService } from 'src/services/google-calendar-service';
import { useQuasar } from 'quasar';

const $q = useQuasar();

// State
const migrationStatus = ref<{
  players: { totalCount: number; migratedCount: number; isComplete: boolean };
  events: { totalCount: number; migratedCount: number; calendarSyncedCount: number; isComplete: boolean };
  overall: { isComplete: boolean; totalItems: number; migratedItems: number };
} | null>(null);
const lastResult = ref<{
  events?: {
    total: number;
    successful: number;
    skipped: number;
    calendarSynced: number;
    errors: string[];
    warnings: string[];
  };
  players?: {
    total: number;
    successful: number;
    errors: string[];
  };
} | null>(null);
const loading = ref({
  events: false,
  players: false,
  all: false,
  calendar: false,
  calendars: false
});

// Calendar data
const availableCalendars = ref<Array<{ id: string; summary: string; primary?: boolean }>>([]);

// Migration options
const migrationOptions = ref({
  appBaseUrl: 'https://your-app-domain.com', // Update this to your actual domain
  syncToGoogleCalendar: true,
  skipExisting: true,
  dryRun: false,
  targetCalendarId: 'cf4f155a3c69597b84acfb7ac13cda167375de8bf6c83f34da2f9de64684867e@group.calendar.google.com' // Default to your specified calendar
});

// Computed
const allErrors = computed(() => {
  const errors: string[] = [];
  if (lastResult.value?.events?.errors) {
    errors.push(...lastResult.value.events.errors);
  }
  if (lastResult.value?.players?.errors) {
    errors.push(...lastResult.value.players.errors);
  }
  return errors;
});

const allWarnings = computed(() => {
  const warnings: string[] = [];
  if (lastResult.value?.events?.warnings) {
    warnings.push(...lastResult.value.events.warnings);
  }
  return warnings;
});

// Methods
const loadCalendars = async () => {
  if (availableCalendars.value.length > 0) {
    return; // Already loaded
  }

  loading.value.calendars = true;
  try {
    const response = await googleCalendarService.listCalendars();
    availableCalendars.value = response.items.map(calendar => ({
      id: calendar.id,
      summary: calendar.summary,
      ...(calendar.primary && { primary: calendar.primary })
    }));

    console.log('Loaded calendars:', availableCalendars.value);

    // If no calendar is selected, try to select the specified default
    if (!migrationOptions.value.targetCalendarId) {
      const defaultCalendar = availableCalendars.value.find(cal =>
        cal.id === 'cf4f155a3c69597b84acfb7ac13cda167375de8bf6c83f34da2f9de64684867e@group.calendar.google.com'
      );
      if (defaultCalendar) {
        migrationOptions.value.targetCalendarId = defaultCalendar.id;
      }
    }
  } catch (error) {
    console.error('Error loading calendars:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load Google Calendars',
      caption: error instanceof Error ? error.message : 'Make sure you are signed in with Google'
    });
  } finally {
    loading.value.calendars = false;
  }
};

const checkMigrationStatus = async () => {
  try {
    migrationStatus.value = await dataMigrationService.checkFullMigrationStatus();
  } catch (error) {
    console.error('Error checking migration status:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to check migration status',
      caption: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const migrateEvents = async () => {
  loading.value.events = true;
  try {
    // Set the target calendar ID before migration
    if (migrationOptions.value.syncToGoogleCalendar && migrationOptions.value.targetCalendarId) {
      googleCalendarService.setCalendarId(migrationOptions.value.targetCalendarId);
      console.log('🎯 Using target calendar:', migrationOptions.value.targetCalendarId);
    }

    const result = await eventMigrationService.migrateEvents({
      syncToGoogleCalendar: migrationOptions.value.syncToGoogleCalendar,
      skipExisting: migrationOptions.value.skipExisting,
      dryRun: migrationOptions.value.dryRun,
      appBaseUrl: migrationOptions.value.appBaseUrl
    });

    lastResult.value = { events: result };

    $q.notify({
      type: 'positive',
      message: `Event migration completed!`,
      caption: `${result.successful}/${result.total} events migrated, ${result.calendarSynced} synced to calendar`
    });

    await checkMigrationStatus();
  } catch (error) {
    console.error('Event migration error:', error);
    $q.notify({
      type: 'negative',
      message: 'Event migration failed',
      caption: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    loading.value.events = false;
  }
};

const migratePlayers = async () => {
  loading.value.players = true;
  try {
    const result = await dataMigrationService.migratePlayers();
    lastResult.value = { players: result };

    $q.notify({
      type: 'positive',
      message: `Player migration completed!`,
      caption: `${result.successful}/${result.total} players migrated`
    });

    await checkMigrationStatus();
  } catch (error) {
    console.error('Player migration error:', error);
    $q.notify({
      type: 'negative',
      message: 'Player migration failed',
      caption: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    loading.value.players = false;
  }
};

const migrateAll = async () => {
  loading.value.all = true;
  try {
    // Set the target calendar ID before migration
    if (migrationOptions.value.syncToGoogleCalendar && migrationOptions.value.targetCalendarId) {
      googleCalendarService.setCalendarId(migrationOptions.value.targetCalendarId);
      console.log('🎯 Using target calendar:', migrationOptions.value.targetCalendarId);
    }

    const result = await dataMigrationService.migrateAll({
      syncEventsToCalendar: migrationOptions.value.syncToGoogleCalendar,
      appBaseUrl: migrationOptions.value.appBaseUrl,
      dryRun: migrationOptions.value.dryRun
    });

    lastResult.value = result;

    $q.notify({
      type: 'positive',
      message: 'Full migration completed!',
      caption: `Players: ${result.players.successful}/${result.players.total}, Events: ${result.events.successful}/${result.events.total}`
    });

    await checkMigrationStatus();
  } catch (error) {
    console.error('Full migration error:', error);
    $q.notify({
      type: 'negative',
      message: 'Full migration failed',
      caption: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    loading.value.all = false;
  }
};

const syncToCalendar = async () => {
  loading.value.calendar = true;
  try {
    // Set the target calendar ID before sync
    if (migrationOptions.value.targetCalendarId) {
      googleCalendarService.setCalendarId(migrationOptions.value.targetCalendarId);
      console.log('🎯 Using target calendar for sync:', migrationOptions.value.targetCalendarId);
    }

    const result = await eventMigrationService.syncExistingEventsToCalendar(migrationOptions.value.appBaseUrl);
    lastResult.value = { events: result };

    $q.notify({
      type: 'positive',
      message: 'Calendar sync completed!',
      caption: `${result.calendarSynced} events synced to Google Calendar`
    });

    await checkMigrationStatus();
  } catch (error) {
    console.error('Calendar sync error:', error);
    $q.notify({
      type: 'negative',
      message: 'Calendar sync failed',
      caption: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    loading.value.calendar = false;
  }
};

// Lifecycle
onMounted(async () => {
  await checkMigrationStatus();
});
</script>

<style scoped>
.q-card {
  border-radius: 8px;
}
</style>
