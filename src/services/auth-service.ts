import { ref, computed } from 'vue';
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from 'src/boot/firebase';
import { Player } from 'src/models/Player';

export class AuthService {
  public currentUser = ref<User | null>(null);
  public currentPlayer = ref<Player | null>(null);
  public loading = ref(false);

  private googleProvider = new GoogleAuthProvider();
  private facebookProvider = new FacebookAuthProvider();

  constructor() {
    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
      this.currentUser.value = user;

      if (user) {
        // Fetch or create player profile
        void this.loadPlayerProfile(user);
      } else {
        this.currentPlayer.value = null;
      }
    });

    // Add required scopes for Google
    this.googleProvider.addScope('https://www.googleapis.com/auth/calendar');
    this.googleProvider.addScope('profile');
    this.googleProvider.addScope('email');
  }

  get isAuthenticated() {
    return computed(() => !!this.currentUser.value);
  }

  get currentUserId() {
    return computed(() => this.currentUser.value?.uid || null);
  }

  async signInWithGoogle() {
    this.loading.value = true;
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      return result.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Google sign-in failed: ${errorMessage}`);
    } finally {
      this.loading.value = false;
    }
  }

  async signInWithFacebook() {
    this.loading.value = true;
    try {
      const result = await signInWithPopup(auth, this.facebookProvider);
      return result.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Facebook sign-in failed: ${errorMessage}`);
    } finally {
      this.loading.value = false;
    }
  }

  async signInWithEmail(email: string, password: string) {
    this.loading.value = true;
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Email sign-in failed: ${errorMessage}`);
    } finally {
      this.loading.value = false;
    }
  }

  async signUpWithEmail(email: string, password: string, displayName: string) {
    this.loading.value = true;
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name
      await updateProfile(result.user, { displayName });

      return result.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Email sign-up failed: ${errorMessage}`);
    } finally {
      this.loading.value = false;
    }
  }

  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Sign-out failed: ${errorMessage}`);
    }
  }

  private async loadPlayerProfile(user: User) {
    try {
      const playerDoc = await getDoc(doc(db, 'players', user.uid));

      if (playerDoc.exists()) {
        // Load existing player
        const playerData = playerDoc.data();
        this.currentPlayer.value = new Player({
          id: parseInt(user.uid.slice(-6), 36), // Convert UID to number ID for compatibility
          ...playerData,
          joinDate: playerData.joinDate?.toDate() || new Date(),
        });
      } else {
        // Create new player profile
        const newPlayer = new Player({
          id: parseInt(user.uid.slice(-6), 36),
          name: user.displayName || 'New Player',
          email: user.email || '',
          // Don't store Google photoURL as it has rate limits and auth issues
          avatar: undefined,
          joinDate: new Date(),
        });

        // Save to Firestore
        // Save to Firestore - filter out undefined values
        const playerData: Record<string, unknown> = {
          id: newPlayer.id,
          name: newPlayer.name,
          email: newPlayer.email,
          joinDate: new Date(),
        };

        // Only add optional fields if they have defined values
        if (newPlayer.avatar !== undefined) {
          playerData.avatar = newPlayer.avatar;
        }
        if (newPlayer.bio !== undefined) {
          playerData.bio = newPlayer.bio;
        }
        if (newPlayer.preferences !== undefined && Object.keys(newPlayer.preferences).length > 0) {
          playerData.preferences = newPlayer.preferences;
        }

        await setDoc(doc(db, 'players', user.uid), playerData);

        this.currentPlayer.value = newPlayer;
      }
    } catch (error) {
      console.error('Error loading player profile:', error);
    }
  }

  async updatePlayerProfile(updates: Partial<Player>) {
    if (!this.currentUser.value || !this.currentPlayer.value) {
      throw new Error('No authenticated user');
    }

    try {
      // Filter out undefined values from updates
      const filteredUpdates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          filteredUpdates[key] = value;
        }
      }

      // Update Firestore
      await setDoc(
        doc(db, 'players', this.currentUser.value.uid),
        {
          ...filteredUpdates,
          updatedAt: new Date(),
        },
        { merge: true },
      );

      // Update local state
      this.currentPlayer.value = new Player({
        ...this.currentPlayer.value,
        ...updates,
      });

      return this.currentPlayer.value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Profile update failed: ${errorMessage}`);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
