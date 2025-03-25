<script setup lang="ts">
import { computed, watch } from 'vue';
import { useCalendarStore } from 'src/stores/calendar-store';
import eventsData from 'src/assets/data/events.json';
import { Event } from 'src/models/Event';
import type { EventStatus } from 'src/models/Event';

const calendarStore = useCalendarStore();

// Pre-process the JSON data to convert status strings to EventStatus
const processedEventsData = eventsData.map(event => ({
  ...event,
  status: event.status as unknown as EventStatus,
  rsvps: event.rsvps?.map(rsvp => ({
    ...rsvp,
    status: rsvp.status as "confirmed" | "waiting" | "cancelled"
  }))
}));

// Convert the JSON data to Event objects
const events = Event.fromJSON(processedEventsData);

// Format conversion helper functions
const formatToSlash = (dateStr: string): string => {
  // Convert YYYY-MM-DD to YYYY/MM/DD
  return dateStr.replace(/-/g, '/');
};

const formatToDash = (dateStr: string): string => {
  // Convert YYYY/MM/DD to YYYY-MM-DD
  return dateStr.replace(/\//g, '-');
};

// Use the selected date from store with computed for v-model binding
const selectedDate = computed({
  get: () => {
    // Convert the store's YYYY-MM-DD to YYYY/MM/DD for q-date
    // Default to current date if selectedDate is undefined
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const dateToFormat = calendarStore.selectedDate ?? today;
    return formatToSlash(dateToFormat || '');
  },
  set: (value) => {
    if (value !== undefined) {
      // Convert back to YYYY-MM-DD for the store
      calendarStore.setSelectedDate(formatToDash(value));
    }
  }
});

// Watch for changes in the store and force update if needed
watch(() => calendarStore.selectedDate, (newDate) => {
  // Ensure the calendar updates when the store changes
  if (newDate !== undefined) {
    selectedDate.value = formatToSlash(newDate);
  }
});

const eventDates = computed(() => {
  const eventDatesSet = new Set<string>();

  events.forEach(event => {
    if (event.date) {
      try {
        // Use the date directly, just convert format from YYYY-MM-DD to YYYY/MM/DD
        eventDatesSet.add(formatToSlash(event.date));
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
  <q-card>
    <q-date v-model="selectedDate" :events="eventDates" minimal flat text-color="black" first-day-of-week="1"
      event-color="primary" />
  </q-card>
</template>
