<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useCalendarStore } from 'src/stores/calendar-store';
import { authService } from 'src/services/auth-service';
import EventCard from './events/EventCardMini.vue';
import EventCalendar from './calendar/EventCalendar.vue';

const { t } = useI18n();

const rightDrawerOpen = ref(true);
const eventsStore = useEventsFirebaseStore();
const calendarStore = useCalendarStore();

// Collapsible section states
const showMyEvents = ref(false); // Start collapsed
const showInterestedEvents = ref(false); // Start collapsed
const showUpcomingEvents = ref(true); // Keep this open by default
const showSelectedDateEvents = ref(true); // Show selected date events by default

onMounted(() => {
  // Subscribe to events if not already subscribed
  if (eventsStore.events.length === 0) {
    eventsStore.subscribeToEvents();
  }
});

// Get current user ID
const currentUserId = computed(() => authService.currentUserId.value);

// Filter events to show only upcoming ones
const upcomingEvents = computed(() => {
  return eventsStore.events
    .filter(event => event.isUpcoming())
    .sort((a, b) => a.getDateObject().getTime() - b.getDateObject().getTime());
});

// Events user has confirmed RSVP for
const myConfirmedEvents = computed(() => {
  if (!currentUserId.value) return [];
  return eventsStore.events.filter(event =>
    event.isUpcoming() && event.isPlayerConfirmed(parseInt(currentUserId.value!))
  ).sort((a, b) => a.getDateObject().getTime() - b.getDateObject().getTime());
});

// Events user is interested in
const myInterestedEvents = computed(() => {
  if (!currentUserId.value) return [];
  return eventsStore.events.filter(event =>
    event.isUpcoming() && event.isPlayerInterested(parseInt(currentUserId.value!))
  ).sort((a, b) => a.getDateObject().getTime() - b.getDateObject().getTime());
});

// Events for the selected date
const selectedDateEvents = computed(() => {
  if (!calendarStore.selectedDate) return [];
  return eventsStore.events.filter(event =>
    event.date === calendarStore.selectedDate && event.isUpcoming()
  ).sort((a, b) => a.getDateObject().getTime() - b.getDateObject().getTime());
});
</script>

<template>
  <q-drawer v-model="rightDrawerOpen" side="right" persistent show-if-above class="drawer-theme-responsive">
    <!-- drawer content -->
    <div class="drawer-content-container">
      <EventCalendar flat />

      <q-scroll-area class="flex-grow" style="flex: 1;">
        <!-- Events for Selected Date -->
        <q-expansion-item v-if="selectedDateEvents.length > 0" v-model="showSelectedDateEvents"
          icon="mdi-calendar-today" :label="`${calendarStore.selectedDate} (${selectedDateEvents.length})`"
          header-class="text-blue text-weight-bold" class="q-ma-sm">
          <div class="q-pa-sm">
            <EventCard v-for="event in selectedDateEvents" :key="event.id" :event="event" />
          </div>
        </q-expansion-item>

        <!-- My Confirmed Events -->
        <q-expansion-item v-if="currentUserId && myConfirmedEvents.length > 0" v-model="showMyEvents"
          icon="mdi-calendar-check" :label="`${t('myEvents')} (${myConfirmedEvents.length})`"
          header-class="text-green text-weight-bold" class="q-ma-sm">
          <div class="q-pa-sm">
            <EventCard v-for="event in myConfirmedEvents" :key="event.id" :event="event" />
          </div>
        </q-expansion-item>

        <!-- My Interested Events -->
        <q-expansion-item v-if="currentUserId && myInterestedEvents.length > 0" v-model="showInterestedEvents"
          icon="mdi-heart" :label="`${t('interested')} (${myInterestedEvents.length})`"
          header-class="text-orange text-weight-bold" class="q-ma-sm">
          <div class="q-pa-sm">
            <EventCard v-for="event in myInterestedEvents" :key="event.id" :event="event" />
          </div>
        </q-expansion-item>

        <!-- All Upcoming Events -->
        <q-expansion-item v-model="showUpcomingEvents" icon="mdi-calendar-clock"
          :label="`${t('allUpcoming')} (${upcomingEvents.length})`" header-class="text-weight-bold" class="q-ma-sm">
          <div class="q-pa-sm">
            <EventCard v-for="event in upcomingEvents" :key="event.id" :event="event" />
          </div>
        </q-expansion-item>
      </q-scroll-area>
    </div>
  </q-drawer>
</template>

<style scoped>
.drawer-theme-responsive {
  background-color: var(--q-color-surface);
  color: var(--q-color-on-surface);
}

.drawer-content-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--q-color-surface);
  color: var(--q-color-on-surface);
}

.q-expansion-item {
  margin: 0.5rem 0;
}
</style>
