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
if (process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch {
    console.log('Auth emulator not available');
  }

  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch {
    console.log('Firestore emulator not available');
  }

  try {
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch {
    console.log('Storage emulator not available');
  }
}

export default boot(({ app: vueApp }) => {
  // Initialize VueFire
  vueApp.use(VueFire, {
    firebaseApp: app,
    modules: [VueFireAuth()],
  });

  console.log('Firebase and VueFire initialized');
});
