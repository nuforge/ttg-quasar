<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEventsStore } from 'src/stores/events-store';
import type { Event } from 'src/models/Event';

const route = useRoute();
const eventsStore = useEventsStore();
const eventId = ref(route.params.id ? route.params.id.toString().split('/')[0] : '');
const event = ref<Event | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    if (eventId.value) {
      // Fetch the event data using the ID from the route
      event.value = await eventsStore.getEventById(eventId.value);
    }
  } catch (error) {
    console.error('Error fetching event:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div v-if="loading">
        <q-spinner color="primary" size="3em" />
        <div class="text-body1 q-mt-md">Loading event details...</div>
      </div>

      <div v-else-if="event">
        <h1 class="text-h4">{{ event.title }}</h1>

        <!-- Event details here -->
        <div class="q-mt-md">
          <div class="text-h6">Event Details</div>
          <q-list>
            <q-item>
              <q-item-section avatar>
                <q-icon name="mdi-calendar" />
              </q-item-section>
              <q-item-section>Date: {{ event.getFormattedDate() }}</q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="mdi-clock" />
              </q-item-section>
              <q-item-section>
                Time: {{ event.time }}
                <span v-if="event.endTime"> - {{ event.endTime }}</span>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="mdi-account-group" />
              </q-item-section>
              <q-item-section>Players: {{ event.currentPlayers }} / {{ event.maxPlayers
                }}</q-item-section>
            </q-item>

            <q-item v-if="event.description">
              <q-item-section avatar>
                <q-icon name="mdi-text" />
              </q-item-section>
              <q-item-section>{{ event.description }}</q-item-section>
            </q-item>
          </q-list>
        </div>

        <div class="q-mt-lg">
          <q-btn color="primary" icon="mdi-calendar-check" label="Join Event" />
        </div>
      </div>

      <div v-else class="text-h5 text-center q-pa-xl">
        Event not found
      </div>
    </div>
  </q-page>
</template>
