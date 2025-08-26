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
  getDocs,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import {
  GameSubmission,
  type FirebaseGameSubmission,
  type GameSubmissionData,
} from 'src/models/GameSubmission';
import { type FirebaseGame } from 'src/models/Game';
import { authService } from 'src/services/auth-service';

export const useGameSubmissionsStore = defineStore('gameSubmissions', () => {
  // State
  const submissions = ref<GameSubmission[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const unsubscribes = ref<Unsubscribe[]>([]);

  // Getters
  const pendingSubmissions = computed(() => {
    return submissions.value.filter((submission) => submission.status === 'pending');
  });

  const mySubmissions = computed(() => {
    const currentUserId = authService.currentUserId.value;
    if (!currentUserId) return [];

    return submissions.value.filter(
      (submission) => submission.submittedBy.userId === currentUserId,
    );
  });

  const getSubmissionById = computed(() => {
    return (id: string) => submissions.value.find((submission) => submission.id === id);
  });

  // Actions
  const submitGame = async (gameData: GameSubmissionData) => {
    if (!authService.isAuthenticated.value || !authService.currentUserId.value) {
      throw new Error('Must be authenticated to submit games');
    }

    loading.value = true;
    error.value = null;

    try {
      // Get current user info from auth service
      const authUser = authService.currentUser.value;
      if (!authUser) {
        throw new Error('User authentication data not found');
      }

      const submissionData: FirebaseGameSubmission = {
        ...gameData,
        submittedBy: {
          userId: authService.currentUserId.value,
          userName: authUser.displayName || authUser.email || 'Anonymous',
          userEmail: authUser.email || '',
        },
        status: 'pending',
        submittedAt: serverTimestamp() as unknown as Timestamp,
      };

      await addDoc(collection(db, 'gameSubmissions'), submissionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to submit game: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateSubmission = async (
    submissionId: string,
    updates: Partial<FirebaseGameSubmission>,
  ) => {
    if (!authService.isAuthenticated.value) {
      throw new Error('Must be authenticated to update submissions');
    }

    loading.value = true;
    error.value = null;

    try {
      const submissionRef = doc(db, 'gameSubmissions', submissionId);
      await updateDoc(submissionRef, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to update submission: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    if (!authService.isAuthenticated.value) {
      throw new Error('Must be authenticated to delete submissions');
    }

    loading.value = true;
    error.value = null;

    try {
      const submissionRef = doc(db, 'gameSubmissions', submissionId);
      await deleteDoc(submissionRef);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to delete submission: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Admin functions
  const approveSubmission = async (submissionId: string, reviewNotes?: string) => {
    if (!authService.isAuthenticated.value || !authService.currentUserId.value) {
      throw new Error('Must be authenticated admin to approve submissions');
    }

    const submission = getSubmissionById.value(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    loading.value = true;
    error.value = null;

    try {
      // Create the game in the games collection
      const gameData: FirebaseGame = {
        legacyId: Date.now(), // Generate a legacy ID
        ...submission.toGameData(),
        createdAt: serverTimestamp() as unknown as Timestamp,
        updatedAt: serverTimestamp() as unknown as Timestamp,
        createdBy: submission.submittedBy.userId,
        approved: true,
        approvedBy: authService.currentUserId.value,
        approvedAt: serverTimestamp() as unknown as Timestamp,
        status: 'active',
      };

      const gameDoc = await addDoc(collection(db, 'games'), gameData);

      // Update the submission
      const updateData: Partial<FirebaseGameSubmission> = {
        status: 'approved',
        reviewedAt: serverTimestamp() as unknown as Timestamp,
        reviewedBy: authService.currentUserId.value,
        gameId: gameDoc.id,
      };

      if (reviewNotes !== undefined) {
        updateData.reviewNotes = reviewNotes;
      }

      await updateSubmission(submissionId, updateData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to approve submission: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const rejectSubmission = async (submissionId: string, reviewNotes?: string) => {
    if (!authService.isAuthenticated.value || !authService.currentUserId.value) {
      throw new Error('Must be authenticated admin to reject submissions');
    }

    const updateData: Partial<FirebaseGameSubmission> = {
      status: 'rejected',
      reviewedAt: serverTimestamp() as unknown as Timestamp,
      reviewedBy: authService.currentUserId.value,
    };

    if (reviewNotes !== undefined) {
      updateData.reviewNotes = reviewNotes;
    }

    await updateSubmission(submissionId, updateData);
  };

  // Subscribe to submissions
  const subscribeToSubmissions = () => {
    const q = query(collection(db, 'gameSubmissions'), orderBy('submittedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        submissions.value = snapshot.docs.map((doc) => {
          const data = doc.data() as FirebaseGameSubmission;
          return GameSubmission.fromFirebase(doc.id, data);
        });
        error.value = null;
      },
      (err) => {
        console.error('Game submissions subscription error:', err);
        error.value = `Failed to load submissions: ${err.message}`;
      },
    );

    unsubscribes.value.push(unsubscribe);
    return unsubscribe;
  };

  // Subscribe to user's own submissions
  const subscribeToMySubmissions = () => {
    const currentUserId = authService.currentUserId.value;
    if (!currentUserId) return;

    const q = query(
      collection(db, 'gameSubmissions'),
      where('submittedBy.userId', '==', currentUserId),
      orderBy('submittedAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const mySubmissionsData = snapshot.docs.map((doc) => {
          const data = doc.data() as FirebaseGameSubmission;
          return GameSubmission.fromFirebase(doc.id, data);
        });

        // Update only the user's submissions in the main array
        submissions.value = [
          ...submissions.value.filter((s) => s.submittedBy.userId !== currentUserId),
          ...mySubmissionsData,
        ];

        error.value = null;
      },
      (err) => {
        console.error('My submissions subscription error:', err);
        error.value = `Failed to load your submissions: ${err.message}`;
      },
    );

    unsubscribes.value.push(unsubscribe);
    return unsubscribe;
  };

  // Load submissions once (without real-time updates)
  const loadSubmissions = async () => {
    loading.value = true;
    error.value = null;

    try {
      const q = query(collection(db, 'gameSubmissions'), orderBy('submittedAt', 'desc'));

      const snapshot = await getDocs(q);
      submissions.value = snapshot.docs.map((doc) => {
        const data = doc.data() as FirebaseGameSubmission;
        return GameSubmission.fromFirebase(doc.id, data);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to load submissions: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Cleanup function
  const cleanup = () => {
    unsubscribes.value.forEach((unsubscribe) => unsubscribe());
    unsubscribes.value = [];
  };

  return {
    // State
    submissions,
    loading,
    error,

    // Getters
    pendingSubmissions,
    mySubmissions,
    getSubmissionById,

    // Actions
    submitGame,
    updateSubmission,
    deleteSubmission,
    approveSubmission,
    rejectSubmission,
    subscribeToSubmissions,
    subscribeToMySubmissions,
    loadSubmissions,
    cleanup,
  };
});
