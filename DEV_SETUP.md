# Development Setup Instructions

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** and npm installed
- **TypeScript knowledge** for effective development
- **Firebase account** for backend services
- **Java** (automatically installed via setup-java.ps1 for Firebase emulators)

## TypeScript Configuration

This project uses **strict TypeScript** with advanced type safety:

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true,
    "strict": true,
    "noImplicitAny": true
  }
}
```

### ESLint Configuration

- **@typescript-eslint/no-explicit-any**: Prevents any type usage
- **Strict type checking**: Enforces proper TypeScript patterns
- **Vue-specific rules**: TypeScript integration with Vue components

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

## Additional Configuration

For full functionality, ensure:

1. Firebase Authentication is properly configured
2. All OAuth providers are enabled as needed
3. Firestore security rules are in place

## Features Available

### 🔐 Authentication

- Google sign-in with secure authentication
- Automatic player profile creation
- User state persistence

### 📅 Events Management

- Create events with game selection
- Join/leave events with real-time updates
- Interactive calendar with event management
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
# Development server with hot reload
npm run dev

# TypeScript compilation check
npm run type-check
# OR use Vue's TypeScript compiler
npx vue-tsc --noEmit

# Code quality checks
npm run lint              # ESLint with TypeScript rules
npm run format           # Prettier formatting

# Build for production
npm run build

# Firebase emulators (requires Java)
firebase emulators:start --only auth,firestore,storage

# Deploy security rules (after setting up project)
firebase deploy --only firestore:rules,storage:rules
```

## TypeScript Development Tips

### Working with Store Types

```typescript
// Use proper typing for store objects
type ReadonlyPlayerWithFirebase = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly firebaseId?: string | undefined;
  // ... other properties
};
```

### Component Interface Definitions

```typescript
// Flexible component interfaces with readonly support
interface PlayerLike {
  readonly id?: string | number;
  readonly name: string;
  readonly email: string;
  readonly avatar?: string | undefined;
}
```

## Troubleshooting

### TypeScript Issues

- **exactOptionalPropertyTypes errors**: Ensure optional properties include `| undefined`
- **readonly array issues**: Use `readonly` arrays in type definitions
- **ESLint any errors**: Replace with specific types or document exceptions

### Java Issues

- Run `./setup-java.ps1` if Java not found
- Restart VS Code/terminal after Java installation

### Authentication Issues

- Verify OAuth domains in Firebase Console
- Check Firebase Authentication providers are enabled

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

## Testing & Quality Assurance

### Comprehensive Test Suite

This project maintains a **150-test comprehensive testing suite** with 100% pass rate:

```bash
# Run all tests
npm test                # Watch mode for development
npm run test:run        # Single test run
npm run test:coverage   # Generate coverage report
npm run test:ui         # Interactive test UI
```

### Testing Strategy

- **Business Logic Focus**: Tests cover store state, computed properties, and data processing
- **Firebase Mocking**: Proper mocking patterns for Firestore operations
- **Component Testing**: Vue component behavior and interactions
- **Service Testing**: CRUD operations and error handling
- **TypeScript Safety**: Strict type checking prevents runtime errors

### Coverage Areas

- ✅ **Events Store**: State management, RSVP logic, event filtering (45 tests)
- ✅ **Players Store**: User management, profile operations
- ✅ **Event Submission Service**: Complete CRUD workflow (46 tests)
- ✅ **Components**: GameIcon, PlayerCard, PlayersPage
- ✅ **Utilities**: Game icons, conversation helpers

See `TESTING.md` for detailed testing documentation and Firebase-specific testing patterns.

The app will work perfectly with a real Firebase project and provides all the real-time features we've implemented!
