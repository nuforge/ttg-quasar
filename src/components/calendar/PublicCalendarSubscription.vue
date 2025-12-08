<template>
  <q-card flat class="q-pa-lg">
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon name="mdi-calendar-plus" class="q-mr-sm" />
        {{ $t('calendar.subscription.title') }}
      </div>

      <div v-if="!publicCalendarUrl" class="text-center q-pa-xl">
        <q-icon name="mdi-calendar-off" size="4rem" color="grey-5" class="q-mb-md" />
        <div class="text-h6 text-grey-6 q-mb-sm">
          {{ $t('calendar.subscription.notAvailable') }}
        </div>
        <div class="text-body2 text-grey-5">
          {{ $t('calendar.subscription.contactAdmin') }}
        </div>
      </div>

      <div v-else>
        <!-- Calendar Info -->
        <q-banner class="bg-primary text-white rounded q-mb-lg">
          <template v-slot:avatar>
            <q-icon name="mdi-information" />
          </template>
          <div class="text-body1">
            <strong>{{ $t('calendar.subscription.available.title') }}</strong>
          </div>
          <div class="text-caption">
            {{ $t('calendar.subscription.available.description') }}
          </div>
        </q-banner>

        <!-- Subscription Options -->
        <div class="q-gutter-md">

          <!-- Google Calendar -->
          <q-card flat bordered>
            <q-card-section class="row items-center q-gutter-md">
              <q-icon name="mdi-google" size="2rem" color="red" />
              <div class="col">
                <div class="text-subtitle1">{{ $t('calendar.subscription.google.title') }}</div>
                <div class="text-caption text-grey">{{ $t('calendar.subscription.google.description') }}
                </div>
              </div>
              <q-btn color="red" outline :label="$t('calendar.subscription.google.action')" icon="mdi-plus"
                @click="subscribeToGoogle" />
            </q-card-section>
          </q-card>

          <!-- Outlook Calendar -->
          <q-card flat bordered>
            <q-card-section class="row items-center q-gutter-md">
              <q-icon name="mdi-microsoft-outlook" size="2rem" color="blue" />
              <div class="col">
                <div class="text-subtitle1">{{ $t('calendar.subscription.outlook.title') }}</div>
                <div class="text-caption text-grey">{{ $t('calendar.subscription.outlook.description')
                  }}</div>
              </div>
              <q-btn color="blue" outline :label="$t('calendar.subscription.outlook.action')" icon="mdi-plus"
                @click="subscribeToOutlook" />
            </q-card-section>
          </q-card>

          <!-- Apple Calendar -->
          <q-card flat bordered>
            <q-card-section class="row items-center q-gutter-md">
              <q-icon name="mdi-apple" size="2rem" color="grey-8" />
              <div class="col">
                <div class="text-subtitle1">{{ $t('calendar.subscription.apple.title') }}</div>
                <div class="text-caption text-grey">{{ $t('calendar.subscription.apple.description') }}
                </div>
              </div>
              <q-btn color="grey-8" outline :label="$t('calendar.subscription.apple.action')" icon="mdi-plus"
                @click="subscribeToApple" />
            </q-card-section>
          </q-card>

          <!-- Generic/Other -->
          <q-card flat bordered>
            <q-card-section class="row items-center q-gutter-md">
              <q-icon name="mdi-calendar-import" size="2rem" color="primary" />
              <div class="col">
                <div class="text-subtitle1">{{ $t('calendar.subscription.other.title') }}</div>
                <div class="text-caption text-grey">{{ $t('calendar.subscription.other.description') }}
                </div>
              </div>
              <q-btn color="primary" outline :label="$t('calendar.subscription.other.action')" icon="mdi-content-copy"
                @click="copyCalendarUrl" :loading="copying" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Manual Instructions -->
        <q-expansion-item :label="$t('calendar.subscription.manual.title')" icon="mdi-help-circle-outline"
          class="q-mt-lg">
          <q-card flat>
            <q-card-section class="text-body2">

              <!-- URL Display -->
              <div class="q-mb-md">
                <div class="text-subtitle2 q-mb-xs">{{ $t('calendar.subscription.manual.urlTitle') }}
                </div>
                <q-input :model-value="publicCalendarUrl" readonly outlined dense class="q-mb-sm">
                  <template v-slot:append>
                    <q-btn icon="mdi-content-copy" flat round size="sm" @click="copyCalendarUrl" :loading="copying" />
                  </template>
                </q-input>
              </div>

              <!-- Step-by-step instructions -->
              <div class="q-mb-md">
                <div class="text-subtitle2 q-mb-sm">{{ $t('calendar.subscription.manual.steps.title') }}
                </div>

                <q-list dense>
                  <q-item v-for="(step, index) in manualSteps" :key="index">
                    <q-item-section side>
                      <q-chip :label="index + 1" color="primary" text-color="white" size="sm" />
                    </q-item-section>
                    <q-item-section>
                      <div class="text-body2">{{ step }}</div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- Benefits -->
              <div class="bg-positive-1 q-pa-md rounded">
                <div class="text-subtitle2 text-positive q-mb-sm">
                  <q-icon name="mdi-check-circle" class="q-mr-xs" />
                  {{ $t('calendar.subscription.benefits.title') }}
                </div>
                <ul class="text-body2 q-ma-none q-pl-lg">
                  <li v-for="benefit in benefits" :key="benefit">{{ benefit }}</li>
                </ul>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Notify, copyToClipboard } from 'quasar';
