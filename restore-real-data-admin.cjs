// Script to restore REAL data using Firebase Admin SDK
const admin = require('firebase-admin');
const { getFirestore: getAdminFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  connectFirestoreEmulator,
} = require('firebase/firestore');

// Initialize Admin SDK with service account
const serviceAccount = require('./ttgaming-dd3c0-firebase-adminsdk-fbsvc-defb0cbb77.json');
const adminApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ttgaming-dd3c0',
  },
  'admin',
);

const adminDb = getAdminFirestore(adminApp);

// Initialize emulator
const emulatorApp = initializeApp({ projectId: 'demo-project' }, 'emulator');
const emulatorDb = getFirestore(emulatorApp);
connectFirestoreEmulator(emulatorDb, 'localhost', 8080);

async function copyCollection(collectionName) {
  console.log(`Copying ${collectionName} from production...`);

  try {
    const snapshot = await adminDb.collection(collectionName).get();
    console.log(`Found ${snapshot.size} documents in ${collectionName}`);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Convert Firestore timestamps to plain objects
      const convertedData = JSON.parse(
        JSON.stringify(data, (key, value) => {
          if (value && typeof value === 'object' && value._seconds !== undefined) {
            return new Date(value._seconds * 1000);
          }
          return value;
        }),
      );

      await setDoc(doc(emulatorDb, collectionName, docSnap.id), convertedData);
      console.log(`Copied ${collectionName}/${docSnap.id}`);
    }

    console.log(`✅ ${collectionName} copied successfully`);
  } catch (error) {
    console.error(`❌ Error copying ${collectionName}:`, error.message);
  }
}
async function restoreRealData() {
  console.log('🔄 Restoring REAL data from production Firebase using Admin SDK...');

  await copyCollection('games');
  await copyCollection('events');
  await copyCollection('players');

  console.log('✅ All REAL data restored to emulator!');
  process.exit(0);
}

restoreRealData().catch(console.error);
