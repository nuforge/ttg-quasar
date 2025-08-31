<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { useMessagesFirebaseStore } from 'src/stores/messages-firebase-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import type { Event } from 'src/models/Event';
import type { Player } from 'src/models/Player';
import PlayerDetails from 'src/components/players/PlayerDetails.vue';
import PlayersList from 'src/components/players/PlayersList.vue';
import MessageList from 'src/components/messaging/MessageList.vue';
import MessageComposer from 'src/components/messaging/MessageComposer.vue';
import EventRSVPButtons from 'src/components/events/EventRSVPButtons.vue';

const route = useRoute();
const eventsStore = useEventsFirebaseStore();
const playersStore = usePlayersFirebaseStore();
const messagesStore = useMessagesFirebaseStore();
const gamesStore = useGamesFirebaseStore();

const eventId = ref(route.params.id ? route.params.id.toString().split('/')[0] : '');
const event = ref<Event | null>(null);
const loading = ref(true);
const selectedPlayer = ref<Player | null>(null);
const showPlayerDetailsDialog = ref(false);

// Get game details for this event
const game = computed(() => {
  if (!event.value) return null;
  return gamesStore.games.find(g => g.legacyId === event.value?.gameId) || null;
});

// Get players for this event (confirmed only)
const eventPlayers = computed<Player[]>(() => {
  if (!event.value) return [];

  const playerIds = event.value.getPlayerIds();
  return playersStore.getPlayersByIds(playerIds);
});

// Get interested players
const interestedPlayers = computed<Player[]>(() => {
  if (!event.value) return [];

  const interestedRSVPs = event.value.getRSVPsByStatus('interested');
  const playerIds = interestedRSVPs.map(rsvp => rsvp.playerId);
  return playersStore.getPlayersByIds(playerIds);
});

// Get event comments
const eventComments = computed(() => {
  if (!eventId.value) return [];
  return messagesStore.eventMessages(eventId.value);
});

