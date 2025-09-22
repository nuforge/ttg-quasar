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
import { CLCAIngestService, type CLCAIngestError } from 'src/services/clca-ingest-service';
import { ContentDocMappingService } from 'src/services/contentdoc-mapping-service';
import { DeadLetterQueueService } from 'src/services/dead-letter-queue-service';
import { logger } from 'src/utils/logger';

export const useEventsFirebaseStore = defineStore('eventsFirebase', () => {
  // State
  const events = ref<Event[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const unsubscribes = ref<Unsubscribe[]>([]);

  // CLCA Integration Services
  const clcaIngestService = new CLCAIngestService();
  const contentDocMappingService = new ContentDocMappingService();
  const dlqService = new DeadLetterQueueService();

  // CLCA sync status tracking
  const clcaSyncStatus = ref<
    Map<
      string,
      {
        synced: boolean;
        syncedAt?: Date;
        error?: string;
        clcaId?: string;
      }
    >
  >(new Map());

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
    return (gameId: number) => events.value.filter((event) => event.gameId === gameId);
  });

  // Actions
  const createEvent = async (eventData: {
    gameId: number;
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

  const subscribeToEvents = (gameId?: number) => {
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

  // CLCA Integration Methods
  const publishEventToCLCA = async (eventId: string): Promise<void> => {
    const event = events.value.find(
      (e) => e.firebaseDocId === eventId || e.id.toString() === eventId,
    );
    if (!event) {
      throw new Error('Event not found');
    }

    try {
      // Map to ContentDoc
      const contentDoc = await contentDocMappingService.mapEventToContentDoc(event);

      // Publish to CLCA
      const result = await clcaIngestService.publishContent(contentDoc);

      // Update sync status
      clcaSyncStatus.value.set(eventId, {
        synced: true,
        syncedAt: new Date(),
        clcaId: result.id,
      });

      // Update event in Firestore with CLCA metadata
      const docId = event.firebaseDocId || eventId;
      const eventRef = doc(db, 'events', docId);
      await updateDoc(eventRef, {
        clcaSynced: true,
        clcaSyncedAt: serverTimestamp(),
        clcaContentId: result.id,
        updatedAt: serverTimestamp(),
      });

      logger.info('Event published to CLCA', {
        eventId: event.id,
        firebaseDocId: docId,
        clcaId: result.id,
      });
    } catch (error) {
      // Update sync status with error
      clcaSyncStatus.value.set(eventId, {
        synced: false,
        error: (error as Error).message,
      });

      // Add to dead letter queue for retry
      try {
        const contentDoc = await contentDocMappingService.mapEventToContentDoc(event);
        await dlqService.addToDLQ(contentDoc, error as CLCAIngestError, {
          eventId: event.id.toString(),
          attempt: 1,
        });
      } catch (mappingError) {
        logger.error('Failed to add failed CLCA sync to DLQ', mappingError as Error, {
          eventId: event.id,
        });
      }

      throw error;
    }
  };

  const getCLCASyncStatus = computed(() => {
    return (eventId: string) => clcaSyncStatus.value.get(eventId);
  });

  // Enhanced createEvent method with automatic CLCA publishing
  const createEventWithCLCA = async (eventData: {
    gameId: number;
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
    syncToCLCA?: boolean;
  }): Promise<string> => {
    try {
      // Create event using existing method
      const eventId = await createEvent(eventData);

      // Get the created event
      const event = events.value.find((e) => e.firebaseDocId === eventId);
      if (event && event.status === 'upcoming' && eventData.syncToCLCA !== false) {
        try {
          // Automatically publish to CLCA for upcoming events
          await publishEventToCLCA(eventId);
        } catch (clcaError) {
          logger.warn('CLCA sync failed during event creation', clcaError as Error);
          // Don't fail event creation if CLCA sync fails
        }
      }

      return eventId;
    } catch (error) {
      logger.error('Failed to create event with CLCA sync', error as Error, { eventData });
      throw error;
    }
  };

  // Enhanced updateEvent method with CLCA sync
  const updateEventWithCLCA = async (
    eventId: string,
    updates: Partial<Event>,
    syncToCLCA = true,
  ): Promise<void> => {
    try {
      // Update event using existing method
      await updateEvent(eventId, updates);

      // Auto-sync to CLCA if event is published and sync is enabled
      const event = events.value.find(
        (e) => e.firebaseDocId === eventId || e.id.toString() === eventId,
      );
      if (event && event.status === 'upcoming' && syncToCLCA && clcaIngestService.isConfigured()) {
        try {
          await publishEventToCLCA(eventId);
        } catch (clcaError) {
          logger.warn('CLCA sync failed during event update', clcaError as Error);
          // Don't fail event update if CLCA sync fails
        }
      }
    } catch (error) {
      logger.error('Failed to update event with CLCA sync', error as Error, { eventId, updates });
      throw error;
    }
  };

  // Batch sync all events to CLCA (admin function)
  const syncAllEventsToCLCA = async (): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ eventId: string; error: string }>;
  }> => {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ eventId: string; error: string }>,
    };

    const upcomingEventsList = events.value.filter((e) => e.status === 'upcoming');

    logger.info('Starting batch CLCA sync', { eventCount: upcomingEventsList.length });

    for (const event of upcomingEventsList) {
      try {
        const eventId = event.firebaseDocId || event.id.toString();
        await publishEventToCLCA(eventId);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          eventId: event.id.toString(),
          error: (error as Error).message,
        });
      }
    }

    logger.info('Batch CLCA sync completed', results);
    return results;
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
    getCLCASyncStatus,

    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    toggleInterest,
    subscribeToEvents,
    cleanup,

    // CLCA Integration
    publishEventToCLCA,
    createEventWithCLCA,
    updateEventWithCLCA,
    syncAllEventsToCLCA,
  };
});
