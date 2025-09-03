// Script to restore REAL data from production Firebase to emulator
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  connectFirestoreEmulator,
} = require('firebase/firestore');

// Production Firebase config
const prodApp = initializeApp(
  {
    apiKey: 'AIzaSyA7uMjJdSeGUEzRheZL0Qp5Zr5Nqq5Mzn4',
    authDomain: 'ttgaming-dd3c0.firebaseapp.com',
    projectId: 'ttgaming-dd3c0',
    storageBucket: 'ttgaming-dd3c0.firebasestorage.app',
    messagingSenderId: '302714917546',
  },
  'prod',
);

// Emulator app
const emulatorApp = initializeApp({ projectId: 'ttgaming-dd3c0' }, 'emulator');
const emulatorDb = getFirestore(emulatorApp);
connectFirestoreEmulator(emulatorDb, 'localhost', 8080);

const prodDb = getFirestore(prodApp);

async function copyCollection(collectionName) {
  console.log(`Copying ${collectionName} from production...`);

  try {
    const snapshot = await getDocs(collection(prodDb, collectionName));
    console.log(`Found ${snapshot.size} documents in ${collectionName}`);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      await setDoc(doc(emulatorDb, collectionName, docSnap.id), data);
      console.log(`Copied ${collectionName}/${docSnap.id}`);
    }

    console.log(`✅ ${collectionName} copied successfully`);
  } catch (error) {
    console.error(`❌ Error copying ${collectionName}:`, error.message);
  }
}

async function restoreData() {
  console.log('🔄 Restoring REAL data from production Firebase...');

  await copyCollection('games');
  await copyCollection('events');
  await copyCollection('players');

  console.log('✅ Data restoration complete!');
  process.exit(0);
}

restoreData().catch(console.error);
