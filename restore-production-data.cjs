// Script to restore REAL data using Admin SDK only
const admin = require('firebase-admin');

// Initialize production Admin SDK
const serviceAccount = require('./ttgaming-dd3c0-firebase-adminsdk-fbsvc-defb0cbb77.json');
const prodAdminApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ttgaming-dd3c0',
  },
  'prod-admin',
);

// Initialize emulator Admin SDK
const emulatorAdminApp = admin.initializeApp(
  {
    projectId: 'demo-project',
  },
  'emulator-admin',
);

// Configure emulator to connect to localhost
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const prodDb = admin.firestore(prodAdminApp);
const emulatorDb = admin.firestore(emulatorAdminApp);

async function copyCollection(collectionName) {
  console.log(`Copying ${collectionName} from production...`);

  try {
    const snapshot = await prodDb.collection(collectionName).get();
    console.log(`Found ${snapshot.size} documents in ${collectionName}`);

    const batch = emulatorDb.batch();

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const docRef = emulatorDb.collection(collectionName).doc(docSnap.id);
      batch.set(docRef, data);
    });

    await batch.commit();
    console.log(`✅ ${collectionName} batch copied successfully`);
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
