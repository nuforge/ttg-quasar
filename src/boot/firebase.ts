import { boot } from 'quasar/wrappers';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { VueFire, VueFireAuth } from 'vuefire';

// Firebase configuration - replace with your config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development (only if explicitly enabled)
const shouldUseEmulator =
  process.env.NODE_ENV === 'development' &&
  (process.env.USE_FIREBASE_EMULATOR === 'true' || process.env.USE_FIREBASE_EMULATOR === true);

console.log('🔧 Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  USE_FIREBASE_EMULATOR: process.env.USE_FIREBASE_EMULATOR,
  USE_FIREBASE_EMULATOR_type: typeof process.env.USE_FIREBASE_EMULATOR,
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
