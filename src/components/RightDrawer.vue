<script setup lang="ts">
import { ref, computed } from 'vue';
const rightDrawerOpen = ref(true);
import eventsData from 'src/assets/data/events.json';
import { Event } from 'src/models/Event';
import type { EventStatus } from 'src/models/Event';
import EventCard from './events/EventCard.vue';

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

// Add a separate ref for the selected date
const selectedDate = ref(new Date().toISOString().split('T')[0]);

// Filter events to show only upcoming ones
const upcomingEvents = computed(() => {
  return events
    .filter(event => event.isUpcoming())
    .sort((a, b) => a.getDateObject().getTime() - b.getDateObject().getTime());
});

const eventDates = computed(() => {
  const eventDatesSet = new Set<string>();

  events.forEach(event => {
    if (event.date) {
      try {
        // Parse the date in the local timezone to avoid UTC conversion issues
        const dateParts = event.date.split('-').map(Number);
        if (dateParts.length === 3) {
          const [year, month, day] = dateParts as [number, number, number];
          const eventDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date

          if (!isNaN(eventDate.getTime())) {
            // Format as YYYY/MM/DD for q-date
            const formattedDate = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
            eventDatesSet.add(formattedDate);
          }
        }
      } catch (e) {
        console.error(`Error parsing date for event: ${event.title || 'Unknown'}`, e);
      }
    }
  });

  // Return a function that checks if a date is in our events set
  return (date: string) => {
    return eventDatesSet.has(date);
  };
});
</script>

<template>
  <q-drawer v-model="rightDrawerOpen" side="right" persistent show-if-above>
    <!-- drawer content -->
    <div class="drawer-content-container" style="display: flex; flex-direction: column; height: 100%;">
      <q-date v-model="selectedDate" :events="eventDates" minimal flat text-color="black" first-day-of-week="1"
        event-color="primary" />

      <div class="text-h6 q-pa-md text-uppercase">{{ $t('upcoming') }} {{ $t('event', 2) }}</div>
      <q-scroll-area class="flex-grow" style="flex: 1;">
        <EventCard :event="event" v-for="event in upcomingEvents" :key="event.title" />
      </q-scroll-area>
    </div>
  </q-drawer>
</template>
