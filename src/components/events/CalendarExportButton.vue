<script setup lang="ts">
import { computed } from 'vue';
import type { Event } from 'src/models/Event';
import type { Game } from 'src/models/Game';
import { calendarExportService } from 'src/services/calendar-export-service';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { Notify } from 'quasar';
import { useI18n } from 'vue-i18n';

defineOptions({
  name: 'CalendarExportButton',
});

interface Props {
  event: Event;
  color?: string;
  size?: string;
  flat?: boolean;
  outlined?: boolean;
  label?: string;
  showLabels?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  size: 'md',
  flat: false,
  outlined: false,
  showLabels: true
});

const { t } = useI18n();
const gamesStore = useGamesFirebaseStore();

// Get the game associated with this event
const game = computed<Game | null>(() => {
  if (!props.event.gameId) return null;
  return gamesStore.games.find(g => g.legacyId === props.event.gameId) || null;
});

// Get the app base URL for event links
const appBaseUrl = computed(() => {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.protocol}//${window.location.host}`;
});

const exportToCalendar = (format: 'google' | 'outlook') => {
  try {
    calendarExportService.openCalendar(props.event, format, game.value, appBaseUrl.value);

    Notify.create({
      type: 'positive',
      message: t('calendar.exportSuccess', { format: format === 'google' ? 'Google Calendar' : 'Outlook' }),
      position: 'top'
    });
  } catch (error) {
    console.error('Calendar export error:', error);
    Notify.create({
      type: 'negative',
      message: t('calendar.exportError'),
      position: 'top'
    });
  }
};

const downloadCalendarFile = () => {
  try {
    calendarExportService.downloadICS(props.event, game.value, appBaseUrl.value);

    Notify.create({
      type: 'positive',
      message: t('calendar.downloadSuccess'),
      position: 'top'
    });
  } catch (error) {
    console.error('Calendar download error:', error);
    Notify.create({
      type: 'negative',
      message: t('calendar.downloadError'),
      position: 'top'
    });
  }
};
</script>

<template>
  <q-btn-dropdown :color="color" :size="size" :flat="flat" :outlined="outlined" :label="label"
    dropdown-icon="mdi-calendar-export" no-caps class="calendar-export-btn">
    <q-list>
      <!-- Google Calendar -->
      <q-item clickable v-close-popup @click="exportToCalendar('google')">
        <q-item-section avatar>
          <q-avatar color="red" text-color="white" size="sm">
            <q-icon name="mdi-google" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('calendar.addToGoogle') }}</q-item-label>
          <q-item-label caption>{{ $t('calendar.addToGoogleDesc') }}</q-item-label>
        </q-item-section>
      </q-item>

      <!-- Outlook Calendar -->
      <q-item clickable v-close-popup @click="exportToCalendar('outlook')">
        <q-item-section avatar>
          <q-avatar color="blue" text-color="white" size="sm">
            <q-icon name="mdi-microsoft-outlook" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('calendar.addToOutlook') }}</q-item-label>
          <q-item-label caption>{{ $t('calendar.addToOutlookDesc') }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <!-- Download ICS file -->
      <q-item clickable v-close-popup @click="downloadCalendarFile">
        <q-item-section avatar>
          <q-avatar color="purple" text-color="white" size="sm">
            <q-icon name="mdi-download" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('calendar.downloadICS') }}</q-item-label>
          <q-item-label caption>{{ $t('calendar.downloadICSDesc') }}</q-item-label>
        </q-item-section>
      </q-item>

      <!-- Apple Calendar (also uses ICS) -->
      <q-item clickable v-close-popup @click="downloadCalendarFile">
        <q-item-section avatar>
          <q-avatar color="grey-8" text-color="white" size="sm">
            <q-icon name="mdi-apple" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('calendar.addToApple') }}</q-item-label>
          <q-item-label caption>{{ $t('calendar.addToAppleDesc') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<style scoped>
.calendar-export-btn {
  min-width: auto;
}
</style>
