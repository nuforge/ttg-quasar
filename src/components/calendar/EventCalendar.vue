<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import { useCalendarStore } from 'src/stores/calendar-store';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { authService } from 'src/services/auth-service';

const calendarStore = useCalendarStore();
const eventsStore = useEventsFirebaseStore();

onMounted(() => {
  // Subscribe to events if not already subscribed
  if (eventsStore.events.length === 0) {
    eventsStore.subscribeToEvents();
  }
});

// Get current user ID
const currentUserId = computed(() => authService.currentUserId.value);

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
    if (value !== undefined && value !== null) {
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
  const eventColors = new Map<string, string>();

  eventsStore.events.forEach((event) => {
    if (event.date && event.isUpcoming()) {
      const dateStr = formatToSlash(event.date);
      eventDatesSet.add(dateStr);

      let color = 'grey-6'; // Default color

      if (currentUserId.value) {
        const userId = parseInt(currentUserId.value);
        if (event.isPlayerConfirmed(userId)) {
          color = 'green'; // Confirmed events are green
        } else if (event.isPlayerInterested(userId)) {
          color = 'orange'; // Interested events are orange
        } else {
          color = 'blue'; // Other upcoming events are blue
        }
      } else {
        color = 'blue'; // Default for non-authenticated users
      }

      eventColors.set(dateStr, color);
    }
  });

  // Return a function that checks if a date has events
  return (date: string) => {
    return eventDatesSet.has(date);
  };
});

// Separate computed for event colors
const getEventColor = computed(() => {
  const eventColors = new Map<string, string>();

  eventsStore.events.forEach((event) => {
    if (event.date && event.isUpcoming()) {
      const dateStr = formatToSlash(event.date);

      if (currentUserId.value) {
        const userId = parseInt(currentUserId.value);
        if (event.isPlayerConfirmed(userId)) {
          eventColors.set(dateStr, 'green');
        } else if (event.isPlayerInterested(userId)) {
          eventColors.set(dateStr, 'orange');
        } else {
          eventColors.set(dateStr, 'blue');
        }
      } else {
        eventColors.set(dateStr, 'blue');
      }
    }
  });

  return (date: string) => eventColors.get(date) || 'blue';
});

// Handle date clicks to show events for that date
const onDateClick = (date: string) => {
  const selectedDateStr = formatToDash(date);
  const dayEvents = eventsStore.events.filter(event =>
    event.date === selectedDateStr && event.isUpcoming()
  );

  if (dayEvents.length > 0) {
    // If there's only one event, navigate to it directly
    if (dayEvents.length === 1 && dayEvents[0]) {
      // Navigate to event page
      window.location.href = `/events/${dayEvents[0].id}`;
    } else {
      // Show a dialog with multiple events for this date
      console.log('Multiple events on this date:', dayEvents.map(e => e.title));
      // TODO: Could show a dialog or navigate to events page with date filter
    }
  }
};
</script>

<template>
  <q-card>
    <q-date v-model="selectedDate" :events="eventDates" :event-color="getEventColor" minimal flat text-color="black"
      first-day-of-week="1" @click="onDateClick" />
  </q-card>
</template>
