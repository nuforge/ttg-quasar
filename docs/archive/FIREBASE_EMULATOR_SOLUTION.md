# FIREBASE EMULATOR CRITICAL SOLUTION DOCUMENTATION

## NEVER BREAK THE EMULATOR AGAIN - FOLLOW THIS EXACTLY

### THE PROBLEM THAT KEPT HAPPENING

- Changing `singleProjectMode: false` in `firebase.json` DESTROYS emulator configuration
- Running `firebase init emulators` DESTROYS working configuration
- Background terminal processes get killed when other terminal commands execute
- .firebaserc project changes break existing emulator setup

### THE WORKING SOLUTION - DO THIS EXACTLY

**Step 1: Keep Original Configuration**

- NEVER change `singleProjectMode: true` in `firebase.json`
- NEVER change .firebaserc from `ttgaming-dd3c0` to `demo-project`
- NEVER run `firebase init emulators`

**Step 2: Start Emulator in Separate Window**

```powershell
start-process cmd -argumentlist "/k", "firebase emulators:start --only auth,firestore,storage --project demo-project"
```

**Step 3: Restore Production Data**

```powershell
node restore-real-data-admin.cjs
```

Expected output: 70 games, 20 events, 14 players copied

**Step 4: IMMEDIATE Backup**

```powershell
node backup-emulator-data.cjs
```

### GOOGLE CALENDAR INTEGRATION NOTES

**CRITICAL**: Firebase emulators provide **fake OAuth tokens** that don't work with external APIs like Google Calendar.

**Solution**: Hybrid approach implemented:

- **Firebase emulator**: Used for TTG development (Auth, Firestore, Storage)
- **Real Google OAuth**: Separate auth instance bypasses emulator for Calendar API access

**Implementation**:

```typescript
// Real auth instance for Calendar API
const realAuth = initializeApp(firebaseConfig, 'realAuth');
// Uses real Google OAuth tokens for Calendar operations
```

**Benefits**:

- Clean emulator development for TTG features
- Real Calendar API integration without emulator limitations
- No need to disable emulators for Calendar testing

### WHAT NOT TO DO - THESE BREAK EVERYTHING

- ❌ `firebase init emulators`
- ❌ Changing `singleProjectMode` to `false`
- ❌ Changing .firebaserc default project
- ❌ Running emulator commands as background in same terminal as other commands
- ❌ Using regular `firebase emulators:start` without project override
- ❌ Expecting emulator OAuth tokens to work with Google Calendar API

### TROUBLESHOOTING

If emulator won't start with "No emulators to start" error:

1. Check firebase.json has emulators section with ports
2. Use npx with project override: `npx firebase-tools emulators:start --only auth,firestore,storage --project demo-project`
3. Never run firebase init - it destroys working config

### BACKUP COMMANDS

- **Create backup**: `node backup-emulator-data.cjs`
- **Restore from backup**: `node import-from-backup.cjs`
- **Restore from production**: `node restore-real-data-admin.cjs`

### ACCESS POINTS

- **Emulator UI**: http://127.0.0.1:4000
- **Firestore Data**: http://127.0.0.1:4000/firestore
- **Auth Users**: http://127.0.0.1:4000/auth

---

_This documentation written after extensive troubleshooting session where these exact steps finally worked._
