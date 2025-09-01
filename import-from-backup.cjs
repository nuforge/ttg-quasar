// Import data from backup JSON files to emulator
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize emulator Admin SDK
const emulatorApp = admin.initializeApp(
  {
    projectId: 'demo-project',
  },
  'emulator-import',
);

// Configure emulator connection
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const emulatorDb = admin.firestore(emulatorApp);

async function importCollection(collectionName) {
  console.log(`📥 Importing ${collectionName}...`);

  try {
    const filename = path.join('./backup', `${collectionName}-2025-09-01.json`);

    if (!fs.existsSync(filename)) {
      console.log(`⚠️  No backup file found for ${collectionName}: ${filename}`);
      return;
    }

    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    const docIds = Object.keys(data);

    if (docIds.length === 0) {
      console.log(`⚠️  No data in backup file for ${collectionName}`);
      return;
    }

    const batch = emulatorDb.batch();

    docIds.forEach((docId) => {
      const docRef = emulatorDb.collection(collectionName).doc(docId);
      batch.set(docRef, data[docId]);
    });

    await batch.commit();
    console.log(`✅ ${collectionName} imported successfully (${docIds.length} documents)`);
  } catch (error) {
    console.error(`❌ Error importing ${collectionName}:`, error.message);
  }
}

async function importBackup() {
  console.log('🔄 Importing data from backup files...');

  await importCollection('games');
  await importCollection('events');
  await importCollection('players');
  await importCollection('userPreferences');
  await importCollection('messages');

  console.log('✅ Import complete!');
  process.exit(0);
}

importBackup().catch(console.error);
