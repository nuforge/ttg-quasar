# Development Setup Instructions

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `ttg-tabletop-gaming` (or your preferred name)
4. Enable/disable Google Analytics as desired
5. Create project

### 2. Configure Authentication

1. In Firebase Console → Authentication → Sign-in method
2. Enable **Google** provider:
   - Click Google → Enable
   - Add your domain (localhost for dev, your domain for prod)
3. Optionally enable **Facebook** provider

### 3. Setup Firestore Database

1. Go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (we have security rules ready)
4. Select your preferred location

### 4. Setup Storage

1. Go to Storage
2. Click "Get started"
3. Start in test mode
4. Use same location as Firestore

### 5. Get Configuration

1. Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Add app" → Web
4. Register app name: "TTG Quasar"
5. Copy the config object

### 6. Environment Variables

Create `.env` file in project root:

```env
# Your Firebase Configuration
FIREBASE_API_KEY=AIzaSyC...your-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123

# Optional: Enable emulators (requires Java)
USE_FIREBASE_EMULATOR=false
```

## Development Options

### Option A: Production Firebase (Recommended to Start)

1. Set up your Firebase project as above
2. Fill in `.env` with your Firebase config
3. Keep `USE_FIREBASE_EMULATOR=false`
4. Start development:
   ```bash
   npm run dev
   ```

### Option B: Firebase Emulators (Advanced)

1. Java is already installed via `setup-java.ps1`
2. Enable emulators in `.env`:
   ```env
   USE_FIREBASE_EMULATOR=true
   ```
3. Start emulators in one terminal:
   ```bash
   firebase emulators:start --only auth,firestore,storage
   ```
4. Start your app in another terminal:
   ```bash
   npm run dev
   ```

## Google Calendar API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. APIs & Services → Library
4. Search "Google Calendar API" → Enable
5. The Firebase Auth token automatically provides access

## Features Available

### 🔐 Authentication

- Google sign-in with calendar permissions
- Automatic player profile creation
- User state persistence

### 📅 Events Management

- Create events with game selection
- Join/leave events with real-time updates
- Optional Google Calendar sync
- RSVP tracking with player limits

### 💬 Real-time Messaging

- Game discussions/comments
- Event-specific discussions
- Live updates across all users

### 🎮 Game Integration

- Browse games with rich details
- Comment system for each game
- Integration with event creation

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start Firebase emulators (requires Java)
firebase emulators:start --only auth,firestore,storage

# Deploy security rules (after setting up project)
firebase deploy --only firestore:rules,storage:rules
```

## Troubleshooting

### Java Issues

- Run `./setup-java.ps1` if Java not found
- Restart VS Code/terminal after Java installation

### Authentication Issues

- Verify OAuth domains in Firebase Console
- Check that Google Calendar API is enabled

### Connection Issues

- Verify `.env` configuration matches Firebase Console
- Check Firebase project is active: `firebase use your-project-id`

### Emulator Issues

- Make sure Java is in PATH
- Start emulators before starting the app
- Use `--only auth,firestore,storage` to avoid functions errors

## Next Steps

1. **Setup Firebase Project** following steps above
2. **Configure `.env`** with your Firebase credentials
3. **Start with Production Firebase** first (`USE_FIREBASE_EMULATOR=false`)
4. **Test Authentication** by signing in with Google
5. **Create Test Event** to verify real-time updates
6. **Optional**: Setup emulators for offline development

The app will work perfectly with a real Firebase project and provides all the real-time features we've implemented!
