<template>
  <q-card flat class="q-pa-lg">
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon name="mdi-google" class="q-mr-sm" />
        {{ $t('admin.calendar.title') }}
      </div>

      <!-- Current Status -->
      <q-banner :class="syncConfig.enabled ? 'bg-positive text-white' : 'bg-warning text-dark'" rounded class="q-mb-md">
        <template v-slot:avatar>
          <q-icon :name="syncConfig.enabled ? 'mdi-check-circle' : 'mdi-alert-circle'" />
        </template>
        <div class="text-body1">
          <strong>{{ syncConfig.enabled ? $t('admin.calendar.status.enabled') :
            $t('admin.calendar.status.disabled')
          }}</strong>
        </div>
        <div class="text-caption">
          {{ syncConfig.enabled
            ? $t('admin.calendar.status.enabledDesc')
            : $t('admin.calendar.status.disabledDesc')
          }}
        </div>
      </q-banner>

      <!-- Google Calendar API Setup Guide -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">
            <q-icon name="mdi-book-open-variant" class="q-mr-sm" />
            {{ $t('admin.calendar.setup.title') }}
          </div>
          <div class="text-body2 q-mb-md">
            {{ $t('admin.calendar.setup.description') }}
          </div>

          <q-list>
            <q-item>
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">1</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('admin.calendar.setup.step1.title') }}</q-item-label>
                <q-item-label caption>{{ $t('admin.calendar.setup.step1.description') }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-avatar color="secondary" text-color="white">2</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('admin.calendar.setup.step2.title') }}</q-item-label>
                <q-item-label caption>{{ $t('admin.calendar.setup.step2.description') }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-avatar color="accent" text-color="white">3</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('admin.calendar.setup.step3.title') }}</q-item-label>
                <q-item-label caption>{{ $t('admin.calendar.setup.step3.description') }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <div class="q-mt-md">
            <q-btn color="primary" icon="mdi-open-in-new" :label="$t('admin.calendar.setup.openConsole')"
              @click="openGoogleConsole" />
          </div>
        </q-card-section>
      </q-card>

      <!-- Configuration Status -->
      <q-banner :class="configStatus.isConfigured ? 'bg-green-1 text-green-8' : 'bg-red-1 text-red-8'" rounded
        class="q-mb-md">
        <template v-slot:avatar>
          <q-icon :name="configStatus.isConfigured ? 'mdi-check-circle' : 'mdi-alert-circle'" />
        </template>
        <div class="text-body1">
          <strong>{{ configStatus.isConfigured ? 'Configuration Complete' : 'Configuration Required' }}</strong>
        </div>
        <div class="text-caption">{{ configStatus.message }}</div>
        <template v-if="!configStatus.isConfigured" v-slot:action>
          <q-btn flat icon="mdi-refresh" label="Check Again" @click="checkConfiguration" />
        </template>
      </q-banner>

      <!-- Google Authentication Status -->
      <!-- Google Authentication Status -->
      <q-banner
        :class="hasCalendarPermissions ? 'bg-blue-1 text-blue-8' : showAsAuthenticated ? 'bg-amber-1 text-amber-8' : 'bg-orange-1 text-orange-8'"
        rounded class="q-mb-md">
        <template v-slot:avatar>
          <q-icon
            :name="hasCalendarPermissions ? 'mdi-google' : showAsAuthenticated ? 'mdi-lock' : 'mdi-account-alert'" />
        </template>
        <div class="text-body1">
          <strong>
            {{ hasCalendarPermissions ? 'Google Calendar Connected' :
              showAsAuthenticated ? 'Calendar Permissions Needed' :
                'Google Authentication Required' }}
          </strong>
        </div>
        <div class="text-caption">
          {{ hasCalendarPermissions
            ? 'Your Google account is connected and ready for calendar sync.'
            : showAsAuthenticated
              ? 'Grant calendar permissions to enable event synchronization.'
              : 'Sign in with Google to enable calendar integration.' }}
        </div>
        <template v-if="!hasCalendarPermissions" v-slot:action>
          <q-btn flat :icon="showAsAuthenticated ? 'mdi-key' : 'mdi-google'"
            :label="showAsAuthenticated ? 'Grant Calendar Access' : 'Sign in with Google'"
            @click="authenticateWithGoogle" :loading="authenticating" />
        </template>
        <template v-else v-slot:action>
          <q-btn flat icon="mdi-check" label="Connected" disabled />
        </template>
      </q-banner>

      <!-- Configuration Form -->
      <q-form @submit="saveConfiguration" class="q-gutter-md">

        <!-- Enable/Disable Toggle -->
        <q-toggle v-model="syncConfig.enabled" :label="$t('admin.calendar.form.enable')" color="positive"
          class="q-mb-md" />

        <!-- Calendar Selection -->
        <div v-if="syncConfig.enabled">
          <q-select v-model="syncConfig.calendarId" :options="calendarOptions"
            :label="$t('admin.calendar.form.selectCalendar')" outlined emit-value map-options class="q-mb-md">
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  {{ $t('admin.calendar.form.noCalendars') }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Sync Mode -->
          <q-radio v-model="syncConfig.syncMode" val="manual" :label="$t('admin.calendar.form.syncMode.manual')"
            class="q-mb-sm" />
          <div class="text-caption text-grey q-ml-lg q-mb-md">
            {{ $t('admin.calendar.form.syncMode.manualDesc') }}
          </div>

          <q-radio v-model="syncConfig.syncMode" val="auto" :label="$t('admin.calendar.form.syncMode.auto')"
            class="q-mb-sm" />
          <div class="text-caption text-grey q-ml-lg q-mb-md">
            {{ $t('admin.calendar.form.syncMode.autoDesc') }}
          </div>

          <!-- Public Calendar URL -->
          <q-input v-model="syncConfig.publicCalendarUrl" :label="$t('admin.calendar.form.publicUrl')" outlined
            class="q-mb-md" :hint="$t('admin.calendar.form.publicUrlHint')" />
        </div>

        <!-- Action Buttons -->
        <div class="row q-gutter-sm justify-between">
          <div class="row q-gutter-sm">
            <q-btn type="submit" color="primary" :label="$t('admin.calendar.actions.save')" icon="mdi-content-save"
              :loading="saving" />

            <q-btn v-if="syncConfig.enabled" color="secondary" :label="$t('admin.calendar.actions.testConnection')"
              icon="mdi-connection" outline @click="testConnection" :loading="testing" />
          </div>

          <q-btn v-if="syncConfig.enabled && syncConfig.syncMode === 'manual'" color="accent"
            :label="$t('admin.calendar.actions.syncAll')" icon="mdi-sync" outline @click="syncAllEvents"
            :loading="syncing" />
        </div>
      </q-form>

      <!-- Sync Results -->
      <q-card v-if="lastSyncResult" flat bordered class="q-mt-lg">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">
            <q-icon name="mdi-history" class="q-mr-sm" />
            {{ $t('admin.calendar.lastSync.title') }}
          </div>

          <div class="text-body2">
            <div class="row q-gutter-md">
              <div class="text-positive">
                ✅ {{ lastSyncResult.success }} {{ $t('admin.calendar.lastSync.success') }}
              </div>
              <div v-if="lastSyncResult.failed > 0" class="text-negative">
                ❌ {{ lastSyncResult.failed }} {{ $t('admin.calendar.lastSync.failed') }}
              </div>
            </div>
            <div class="text-caption text-grey q-mt-xs">
              {{ formatDate(lastSyncResult.timestamp) }}
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Public Calendar Info -->
      <q-expansion-item v-if="syncConfig.enabled && syncConfig.publicCalendarUrl"
        :label="$t('admin.calendar.publicInfo.title')" icon="mdi-share-variant" class="q-mt-lg">
        <q-card flat>
          <q-card-section class="text-body2">
            <p class="q-mb-md">{{ $t('admin.calendar.publicInfo.description') }}</p>

            <q-input :model-value="syncConfig.publicCalendarUrl" :label="$t('admin.calendar.publicInfo.urlLabel')"
              readonly outlined class="q-mb-md">
              <template v-slot:append>
                <q-btn icon="mdi-content-copy" flat round @click="copyPublicUrl" :loading="copying" />
              </template>
            </q-input>

            <div class="text-caption text-grey">
              {{ $t('admin.calendar.publicInfo.instructions') }}
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Notify, copyToClipboard } from 'quasar';
import { useCurrentUser } from 'vuefire';
import { ttgEventSyncService, type SyncConfiguration } from 'src/services/ttg-event-sync-service';
import { googleCalendarService } from 'src/services/google-calendar-service';
import { vueFireAuthService } from 'src/services/vuefire-auth-service';

const { t } = useI18n();

// Reactive state
const saving = ref(false);
const testing = ref(false);
const syncing = ref(false);
const copying = ref(false);

// Configuration status
const configStatus = reactive({
  isConfigured: false,
  missingVars: [] as string[],
  message: 'Checking configuration...'
});

const syncConfig = reactive<SyncConfiguration>({
  enabled: false,
  calendarId: process.env.SHARED_CALENDAR_ID || 'primary',
  syncMode: 'manual',
  publicCalendarUrl: '',
});

const calendarOptions = ref<Array<{ label: string; value: string }>>([]);

const lastSyncResult = ref<{
  success: number;
  failed: number;
  timestamp: Date;
} | null>(null);

// Google Authentication state
const authenticating = ref(false);
const currentUser = useCurrentUser();

// Check if user is authenticated with Google (the proper way)
const isGoogleAuthenticated = computed(() => {
  if (!currentUser.value) return false;

  // Check if the user signed in with Google provider
  return currentUser.value.providerData.some(provider => provider.providerId === 'google.com');
});

// Check if Google Calendar permissions are granted
const hasCalendarPermissions = computed(() => {
  return isGoogleAuthenticated.value && vueFireAuthService.isGoogleTokenValid();
});

// For display purposes - always show as authenticated since they're here
const showAsAuthenticated = computed(() => isGoogleAuthenticated.value);

// Load current configuration
const loadConfiguration = () => {
  const config = ttgEventSyncService.getConfiguration();
  Object.assign(syncConfig, config);
};

// Check Google Calendar API configuration
const checkConfiguration = () => {
  const status = googleCalendarService.checkConfiguration();
  Object.assign(configStatus, status);
};

// Save configuration
const saveConfiguration = () => {
  saving.value = true;

  try {
    ttgEventSyncService.configure(syncConfig);

    Notify.create({
      type: 'positive',
      message: t('admin.calendar.success.saved'),
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to save configuration:', error);
    Notify.create({
      type: 'negative',
      message: t('admin.calendar.errors.save'),
      position: 'top',
    });
  } finally {
    saving.value = false;
  }
};// Test calendar connection
const testConnection = async () => {
  testing.value = true;

  try {
    // Test the connection and get calendars
    const result = await googleCalendarService.testConnection();

    if (result.success && result.calendars) {
      // Populate calendar options with actual calendars
      calendarOptions.value = result.calendars.map(calendar => ({
        label: calendar.summary + (calendar.primary ? ' (Primary)' : ''),
        value: calendar.id
      }));

      console.log('📅 Found calendars:', calendarOptions.value);
    }

    Notify.create({
      type: 'positive',
      message: t('admin.calendar.success.connection'),
      position: 'top',
    });
  } catch (error) {
    console.error('Connection test failed:', error);

    // Handle specific Google auth required error
    if (error instanceof Error && error.message === 'GOOGLE_AUTH_REQUIRED') {
      Notify.create({
        type: 'warning',
        message: 'Calendar permissions needed. Click "Grant Calendar Access" to authorize.',
        position: 'top',
        timeout: 5000,
        actions: [
          {
            label: 'Grant Calendar Access',
            color: 'white',
            handler: () => {
              void (async () => {
                try {
                  await googleCalendarService.requestCalendarPermissions();
                  // Test connection again after granting permissions
                  await testConnection();
                } catch (permError) {
                  console.error('Failed to grant Calendar permissions:', permError);
                  Notify.create({
                    type: 'negative',
                    message: 'Failed to grant Calendar permissions. Please try again.',
                    position: 'top',
                  });
                }
              })();
            }
          }
        ]
      });
    } else {
      Notify.create({
        type: 'negative',
        message: t('admin.calendar.errors.connection'),
        position: 'top',
      });
    }
  } finally {
    testing.value = false;
  }
};

// Sync all events
const syncAllEvents = async () => {
  syncing.value = true;

  try {
    const result = await ttgEventSyncService.syncAllEvents();

    lastSyncResult.value = {
      ...result,
      timestamp: new Date(),
    };

    Notify.create({
      type: 'positive',
      message: t('admin.calendar.success.sync', {
        success: result.success,
        failed: result.failed
      }),
      position: 'top',
    });
  } catch (error) {
    console.error('Sync failed:', error);

    // Handle specific Google auth required error
    if (error instanceof Error && error.message === 'GOOGLE_AUTH_REQUIRED') {
      Notify.create({
        type: 'warning',
        message: 'Please sign in with Google first to sync events.',
        position: 'top',
      });
    } else if (error instanceof Error && error.message === 'GOOGLE_CALENDAR_SCOPE_REQUIRED') {
      Notify.create({
        type: 'warning',
        message: 'Please grant calendar permissions to sync events.',
        position: 'top',
      });
    } else {
      Notify.create({
        type: 'negative',
        message: t('admin.calendar.errors.sync'),
        position: 'top',
      });
    }
  } finally {
    syncing.value = false;
  }
};

// Copy public calendar URL
const copyPublicUrl = async () => {
  copying.value = true;

  try {
    if (syncConfig.publicCalendarUrl) {
      await copyToClipboard(syncConfig.publicCalendarUrl);
      Notify.create({
        type: 'positive',
        message: t('admin.calendar.success.copied'),
        position: 'top',
      });
    }
  } catch {
    Notify.create({
      type: 'negative',
      message: t('admin.calendar.errors.copy'),
      position: 'top',
    });
  } finally {
    copying.value = false;
  }
};

// Format date for display
const formatDate = (date: Date) => {
  return date.toLocaleString();
};

// Open Google Cloud Console
const openGoogleConsole = () => {
  window.open('https://console.cloud.google.com/apis/library/calendar-json.googleapis.com', '_blank');
};

// Authenticate with Google for Calendar access
const authenticateWithGoogle = async () => {
  authenticating.value = true;

  try {
    const currentUser = useCurrentUser();

    if (currentUser.value) {
      // User is already signed in - link Google account for Calendar permissions
      await vueFireAuthService.linkGoogleAccount();
    } else {
      // User not signed in - full Google sign in
      await vueFireAuthService.signInWithGoogle();
    }

    // After successful authentication, check configuration again
    checkConfiguration();

    Notify.create({
      type: 'positive',
      message: 'Successfully authenticated with Google Calendar!',
      position: 'top',
    });
  } catch (error) {
    console.error('Google authentication failed:', error);
    Notify.create({
      type: 'negative',
      message: 'Failed to authenticate with Google Calendar. Please try again.',
      position: 'top',
    });
  } finally {
    authenticating.value = false;
  }
};

onMounted(() => {
  loadConfiguration();
  checkConfiguration();
  // Don't auto-load calendars since auth setup is required first
  // void loadCalendars();
});
</script>
