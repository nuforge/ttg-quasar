import { boot } from 'quasar/wrappers';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { VueFire, VueFireAuth } from 'vuefire';

// Firebase configuration - replace with your config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey) {
  const errorMessage =
    '❌ Firebase API Key is missing! Please set VITE_FIREBASE_API_KEY in your .env file.\n' +
    'See docs/development/DEV_SETUP.md for setup instructions.';
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development (only if explicitly enabled)
const shouldUseEmulator =
  import.meta.env.DEV &&
  (import.meta.env.USE_FIREBASE_EMULATOR === 'true' || import.meta.env.USE_FIREBASE_EMULATOR === true);

console.log('🔧 Environment check:', {
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  USE_FIREBASE_EMULATOR: import.meta.env.USE_FIREBASE_EMULATOR,
  USE_FIREBASE_EMULATOR_type: typeof import.meta.env.USE_FIREBASE_EMULATOR,
  shouldUseEmulator: shouldUseEmulator,
});

if (shouldUseEmulator) {
  console.log('🚀 Connecting to Firebase emulators...');

  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.log('✅ Connected to Auth emulator');
  } catch (error) {
    console.log('❌ Auth emulator connection failed:', error);
  }

  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('✅ Connected to Firestore emulator');
  } catch (error) {
    console.log('❌ Firestore emulator connection failed:', error);
  }

  try {
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✅ Connected to Storage emulator');
  } catch (error) {
    console.log('❌ Storage emulator connection failed:', error);
  }
} else {
  console.log('🌐 Using production Firebase');
}

export default boot(({ app: vueApp }) => {
  // Initialize VueFire
  vueApp.use(VueFire, {
    firebaseApp: app,
    modules: [VueFireAuth()],
  });

  console.log('Firebase and VueFire initialized');
});
