import { ref, computed } from 'vue';
import { auth } from 'src/boot/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

// Global auth state
const currentUser = ref<User | null>(null);
const isInitialized = ref(false);

// Set up Firebase auth state listener
onAuthStateChanged(auth, (user) => {
  currentUser.value = user;
  isInitialized.value = true;
});

/**
 * Firebase Auth composable - replacement for VueFire's useCurrentUser
 * Provides the same interface as VueFire's useCurrentUser
 */
export function useCurrentUser() {
  return computed(() => currentUser.value);
}

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated() {
  return computed(() => !!currentUser.value);
}

/**
 * Get current user ID
 */
export function useCurrentUserId() {
  return computed(() => currentUser.value?.uid || null);
}

/**
 * Check if auth is initialized
 */
export function useAuthInitialized() {
  return computed(() => isInitialized.value);
}
