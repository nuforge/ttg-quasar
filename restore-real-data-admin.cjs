// Script to restore REAL data using Firebase Admin SDK
const admin = require('firebase-admin');
const { getFirestore: getAdminFirestore } = require('firebase-admin/firestore');

// Initialize Admin SDK with service account for production
const serviceAccount = require('./ttgaming-dd3c0-firebase-adminsdk-fbsvc-defb0cbb77.json');
const adminApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ttgaming-dd3c0',
  },
  'admin',
);

const adminDb = getAdminFirestore(adminApp);

// Initialize Admin SDK for emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const emulatorApp = admin.initializeApp(
  {
    projectId: 'demo-project',
  },
  'emulator',
);

const emulatorDb = getAdminFirestore(emulatorApp);

async function copyCollection(collectionName) {
  console.log(`Copying ${collectionName} from production...`);

  try {
    const snapshot = await adminDb.collection(collectionName).get();
    console.log(`Found ${snapshot.size} documents in ${collectionName}`);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Convert Firestore timestamps to plain objects and fix data for emulator
      let convertedData = JSON.parse(
        JSON.stringify(data, (key, value) => {
          if (value && typeof value === 'object' && value._seconds !== undefined) {
            return new Date(value._seconds * 1000);
          }
          return value;
        }),
      );

      // Fix games for development use - set as active for featured games
      if (collectionName === 'games') {
        convertedData.status = 'active';
      }

      // Use Admin SDK for emulator writes
      await emulatorDb.collection(collectionName).doc(docSnap.id).set(convertedData);
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
