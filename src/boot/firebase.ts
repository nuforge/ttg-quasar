import { boot } from 'quasar/wrappers';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { VueFire } from 'vuefire';

// Firebase configuration - replace with your config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

console.log('🔧 Firebase Config Debug:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 10)}...` : 'MISSING',
});

console.log('🔧 Environment Variables Debug:', {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY
    ? `${import.meta.env.VITE_FIREBASE_API_KEY.substring(0, 10)}...`
    : 'MISSING',
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID
    ? `${import.meta.env.VITE_FIREBASE_APP_ID.substring(0, 10)}...`
    : 'MISSING',
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Verify Firebase initialization
console.log('🔧 Firebase App Debug:', {
  app: app.name,
  auth: auth.app.name,
  db: db.app.name,
  storage: storage.app.name,
});

// Test Firebase connection
try {
  console.log('🔧 Testing Firebase connection...');
  // This will trigger the auth service initialization
  console.log('🔧 Auth service status:', auth.app.name);
} catch (error) {
  console.error('❌ Firebase connection test failed:', error);
}

// Connect to emulators in development (only if explicitly enabled)
const shouldUseEmulator =
  import.meta.env.DEV &&
  (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' ||
    import.meta.env.VITE_USE_FIREBASE_EMULATOR === true);

console.log('🔧 Environment check:', {
  NODE_ENV: import.meta.env.MODE,
  USE_FIREBASE_EMULATOR: import.meta.env.VITE_USE_FIREBASE_EMULATOR,
  USE_FIREBASE_EMULATOR_type: typeof import.meta.env.VITE_USE_FIREBASE_EMULATOR,
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

export default boot(async ({ app: vueApp }) => {
  // Wait for Firebase to be fully ready
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Initialize VueFire WITHOUT authentication module to avoid timing issues
  try {
    vueApp.use(VueFire, {
      firebaseApp: app,
      modules: [], // Remove VueFireAuth() to prevent auth timing issues
    });
    console.log('✅ Firebase and VueFire initialized successfully (auth disabled)');
  } catch (error) {
    console.error('❌ Firebase/VueFire initialization failed:', error);
    throw error;
  }
});
