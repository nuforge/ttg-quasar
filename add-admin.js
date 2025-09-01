// Quick script to add current user as admin in Firebase emulator
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Your Firebase config (same as in boot/firebase.ts)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyDkGd8QDgRhPr5wZdFLnJ6mOqG2hJv4A5g',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'ttgaming-dd3c0.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'ttgaming-dd3c0',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'ttgaming-dd3c0.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '747363832180',
  appId: process.env.FIREBASE_APP_ID || '1:747363832180:web:9b3d3f8e8a1c2d4e5f6g7h',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8080);
connectAuthEmulator(auth, 'http://localhost:9099');

// Your user ID from the console logs - replace this with your actual Firebase UID
const YOUR_USER_ID = 'YOUR_FIREBASE_UID_HERE';

async function addAdminRole() {
  try {
    const roleData = {
      name: 'admin, moderator, user',
      permissions: ['admin', 'moderator', 'user'],
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: 'system',
    };

    await setDoc(doc(db, 'userRoles', YOUR_USER_ID), roleData);
    console.log('✅ Admin role added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding admin role:', error);
    process.exit(1);
  }
}

addAdminRole();