// Watch for events to be loaded and find our event
watch(
  () => eventsStore.events,
  (newEvents) => {
    if (newEvents.length > 0 && eventId.value && !event.value) {
      console.log('Events loaded, looking for event ID:', eventId.value);
      console.log('Available events:', newEvents.map(e => ({ id: e.id, title: e.title })));

      const foundEvent = newEvents.find(e => e.id === parseInt(eventId.value || '0', 10));
      if (foundEvent) {
        console.log('Found event:', foundEvent.title);
        event.value = foundEvent;
      } else {
        console.warn(`Event with ID ${eventId.value} not found in ${newEvents.length} available events`);
      }
      loading.value = false;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  try {
    if (eventId.value) {
      console.log('Loading event with ID:', eventId.value);

      // Load games data
      if (gamesStore.games.length === 0) {
        await gamesStore.loadGames();
      }

      // Load players data
      if (playersStore.players.length === 0) {
        await playersStore.fetchAllPlayers();
      }

      // Subscribe to events - the watcher will handle finding the event
      eventsStore.subscribeToEvents();

      // Subscribe to messages for this event
      messagesStore.subscribeToEventMessages(eventId.value);
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    loading.value = false;
  }
});

// Show player details
const showPlayerDetails = (player: Player) => {
  selectedPlayer.value = player;
  showPlayerDetailsDialog.value = true;
};

// Get events for a specific player
const getPlayerEvents = (player: Player) => {
  return eventsStore.events.filter(event =>
    event.rsvps.some(rsvp =>
      rsvp.playerId === player.id && rsvp.status === 'confirmed'
    )
  );
};

const sendEventComment = (message: string) => {
  if (!event.value) return;

  void messagesStore.sendMessage({
    type: 'event',
    eventId: event.value.id,
    content: message,
    recipients: [], // Add required recipients array
  });
};
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div v-if="loading">
        <q-spinner color="primary" size="3em" />
        <div class="text-body1 q-mt-md">Loading event details...</div>
      </div>

      <div v-else-if="event">
        <div class="row items-center q-mb-md">
          <div class="col">
            <h1 class="text-h4 q-mb-none">{{ event.title }}</h1>
            <q-badge :color="event.status === 'upcoming' ? 'green' : 'grey'" class="q-mt-sm">
              {{ event.status }}
            </q-badge>
          </div>
          <div class="col-auto">
            <EventRSVPButtons :event="event" />
          </div>
        </div>

        <!-- Event details grid -->
        <div class="row q-col-gutter-md">
          <!-- Left column - Event info -->
          <div class="col-12 col-md-8">
            <q-card>
              <q-card-section>
                <div class="text-h6">Event Details</div>
                <q-list>
                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="mdi-calendar" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Date</q-item-label>
                      <q-item-label caption>{{ event.getFormattedDate() }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="mdi-clock" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Time</q-item-label>
                      <q-item-label caption>
                        {{ event.time }}
                        <span v-if="event.endTime"> - {{ event.endTime }}</span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="mdi-map-marker" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Location</q-item-label>
                      <q-item-label caption>{{ event.location }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="mdi-account-group" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Players</q-item-label>
                      <q-item-label caption>
                        {{ event.getConfirmedCount() }} / {{ event.maxPlayers }} confirmed
                        <span v-if="event.getInterestedCount() > 0" class="text-orange">
                          (+{{ event.getInterestedCount() }} interested)
                        </span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="game">
                    <q-item-section avatar>
                      <q-icon name="mdi-dice-multiple" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Game</q-item-label>
                      <q-item-label caption>
                        <router-link :to="`/games/${game.id}`">{{ game.title }}</router-link>
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="mdi-account" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Host</q-item-label>
                      <q-item-label caption>{{ event.host.name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>

              <q-card-section v-if="event.description">
                <div class="text-h6">Description</div>
                <p>{{ event.description }}</p>
              </q-card-section>

              <q-card-section v-if="event.notes">
                <div class="text-h6">Notes</div>
                <p>{{ event.notes }}</p>
              </q-card-section>
            </q-card>
          </div>

          <!-- Right column - Players & game info -->
          <div class="col-12 col-md-4">
            <!-- Players section -->
            <q-card class="q-mb-md">
              <q-card-section>
                <div class="text-h6">Confirmed Players ({{ eventPlayers.length }})</div>
                <PlayersList :players="eventPlayers" @show-player="showPlayerDetails" />
              </q-card-section>

              <q-card-section v-if="event.getConfirmedCount() < event.maxPlayers">
                <q-banner class="bg-primary text-black">
                  <template v-slot:avatar>
                    <q-icon name="mdi-information" />
                  </template>
                  {{ event.maxPlayers - event.getConfirmedCount() }} more {{ event.maxPlayers -
                    event.getConfirmedCount() === 1 ?
                    'player' :
                    'players' }} needed!
                </q-banner>
              </q-card-section>
            </q-card>

            <!-- Interested players section -->
            <q-card v-if="interestedPlayers.length > 0" class="q-mb-md">
              <q-card-section>
                <div class="text-h6 text-orange">Interested Players ({{ interestedPlayers.length }})</div>
                <PlayersList :players="interestedPlayers" @show-player="showPlayerDetails" />
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Event Comments Section -->
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12">
            <q-card bordered>
              <q-card-section>
                <div class="text-h6">
                  <q-icon name="mdi-comment-multiple" /> Event Discussion
                </div>
              </q-card-section>
              <q-card-section class="q-pa-none">
                <MessageList :messages="eventComments" :show-sender="true" />
              </q-card-section>
              <q-card-section>
                <MessageComposer @message-sent="sendEventComment" />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
      <div v-else class="text-center q-pa-xl">
        <div class="text-h5 q-mb-md">Event not found</div>
        <div class="text-body1 q-mb-md">
          Looking for event ID: <strong>{{ eventId }}</strong>
        </div>
        <div v-if="eventsStore.events.length > 0" class="q-mt-lg">
          <div class="text-h6 q-mb-md">Available Events:</div>
          <q-list bordered class="rounded-borders">
            <q-item v-for="availableEvent in eventsStore.events" :key="availableEvent.id" clickable
              :to="`/events/${availableEvent.id}`">
              <q-item-section>
                <q-item-label>{{ availableEvent.title }}</q-item-label>
                <q-item-label caption>ID: {{ availableEvent.id }} | Date: {{ availableEvent.getFormattedDate()
                  }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div v-else-if="!loading" class="text-body2 text-grey">
          No events found in database. Try creating some events first.
        </div>
        <div v-if="loading" class="q-mt-lg">
          <q-spinner-dots size="2em" />
          <div class="q-mt-sm">Loading events...</div>
        </div>
      </div>
    </div>

    <!-- Player details dialog -->
    <q-dialog v-model="showPlayerDetailsDialog" persistent>
      <PlayerDetails v-if="selectedPlayer" :player="selectedPlayer" :player-events="getPlayerEvents(selectedPlayer)"
        @close="showPlayerDetailsDialog = false">
        <template v-slot:actions>
          <q-btn flat label="Close" color="primary" v-close-popup />
        </template>
      </PlayerDetails>
    </q-dialog>
  </q-page>
</template>
