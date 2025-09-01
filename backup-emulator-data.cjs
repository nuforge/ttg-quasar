// Emergency backup script - exports emulator data to JSON files
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize emulator Admin SDK
const emulatorApp = admin.initializeApp(
  {
    projectId: 'demo-project',
  },
  'emulator-backup',
);

// Configure emulator connection
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const emulatorDb = admin.firestore(emulatorApp);

async function backupCollection(collectionName) {
  console.log(`📦 Backing up ${collectionName}...`);

  try {
    const snapshot = await emulatorDb.collection(collectionName).get();
    const data = {};

    snapshot.docs.forEach((doc) => {
      data[doc.id] = doc.data();
    });

    const backupDir = './backup';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const filename = path.join(
      backupDir,
      `${collectionName}-${new Date().toISOString().split('T')[0]}.json`,
    );
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));

    console.log(`✅ ${collectionName} backed up to ${filename} (${snapshot.size} documents)`);
  } catch (error) {
    console.error(`❌ Error backing up ${collectionName}:`, error.message);
  }
}

async function createBackup() {
  console.log('🔄 Creating emergency backup of emulator data...');

  await backupCollection('games');
  await backupCollection('events');
  await backupCollection('players');
  await backupCollection('userPreferences');
  await backupCollection('messages');

  console.log('✅ Emergency backup complete!');
  process.exit(0);
}

createBackup().catch(console.error);
