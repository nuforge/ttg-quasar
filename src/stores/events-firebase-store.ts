import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { Event, type RSVP } from 'src/models/Event';
import { authService } from 'src/services/auth-service';
import { googleCalendarService, type CalendarEvent } from 'src/services/google-calendar-service';

export const useEventsFirebaseStore = defineStore('eventsFirebase', () => {
  // State
  const events = ref<Event[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const unsubscribes = ref<Unsubscribe[]>([]);

  // Getters
  const upcomingEvents = computed(() => {
    return events.value
      .filter((event) => event.status === 'upcoming')
      .sort((a, b) => a.getDateObject().getTime() - b.getDateObject().getTime());
  });

  const myEvents = computed(() => {
    const currentUserId = authService.currentUserId.value;
    if (!currentUserId) return [];

    return events.value.filter(
      (event) =>
        event.host.playerId?.toString() === currentUserId ||
        event.rsvps.some(
          (rsvp) => rsvp.playerId.toString() === currentUserId && rsvp.status === 'confirmed',
        ),
    );
  });

  const eventsByGame = computed(() => {
    return (gameId: string) => events.value.filter((event) => event.gameId === gameId);
  });

  // Actions
  const createEvent = async (eventData: {
    gameId: string;
    title: string;
    date: string;
    time: string;
    endTime: string;
    location: string;
    minPlayers: number;
    maxPlayers: number;
    description?: string;
    notes?: string;
    syncToGoogleCalendar?: boolean;
  }) => {
    if (!authService.isAuthenticated.value || !authService.currentPlayer.value) {
      throw new Error('Must be authenticated to create events');
    }

    loading.value = true;
    error.value = null;

    try {
      const currentUser = authService.currentUser.value;
      const currentPlayer = authService.currentPlayer.value;

      if (!currentUser || !currentPlayer) {
        throw new Error('User must be logged in to create events');
      }

      // Create event data for Firestore
      const firestoreEventData = {
        gameId: eventData.gameId,
        title: eventData.title,
        date: eventData.date,
        time: eventData.time,
        endTime: eventData.endTime,
        location: eventData.location,
        status: 'upcoming',
        minPlayers: eventData.minPlayers,
        maxPlayers: eventData.maxPlayers,
        description: eventData.description || '',
        notes: eventData.notes || '',
        host: {
          name: currentPlayer.name,
          email: currentPlayer.email,
          phone: '', // Add phone if available
          playerId: currentPlayer.id,
        },
        rsvps: [
          {
            playerId: currentPlayer.id,
            status: 'confirmed',
            participants: 1,
          },
        ] as RSVP[],
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        googleCalendarEventId: null,
      };

      // Create event in Firestore
      const docRef = await addDoc(collection(db, 'events'), firestoreEventData);

      // Sync to Google Calendar if requested
      let calendarEventId = null;
      if (eventData.syncToGoogleCalendar) {
        try {
          const startDateTime = new Date(`${eventData.date}T${eventData.time}`);
          const endDateTime = new Date(`${eventData.date}T${eventData.endTime}`);

          // Create deep link to event (update this with your actual domain)
          const eventUrl = `https://your-app-domain.com/events/${docRef.id}`;

          const calendarEvent: CalendarEvent = {
            summary: eventData.title,
            description: `🎮 ${eventData.title}\n\n📝 ${eventData.description}\n\n📍 Location: ${eventData.location}\n👥 Players: ${eventData.minPlayers}-${eventData.maxPlayers}\n\n🔗 View Event Details: ${eventUrl}\n📱 Manage your RSVP in the TTG app`,
            location: eventData.location,
            start: {
              dateTime: startDateTime.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 }, // 1 day before
                { method: 'popup', minutes: 60 }, // 1 hour before
              ],
            },
          };

          const createdCalendarEvent = await googleCalendarService.createEvent(calendarEvent);
          calendarEventId = createdCalendarEvent.id;

          // Update Firestore with calendar event ID
          await updateDoc(doc(db, 'events', docRef.id), {
            googleCalendarEventId: calendarEventId,
          });
        } catch (calendarError) {
          console.warn('Failed to sync to Google Calendar:', calendarError);
        }
      }

      return docRef.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to create event: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    if (!authService.isAuthenticated.value) {
      throw new Error('Must be authenticated to update events');
    }

    loading.value = true;
    error.value = null;

    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Update Google Calendar if event is synced
      const event = events.value.find((e) => e.id.toString() === eventId);
      if (event?.googleCalendarEventId && updates.date && updates.time) {
        try {
          const startDateTime = new Date(`${updates.date}T${updates.time}`);
          const endDateTime = new Date(`${updates.date}T${updates.endTime || event.endTime}`);

          await googleCalendarService.updateEvent(event.googleCalendarEventId, {
            summary: updates.title || event.title,
            description: updates.description || event.description,
            location: updates.location || event.location,
            start: { dateTime: startDateTime.toISOString() },
            end: { dateTime: endDateTime.toISOString() },
          });
        } catch (calendarError) {
          console.warn('Failed to update Google Calendar:', calendarError);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to update event: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!authService.isAuthenticated.value) {
      throw new Error('Must be authenticated to delete events');
    }

    loading.value = true;
    error.value = null;

    try {
      // Get event for Google Calendar cleanup
      const event = events.value.find((e) => e.id.toString() === eventId);

      // Delete from Firestore
      await deleteDoc(doc(db, 'events', eventId));

      // Delete from Google Calendar if synced
      if (event?.googleCalendarEventId) {
        try {
          await googleCalendarService.deleteEvent(event.googleCalendarEventId);
        } catch (calendarError) {
          console.warn('Failed to delete from Google Calendar:', calendarError);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to delete event: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const joinEvent = async (event: Event) => {
    if (!authService.isAuthenticated.value || !authService.currentPlayer.value) {
      throw new Error('Must be authenticated to join events');
    }

    const currentPlayer = authService.currentPlayer.value;

    // ⚡ FIX: Get the LATEST event data from the store instead of using the stale prop
    const storeEvent = events.value.find((e) => e.id === event.id);
    if (!storeEvent) {
      throw new Error('Event not found in store');
    }

    if (storeEvent.isFull()) {
      throw new Error('Event is full');
    }

    // Check if already confirmed
    const existingConfirmedRsvp = storeEvent.rsvps.find(
      (rsvp) => rsvp.playerId === currentPlayer.id && rsvp.status === 'confirmed',
    );
    if (existingConfirmedRsvp) {
      throw new Error('Already joined this event');
    }

    try {
      if (!event.firebaseDocId) {
        throw new Error('Firebase document ID not found for this event');
      }
      const eventRef = doc(db, 'events', event.firebaseDocId);

      // ALWAYS add a NEW confirmed RSVP - DON'T touch any existing interested RSVPs
      const newRsvp: RSVP = {
        playerId: currentPlayer.id,
        status: 'confirmed',
        participants: 1,
      };

      await updateDoc(eventRef, {
        rsvps: arrayUnion(newRsvp),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to join event: ${errorMessage}`;
      throw err;
    }
  };

  const leaveEvent = async (event: Event) => {
    if (!authService.isAuthenticated.value || !authService.currentPlayer.value) {
      throw new Error('Must be authenticated to leave events');
    }

    const currentPlayer = authService.currentPlayer.value;

    // ⚡ FIX: Get the LATEST event data from the store instead of using the stale prop
    const storeEvent = events.value.find((e) => e.id === event.id);
    if (!storeEvent) {
      throw new Error('Event not found in store');
    }

    // Find the confirmed RSVP to remove
    const confirmedRSVP = storeEvent.rsvps.find(
      (rsvp) => rsvp.playerId === currentPlayer.id && rsvp.status === 'confirmed',
    );
    if (!confirmedRSVP) {
      throw new Error('Not joined to this event');
    }

    // Prevent host from leaving their own event
    if (storeEvent.host.playerId === currentPlayer.id) {
      throw new Error('Event host cannot leave their own event');
    }

    try {
      if (!event.firebaseDocId) {
        throw new Error('Firebase document ID not found for this event');
      }
      const eventRef = doc(db, 'events', event.firebaseDocId);

      await updateDoc(eventRef, {
        rsvps: arrayRemove(confirmedRSVP),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to leave event: ${errorMessage}`;
      throw err;
    }
  };

  const subscribeToEvents = (gameId?: string) => {
    // Clean up existing subscriptions
    unsubscribes.value.forEach((unsubscribe) => unsubscribe());
    unsubscribes.value = [];

    let q = query(collection(db, 'events'), orderBy('date', 'asc'));

    if (gameId) {
      q = query(q, where('gameId', '==', gameId));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedEvents = snapshot.docs.map((doc) => {
          const data = doc.data();
          return new Event({
            id: parseInt(doc.id.slice(-6), 36), // Convert doc ID to number for compatibility
            firebaseDocId: doc.id, // Store original Firebase document ID
            ...data,
            // Convert Firestore timestamps to strings
            date: data.date,
            time: data.time,
            endTime: data.endTime,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : data.createdAt instanceof Date
                  ? data.createdAt
                  : data.createdAt
                    ? new Date(data.createdAt)
                    : undefined,
            updatedAt:
              data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate()
                : data.updatedAt instanceof Date
                  ? data.updatedAt
                  : data.updatedAt
                    ? new Date(data.updatedAt)
                    : undefined,
            googleCalendarEventId: data.googleCalendarEventId,
          });
        });

        events.value = fetchedEvents;
      },
      (err) => {
        error.value = `Failed to subscribe to events: ${err.message}`;
      },
    );

    unsubscribes.value.push(unsubscribe);
    return unsubscribe;
  };

  const cleanup = () => {
    unsubscribes.value.forEach((unsubscribe) => unsubscribe());
    unsubscribes.value = [];
    events.value = [];
  };

  const toggleInterest = async (event: Event) => {
    if (!authService.isAuthenticated.value || !authService.currentPlayer.value) {
      throw new Error('Must be authenticated to toggle interest');
    }

    const currentPlayer = authService.currentPlayer.value;
    // ⚡ FIX: Get the LATEST event data from the store instead of using the stale prop
    const storeEvent = events.value.find((e) => e.id === event.id);
    if (!storeEvent) {
      throw new Error('Event not found in store');
    }

    // Find existing interested RSVP (only interested status, not confirmed)
    const existingInterestedRSVP = storeEvent.rsvps.find(
      (rsvp: RSVP) => rsvp.playerId === currentPlayer.id && rsvp.status === 'interested',
    );

    try {
      if (!event.firebaseDocId) {
        throw new Error('Firebase document ID not found for this event');
      }

      const eventRef = doc(db, 'events', event.firebaseDocId);

      if (existingInterestedRSVP) {
        // Remove the interested RSVP
        await updateDoc(eventRef, {
          rsvps: arrayRemove(existingInterestedRSVP),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Add new interested RSVP
        const newInterestedRsvp: RSVP = {
          playerId: currentPlayer.id,
          status: 'interested',
          participants: 1,
        };

        await updateDoc(eventRef, {
          rsvps: arrayUnion(newInterestedRsvp),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to toggle interest: ${errorMessage}`;
      throw err;
    }
  };

  return {
    // State
    events,
    loading,
    error,

    // Getters
    upcomingEvents,
    myEvents,
    eventsByGame,

    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    toggleInterest,
    subscribeToEvents,
    cleanup,
  };
});
