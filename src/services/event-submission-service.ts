import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../boot/firebase';
import { vueFireAuthService } from './vuefire-auth-service';
import { googleCalendarService } from './google-calendar-service';
import { gameEventNotificationService } from './game-event-notification-service';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import type {
  EventSubmission,
  EventSubmissionStatus,
  CreateEventSubmissionData,
  EventSubmissionFilter,
} from '../models/EventSubmission';
import { Event } from '../models/Event';

class EventSubmissionService {
  private readonly COLLECTION_NAME = 'eventSubmissions';

  // Create a new event submission
  async createSubmission(data: CreateEventSubmissionData): Promise<string> {
    const currentUser = vueFireAuthService.currentUser.value;
    if (!currentUser) {
      throw new Error('User must be authenticated to submit events');
    }

    const submission: Omit<EventSubmission, 'id'> = {
      ...data,
      submittedBy: {
        userId: currentUser.uid,
        email: currentUser.email || '',
        ...(currentUser.displayName && { displayName: currentUser.displayName }),
      },
      submittedAt: Timestamp.now(),
      status: 'pending' as EventSubmissionStatus,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), submission);
      return docRef.id;
    } catch (error) {
      console.error('Error creating event submission:', error);
      throw new Error('Failed to submit event');
    }
  }

  // Get a single event submission
  async getSubmission(id: string): Promise<EventSubmission | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as EventSubmission;
      }
      return null;
    } catch (error) {
      console.error('Error getting event submission:', error);
      throw new Error('Failed to get event submission');
    }
  }

  // Get event submissions with optional filtering
  async getSubmissions(filters?: EventSubmissionFilter): Promise<EventSubmission[]> {
    try {
      let queryRef = query(collection(db, this.COLLECTION_NAME), orderBy('submittedAt', 'desc'));

      // Apply filters
      if (filters?.status) {
        queryRef = query(queryRef, where('status', '==', filters.status));
      }
      if (filters?.eventType) {
        queryRef = query(queryRef, where('eventType', '==', filters.eventType));
      }
      if (filters?.submittedBy) {
        queryRef = query(queryRef, where('submittedBy.userId', '==', filters.submittedBy));
      }

      const querySnapshot = await getDocs(queryRef);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EventSubmission[];
    } catch (error) {
      console.error('Error getting event submissions:', error);
      throw new Error('Failed to get event submissions');
    }
  }

  // Get submissions for current user
  async getUserSubmissions(): Promise<EventSubmission[]> {
    const currentUser = vueFireAuthService.currentUser.value;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    return this.getSubmissions({ submittedBy: currentUser.uid });
  }

  // Update submission status (admin function)
  async updateSubmissionStatus(
    id: string,
    status: EventSubmissionStatus,
    reviewNotes?: string,
  ): Promise<void> {
    const currentUser = vueFireAuthService.currentUser.value;
    if (!currentUser) {
      throw new Error('User must be authenticated to review submissions');
    }

    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const updateData: Partial<EventSubmission> = {
        status,
        reviewedBy: {
          userId: currentUser.uid,
          email: currentUser.email || '',
          ...(currentUser.displayName && { displayName: currentUser.displayName }),
        },
        reviewedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (reviewNotes) {
        updateData.reviewNotes = reviewNotes;
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating submission status:', error);
      throw new Error('Failed to update submission status');
    }
  }

  // Approve and publish to calendar
  async approveAndPublish(id: string, reviewNotes?: string): Promise<string> {
    try {
      // First get the submission
      const submission = await this.getSubmission(id);
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Create calendar event
      const startDateTime = new Date(`${submission.startDate}T${submission.startTime}`);
      const endDateTime = new Date(`${submission.endDate}T${submission.endTime}`);

      const calendarEventData = {
        summary: submission.title,
        description: `${submission.description}\n\nEvent Type: ${submission.eventType}\nSubmitted by: ${submission.submittedBy.displayName || submission.submittedBy.email}\n\nContact: ${submission.contactEmail || submission.submittedBy.email}`,
        location:
          submission.location +
          (submission.locationDetails ? `\n${submission.locationDetails}` : ''),
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      const calendarEvent = await googleCalendarService.createEvent(calendarEventData);

      // Update submission with calendar event ID and set to published
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(docRef, {
        status: 'published' as EventSubmissionStatus,
        calendarEventId: calendarEvent.id,
        reviewNotes,
        reviewedBy: {
          userId: vueFireAuthService.currentUser.value?.uid || '',
          email: vueFireAuthService.currentUser.value?.email || '',
          ...(vueFireAuthService.currentUser.value?.displayName && {
            displayName: vueFireAuthService.currentUser.value.displayName,
          }),
        },
        reviewedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Send notifications to users who have notifications enabled for this game
      if (submission.gameId) {
        try {
          const gamesStore = useGamesFirebaseStore();
          const game = gamesStore.getGameById(submission.gameId);

          if (game) {
            // Create an Event object for the notification service
            const eventForNotification = new Event({
              id: submission.id ? parseInt(submission.id, 10) : 0, // Convert string ID to number
              gameId: submission.gameId,
              title: submission.title,
              date: submission.startDate,
              time: submission.startTime,
              endTime: submission.endTime,
              location: submission.location,
              description: submission.description,
              status: 'upcoming',
              minPlayers: 1,
              maxPlayers: 99,
              rsvps: [],
              host: {
                name: submission.submittedBy.displayName || 'Unknown',
                email: submission.submittedBy.email,
                phone: '',
              },
              notes: '',
            });

            await gameEventNotificationService.notifyUsersAboutGameEvent(
              game,
              eventForNotification,
              'new_event',
            );
          }
        } catch (notificationError) {
          console.warn('Failed to send game event notifications:', notificationError);
          // Don't fail the approval process if notifications fail
        }
      }

      return calendarEvent.id || '';
    } catch (error) {
      console.error('Error approving and publishing event:', error);
      throw new Error(
        `Failed to approve and publish event: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Delete submission
  async deleteSubmission(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw new Error('Failed to delete submission');
    }
  }

  // Real-time listener for submissions
  onSubmissionsChange(
    callback: (submissions: EventSubmission[]) => void,
    filters?: EventSubmissionFilter,
  ): Unsubscribe {
    let queryRef = query(collection(db, this.COLLECTION_NAME), orderBy('submittedAt', 'desc'));

    // Apply filters
    if (filters?.status) {
      queryRef = query(queryRef, where('status', '==', filters.status));
    }
    if (filters?.eventType) {
      queryRef = query(queryRef, where('eventType', '==', filters.eventType));
    }

    return onSnapshot(
      queryRef,
      (querySnapshot) => {
        const submissions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EventSubmission[];
        callback(submissions);
      },
      (error) => {
        console.error('Error in submissions listener:', error);
      },
    );
  }

  // Get pending submissions count (for admin dashboard)
  async getPendingCount(): Promise<number> {
    try {
      const queryRef = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', 'pending'),
      );
      const querySnapshot = await getDocs(queryRef);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }

  // Helper method to format event submission for display
  formatSubmissionForDisplay(submission: EventSubmission): string {
    const startDate = new Date(`${submission.startDate}T${submission.startTime}`);
    const endDate = new Date(`${submission.endDate}T${submission.endTime}`);

    return `${submission.title}\n${startDate.toLocaleString()} - ${endDate.toLocaleString()}\nLocation: ${submission.location}\nType: ${submission.eventType}\nStatus: ${submission.status}`;
  }
}

export const eventSubmissionService = new EventSubmissionService();
