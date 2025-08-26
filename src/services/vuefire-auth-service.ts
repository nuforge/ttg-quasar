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
  public googleAccessToken = ref<string | null>(null);
  private googleAccessTokenExpiry = ref<number | null>(null);
  private refreshTokenInterval: NodeJS.Timeout | null = null;

  private googleProvider = new GoogleAuthProvider();
  private facebookProvider = new FacebookAuthProvider();

  // Storage keys for persisting tokens
  private readonly GOOGLE_TOKEN_KEY = 'ttg_google_access_token';
  private readonly GOOGLE_TOKEN_EXPIRY_KEY = 'ttg_google_token_expiry';

  constructor() {
    // Add required scopes for Google Calendar with write permissions
    this.googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
    this.googleProvider.addScope('https://www.googleapis.com/auth/calendar');
    this.googleProvider.addScope('profile');
    this.googleProvider.addScope('email');

    // Set up force approval prompt to ensure we get refresh tokens
    this.googleProvider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline',
    });

    // Initialize token from storage
    this.loadTokenFromStorage();

    // Set up token refresh checking
    this.setupTokenRefresh();

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

  // Token storage methods
  private loadTokenFromStorage() {
    try {
      const token = localStorage.getItem(this.GOOGLE_TOKEN_KEY);
      const expiryStr = localStorage.getItem(this.GOOGLE_TOKEN_EXPIRY_KEY);

      if (token && expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        const now = Date.now();

        // Check if token is still valid (with 5 minute buffer)
        if (expiry > now + 5 * 60 * 1000) {
          this.googleAccessToken.value = token;
          this.googleAccessTokenExpiry.value = expiry;
          console.log('Loaded Google access token from storage');
        } else {
          console.log('Stored Google access token expired, clearing storage');
          this.clearTokenFromStorage();
        }
      }
    } catch (error) {
      console.error('Error loading Google access token from storage:', error);
      this.clearTokenFromStorage();
    }
  }

  private saveTokenToStorage(token: string, expiresIn?: number) {
    try {
      // Calculate expiry time (default 1 hour if not provided)
      const expiryTime = Date.now() + (expiresIn || 3600) * 1000;

      localStorage.setItem(this.GOOGLE_TOKEN_KEY, token);
      localStorage.setItem(this.GOOGLE_TOKEN_EXPIRY_KEY, expiryTime.toString());

      this.googleAccessToken.value = token;
      this.googleAccessTokenExpiry.value = expiryTime;

      console.log('Saved Google access token to storage');
    } catch (error) {
      console.error('Error saving Google access token to storage:', error);
    }
  }

  private clearTokenFromStorage() {
    try {
      localStorage.removeItem(this.GOOGLE_TOKEN_KEY);
      localStorage.removeItem(this.GOOGLE_TOKEN_EXPIRY_KEY);
      this.googleAccessToken.value = null;
      this.googleAccessTokenExpiry.value = null;
    } catch (error) {
      console.error('Error clearing Google access token from storage:', error);
    }
  }

  private setupTokenRefresh() {
    // Check token expiry every 5 minutes
    this.refreshTokenInterval = setInterval(
      () => {
        this.checkTokenExpiry();
      },
      5 * 60 * 1000,
    );
  }

  private checkTokenExpiry() {
    if (!this.googleAccessTokenExpiry.value) {
      return;
    }

    const now = Date.now();
    const expiry = this.googleAccessTokenExpiry.value;

    // If token expires in less than 10 minutes, we should refresh
    if (expiry - now < 10 * 60 * 1000) {
      console.log('Google access token expiring soon, user will need to re-authenticate');
      this.clearTokenFromStorage();
    }
  }

  // Check if Google access token is valid
  public isGoogleTokenValid(): boolean {
    if (!this.googleAccessToken.value || !this.googleAccessTokenExpiry.value) {
      return false;
    }

    const now = Date.now();
    const expiry = this.googleAccessTokenExpiry.value;

    // Consider valid if expires in more than 5 minutes
    return expiry > now + 5 * 60 * 1000;
  }

  async signInWithGoogle() {
    this.loading.value = true;
    try {
      console.log('Signing in with Google Calendar permissions...');

      const result = await signInWithPopup(auth, this.googleProvider);

      // Store the Google OAuth access token for Calendar API
      const credential = GoogleAuthProvider.credentialFromResult(result);
      console.log('Google OAuth credential:', credential);

      if (credential?.accessToken) {
        console.log(
          'Got Google OAuth access token (first 20 chars):',
          credential.accessToken.substring(0, 20) + '...',
        );

        // Save token to storage with persistence (default 1 hour expiry)
        this.saveTokenToStorage(credential.accessToken);
      } else {
        console.warn('No access token received from Google OAuth');
      }

      // Log what scopes were actually granted
      if (credential) {
        console.log('OAuth credential details:', {
          hasAccessToken: !!credential.accessToken,
          tokenLength: credential.accessToken?.length,
        });
      }

      return result.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
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
      // Clear current player immediately to prevent listener errors
      this.currentPlayer.value = null;

      await firebaseSignOut(auth);

      // Clear the stored Google access token and storage
      this.clearTokenFromStorage();

      // Clean up refresh interval
      if (this.refreshTokenInterval) {
        clearInterval(this.refreshTokenInterval);
        this.refreshTokenInterval = null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Don't throw errors for common sign-out issues like permission errors
      // as they're expected when signing out with active listeners
      if (errorMessage.includes('permission-denied') || errorMessage.includes('auth/')) {
        console.warn('Expected sign-out warning:', errorMessage);
        // Still clear the tokens even if sign-out had issues
        this.clearTokenFromStorage();
        this.currentPlayer.value = null;
        return;
      }

      throw new Error(`Sign-out failed: ${errorMessage}`);
    }
  }

  private async loadPlayerProfile(user: User) {
    try {
      // Only proceed if user is properly authenticated
      if (!user || !user.uid) {
        console.warn('Cannot load player profile: user not properly authenticated');
        return;
      }

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

      // Handle permission errors gracefully
      if (error instanceof Error && error.message.includes('permission-denied')) {
        console.warn(
          'Permission denied when accessing player profile. User may need to re-authenticate.',
        );
        // Clear current player but don't throw to avoid breaking the auth flow
        this.currentPlayer.value = null;
        return;
      }

      // For other errors, still log but don't break auth flow
      console.error('Failed to load or create player profile:', error);
    }
  }

  async updatePlayerProfile(updates: Partial<Player>) {
    const user = useCurrentUser();
    if (!user.value || !this.currentPlayer.value) {
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
        doc(db, 'players', user.value.uid),
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
export const vueFireAuthService = new VueFireAuthService();
