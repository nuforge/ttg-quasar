import { defineStore } from 'pinia';
import eventsData from 'src/assets/data/events.json';
import type { EventStatus } from 'src/models/Event';
import { Event } from 'src/models/Event';

export const useEventsStore = defineStore('events', {
  state: () => ({
    events: [] as Event[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    upcomingEvents: (state) => {
      return state.events
        .filter((event) => event.status === 'upcoming')
        .sort((a, b) => a.getDateObject().getTime() - b.getDateObject().getTime());
    },
  },

  actions: {
    async fetchEvents() {
      this.loading = true;
      this.error = null;

      try {
        // Add await to satisfy the async requirement
        await Promise.resolve();

        // Pre-process the JSON data to convert status strings to EventStatus and IDs to numbers
        const processedEventsData = eventsData.map((event) => ({
          ...event,
          id: typeof event.id === 'string' ? parseInt(event.id, 10) : event.id,
          gameId: typeof event.gameId === 'number' ? event.gameId.toString() : (event.gameId || ''),
          status: event.status as EventStatus,
          rsvps: event.rsvps?.map((rsvp) => ({
            ...rsvp,
            status: rsvp.status as 'confirmed' | 'interested' | 'waiting' | 'cancelled',
          })),
        }));

        // Convert the JSON data to Event objects
        this.events = Event.fromJSON(processedEventsData);
      } catch (error) {
        this.error = (error as Error).message;
        console.error('Error fetching events:', error);
      } finally {
        this.loading = false;
      }
    },

    async getEventById(id: string): Promise<Event> {
      // Make sure events are loaded
      if (this.events.length === 0) {
        await this.fetchEvents();
      }

      const event = this.events.find((event) => event.id.toString() === id);
      if (!event) {
        throw new Error(`Event with ID ${id} not found`);
      }

      return event;
    },
  },
});
