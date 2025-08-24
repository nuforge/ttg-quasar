import { computed, ref, watch } from 'vue';
import { useCurrentUser } from 'vuefire';
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from 'src/boot/firebase';
import { Player } from 'src/models/Player';

export class VueFireAuthService {
  public currentPlayer = ref<Player | null>(null);
  public loading = ref(false);

  private googleProvider = new GoogleAuthProvider();
  private facebookProvider = new FacebookAuthProvider();

  constructor() {
    // Add required scopes for Google
    this.googleProvider.addScope('https://www.googleapis.com/auth/calendar');
    this.googleProvider.addScope('profile');
    this.googleProvider.addScope('email');

    // Watch for user changes and load player profile
    const user = useCurrentUser();
    watch(
      user,
      (newUser) => {
        if (newUser) {
          void this.loadPlayerProfile(newUser);
        } else {
          this.currentPlayer.value = null;
        }
      },
      { immediate: true },
    );
  }

  // VueFire provides reactive current user
  get currentUser() {
    return useCurrentUser();
  }

  get isAuthenticated() {
    const user = useCurrentUser();
    return computed(() => !!user.value);
  }

  get currentUserId() {
    const user = useCurrentUser();
    return computed(() => user.value?.uid || null);
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
      await firebaseSignOut(auth);
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
          avatar: user.photoURL || undefined,
          joinDate: new Date(),
        });

        // Save to Firestore
        await setDoc(doc(db, 'players', user.uid), {
          id: newPlayer.id,
          name: newPlayer.name,
          email: newPlayer.email,
          avatar: newPlayer.avatar,
          joinDate: new Date(),
          bio: newPlayer.bio,
          preferences: newPlayer.preferences,
        });

        this.currentPlayer.value = newPlayer;
      }
    } catch (error) {
      console.error('Error loading player profile:', error);
    }
  }

  async updatePlayerProfile(updates: Partial<Player>) {
    const user = useCurrentUser();
    if (!user.value || !this.currentPlayer.value) {
      throw new Error('No authenticated user');
    }

    try {
      // Update Firestore
      await setDoc(
        doc(db, 'players', user.value.uid),
        {
          ...updates,
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
export const vueFireAuthService = new VueFireAuthService();
