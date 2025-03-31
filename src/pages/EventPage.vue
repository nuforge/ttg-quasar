<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useEventsStore } from 'src/stores/events-store';
import { usePlayersStore } from 'src/stores/players-store';
import { useMessagesStore } from 'src/stores/messages-store';
import type { Event } from 'src/models/Event';
import type { Player } from 'src/models/Player';
import games from 'src/assets/data/games.json';
import PlayerDetails from 'src/components/players/PlayerDetails.vue';
import PlayersList from 'src/components/players/PlayersList.vue';
import MessageList from 'src/components/messaging/MessageList.vue';

const route = useRoute();
const eventsStore = useEventsStore();
const playersStore = usePlayersStore();
const messagesStore = useMessagesStore();

const eventId = ref(route.params.id ? route.params.id.toString().split('/')[0] : '');
const event = ref<Event | null>(null);
const loading = ref(true);
const selectedPlayer = ref<Player | null>(null);
const showPlayerDetailsDialog = ref(false);

// Get game details for this event
const game = computed(() => {
  if (!event.value) return null;
  // Add explicit null check to satisfy TypeScript
  return games.find(g => g.id === event.value?.gameId) || null;
});

// Get players for this event
const eventPlayers = computed<Player[]>(() => {
  if (!event.value) return [];

  const playerIds = event.value.getPlayerIds();
  return playersStore.getPlayersByIds(playerIds);
});

// Get event comments
const eventComments = computed(() => {
  if (!eventId.value) return [];
  return messagesStore.eventComments(parseInt(eventId.value));
});

onMounted(async () => {
  try {
    if (eventId.value) {
      // Load players data
      if (playersStore.players.length === 0) {
        await playersStore.fetchPlayers();
      }

      // Fetch the event data using the ID from the route
      event.value = await eventsStore.getEventById(eventId.value);

      // Load messages data
      if (messagesStore.messages.length === 0) {
        await messagesStore.fetchMessages();
      }
    }
  } catch (error) {
    console.error('Error fetching event:', error);
  } finally {
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
            <q-btn color="primary" icon="mdi-calendar-check" label="Join Event" :disabled="event.isFull()" />
          </div>
        </div>

        <!-- Event details grid -->
        <div class="row q-col-gutter-md">
          <!-- Left column - Event info -->
          <div class="col-12 col-md-8">
            <q-card flat>
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
                      <q-item-label caption>{{ event.currentPlayers }} / {{ event.maxPlayers }}</q-item-label>
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
            <q-card flat class="q-mb-md">
              <q-card-section>
                <div class="text-h6">Players ({{ eventPlayers.length }})</div>
                <PlayersList :players="eventPlayers" @show-player="showPlayerDetails" />
              </q-card-section>

              <q-card-section v-if="event.currentPlayers < event.maxPlayers">
                <q-banner class="bg-primary text-black">
                  <template v-slot:avatar>
                    <q-icon name="mdi-information" />
                  </template>
                  {{ event.maxPlayers - event.currentPlayers }} more {{ event.maxPlayers - event.currentPlayers === 1 ?
                    'player' :
                    'players' }} needed!
                </q-banner>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Event Comments Section -->
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6">
                  <q-icon name="mdi-comment-multiple" /> Event Discussion
                </div>
              </q-card-section>
              <q-card-section class="q-pa-none">
                <MessageList :messages="eventComments" :show-sender="true" />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
      <div v-else class="text-h5 text-center q-pa-xl">
        Event not found
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
