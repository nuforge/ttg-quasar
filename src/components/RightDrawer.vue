<script setup lang="ts">
import { ref, computed } from 'vue';
import eventsData from 'src/assets/data/events.json';
import { Event } from 'src/models/Event';
import type { EventStatus } from 'src/models/Event';
import EventCard from './events/EventCardMini.vue';
import EventCalendar from './calendar/EventCalendar.vue';

const rightDrawerOpen = ref(true);

// Pre-process the JSON data to convert status strings to EventStatus
const processedEventsData = eventsData.map(event => ({
  ...event,
  status: event.status as unknown as EventStatus,
  // Process rsvps array to convert status strings to the proper type
  rsvps: event.rsvps?.map(rsvp => ({
    ...rsvp,
    status: rsvp.status as "confirmed" | "waiting" | "cancelled"
  }))
}));

// Convert the JSON data to Event objects
const events = Event.fromJSON(processedEventsData);

// Filter events to show only upcoming ones
const upcomingEvents = computed(() => {
  return events
    .filter(event => event.isUpcoming())
    .sort((a, b) => a.getDateObject().getTime() - b.getDateObject().getTime());
});
</script>

<template>
  <q-drawer v-model="rightDrawerOpen" side="right" persistent show-if-above>
    <!-- drawer content -->
    <div class="drawer-content-container" style="display: flex; flex-direction: column; height: 100%;">
      <EventCalendar flat />

      <div class="text-h6 q-pa-md text-uppercase">{{ $t('upcoming') }} {{ $t('event', 2) }}</div>
      <q-scroll-area class="flex-grow" style="flex: 1;">
        <EventCard :event="event" v-for="event in upcomingEvents" :key="event.title" />
      </q-scroll-area>
    </div>
  </q-drawer>
</template>
