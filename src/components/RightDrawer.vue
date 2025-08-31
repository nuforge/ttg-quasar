<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { authService } from 'src/services/auth-service';
import EventCard from './events/EventCardMini.vue';
import EventCalendar from './calendar/EventCalendar.vue';

const rightDrawerOpen = ref(true);
const eventsStore = useEventsFirebaseStore();

// Collapsible section states
const showMyEvents = ref(false); // Start collapsed
const showInterestedEvents = ref(false); // Start collapsed
const showUpcomingEvents = ref(true); // Keep this open by default

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
</script>

<template>
  <q-drawer v-model="rightDrawerOpen" side="right" persistent show-if-above>
    <!-- drawer content -->
    <div class="drawer-content-container" style="display: flex; flex-direction: column; height: 100%;">
      <EventCalendar flat />

      <q-scroll-area class="flex-grow" style="flex: 1;">
        <!-- My Confirmed Events -->
        <q-expansion-item v-if="currentUserId && myConfirmedEvents.length > 0" v-model="showMyEvents"
          icon="mdi-calendar-check" :label="`My Events (${myConfirmedEvents.length})`"
          header-class="text-green text-weight-bold" class="q-ma-sm">
          <div class="q-pa-sm">
            <EventCard v-for="event in myConfirmedEvents" :key="event.id" :event="event" />
          </div>
        </q-expansion-item>

        <!-- My Interested Events -->
        <q-expansion-item v-if="currentUserId && myInterestedEvents.length > 0" v-model="showInterestedEvents"
          icon="mdi-heart" :label="`Interested (${myInterestedEvents.length})`"
          header-class="text-orange text-weight-bold" class="q-ma-sm">
          <div class="q-pa-sm">
            <EventCard v-for="event in myInterestedEvents" :key="event.id" :event="event" />
          </div>
        </q-expansion-item>

        <!-- All Upcoming Events -->
        <q-expansion-item v-model="showUpcomingEvents" icon="mdi-calendar-clock"
          :label="`All Upcoming (${upcomingEvents.length})`" header-class="text-white text-weight-bold" class="q-ma-sm">
          <div class="q-pa-sm">
            <EventCard v-for="event in upcomingEvents" :key="event.id" :event="event" />
          </div>
        </q-expansion-item>
      </q-scroll-area>
    </div>
  </q-drawer>
</template>