import { ttgEventSyncService } from 'src/services/ttg-event-sync-service';

const { t } = useI18n();

// Reactive state
const copying = ref(false);

// Get public calendar URL from sync service
const publicCalendarUrl = computed(() => {
  return ttgEventSyncService.getPublicCalendarUrl();
});

// Manual steps for adding calendar
const manualSteps = computed(() => [
  t('calendar.subscription.manual.steps.copy'),
  t('calendar.subscription.manual.steps.open'),
  t('calendar.subscription.manual.steps.add'),
  t('calendar.subscription.manual.steps.paste'),
  t('calendar.subscription.manual.steps.save'),
]);

// Benefits of subscribing
const benefits = computed(() => [
  t('calendar.subscription.benefits.automatic'),
  t('calendar.subscription.benefits.realtime'),
  t('calendar.subscription.benefits.integration'),
  t('calendar.subscription.benefits.notifications'),
]);

// Subscribe to Google Calendar
const subscribeToGoogle = () => {
  if (!publicCalendarUrl.value) return;

  // Open Google Calendar add subscription page
  const googleUrl = `https://calendar.google.com/calendar/u/0/r/settings/addcalendar?cid=${encodeURIComponent(publicCalendarUrl.value)}`;
  window.open(googleUrl, '_blank');

  Notify.create({
    type: 'positive',
    message: t('calendar.subscription.opened'),
    position: 'top',
  });
};

// Subscribe to Outlook
const subscribeToOutlook = () => {
  if (!publicCalendarUrl.value) return;

  // Open Outlook web calendar subscription
  const outlookUrl = `https://outlook.live.com/calendar/0/addcalendar?url=${encodeURIComponent(publicCalendarUrl.value)}`;
  window.open(outlookUrl, '_blank');

  Notify.create({
    type: 'positive',
    message: t('calendar.subscription.opened'),
    position: 'top',
  });
};

// Subscribe to Apple Calendar (iOS)
const subscribeToApple = () => {
  if (!publicCalendarUrl.value) return;

  // For iOS devices, use webcal:// protocol
  const webcalUrl = publicCalendarUrl.value.replace(/^https?:\/\//, 'webcal://');

  // Try to open with webcal protocol (works on iOS)
  window.location.href = webcalUrl;

  // Show fallback instructions
  setTimeout(() => {
    Notify.create({
      type: 'info',
      message: t('calendar.subscription.apple.fallback'),
      position: 'top',
      timeout: 5000,
    });
  }, 1000);
};

// Copy calendar URL
const copyCalendarUrl = async () => {
  if (!publicCalendarUrl.value) return;

  copying.value = true;

  try {
    await copyToClipboard(publicCalendarUrl.value);
    Notify.create({
      type: 'positive',
      message: t('calendar.subscription.urlCopied'),
      position: 'top',
    });
  } catch {
    Notify.create({
      type: 'negative',
      message: t('calendar.subscription.copyFailed'),
      position: 'top',
    });
  } finally {
    copying.value = false;
  }
};

onMounted(() => {
  // Component initialization if needed
});
</script>
