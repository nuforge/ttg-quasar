# TTG Quasar Copilot Instructions

## CRITICAL USER INTERACTION RULES

**NEVER REMOVE OR ROLLBACK USER-REQUESTED FEATURES WITHOUT EXPLICIT PERMISSION**

- **ASK FIRST**: Before removing, reverting, or undoing ANY functionality the user requested
- **NO ASSUMPTIONS**: Don't assume something should be removed because of errors - fix the errors instead
- **NO COMMITS**: Never commit code unless the user specifically asks for it
- **USER APPROVAL**: Always ask "Should I commit these changes?" before any git operations
- **PRESERVE WORK**: If there are errors, fix them - don't delete the user's requested functionality

## Project Overview

This is a Vue 3 + Quasar + Firebase tabletop gaming management app with real-time features, strict TypeScript, and comprehensive testing. Key focus: social gaming coordination with event management, RSVP tracking, and messaging.

## Architecture Patterns

### Firebase-Only Design

- **Firebase Stores Only**: Use `*-firebase-store.ts` exclusively - legacy `*-store.ts` files are deprecated
- **VueFire Integration**: Uses `vuefire` for reactive Firebase authentication (`useCurrentUser()`) and real-time data binding
- **Real-time Everything**: Events, messages, RSVPs sync automatically via Firestore listeners
- **Authentication**: Firebase Auth with Google/Facebook providers via `auth-service.ts`

### Data Flow Architecture

```
Firebase Firestore → VueFire → Pinia Stores → Vue Components → User Actions → Firebase
```

### TypeScript Strictness

- **Exact Optional Properties**: `exactOptionalPropertyTypes: true` - use `| undefined` explicitly
- **No `any` Types**: ESLint enforces `@typescript-eslint/no-explicit-any`
- **Firebase Typing**: Models in `src/models/` define strict interfaces (Event, Player, Game, etc.)

## Key Development Patterns

### Store Pattern (Firebase Only)

```typescript
// ONLY use Firebase stores - legacy stores are deprecated
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';

// Stores follow: state (refs) → getters (computed) → actions (functions)
```

### Component Structure

- **Quasar Components Only**: Always use `q-*` components, never custom CSS or HTML elements
- **No Custom Styling**: Use Quasar's built-in properties (`flat`, `outlined`, etc.) instead of custom CSS
- **No Borders/Shadows**: Use `flat` variant for clean, borderless design
- **Composables**: Authentication via `useCurrentUser()`, guards via `useAuthGuard.ts`
- **Props**: Strict TypeScript interfaces with exact optional properties

### Responsive Grid System

- **Column Breakpoints**: Use `col-12 col-sm-6 col-md-4 col-lg-3` for 4-item responsive layouts
- **Prevent Wrapping**: Ensure 4 items per row on desktop with proper responsive breakpoints
- **Quasar Grid**: Always use `q-row` and `col-*` classes, never custom flexbox

### Firebase Operations

- **Fresh Data**: Always get latest from store before mutations to prevent stale state
- **Error Handling**: Wrap Firebase calls in try-catch with user-friendly messages
- **Real-time**: Use Firestore listeners in stores, not direct queries in components

## Critical Files & Conventions

### Boot Files (`src/boot/`)

- `firebase.ts`: Firebase initialization, emulator connection for development
- Order matters: `['i18n', 'axios', 'firebase']` in `quasar.config.ts`

### Models (`src/models/`)

- **Event.ts**: Complex class with business logic methods (`getDateObject()`, `getSlugUrl()`)
- **Player.ts**: User profile representation with Firebase integration
- All models have TypeScript interfaces + class implementations

### Routing (`src/router/`)

- **Auth Guards**: `requireAuth`, `requireGuest` via `useAuthGuard.ts`
- **SEO URLs**: Events/Games use `/type/firebase_doc_id/title-slug` pattern
- Firebase doc IDs required for routing - store in `firebaseDocId` property

### Testing Strategy (`test/`)

- **202 tests, 100% pass rate** - maintain this standard
- **Small Changes, Big Errors Prevention**: Tests catch breaking changes in core business logic
- **Store Testing Focus**: Computed properties, data transformations, RSVP logic
- **Service Layer Testing**: CRUD operations, validation, error handling
- **Component Testing**: User interactions, prop validation, event emission
- **Firebase Mocking**: Custom mocks in `test/mocks/`, avoid testing Firebase internals
- **Run Tests**: `npm test` (watch) or `npm run test:run` (CI)
- **Practical Value**: Tests verify real business scenarios, not implementation details

## Development Workflow

### Environment Setup

1. `npm install` → automatic Quasar prepare
2. Copy `.env.example` to `.env` with Firebase config
3. `npm run dev` for development server
4. Firebase emulators via `USE_FIREBASE_EMULATOR=true` in `.env`

### Firebase Emulator Development (Recommended for Clean Development)

The project includes comprehensive Firebase emulator support for isolated development:

**Benefits of Emulator Development:**

- **Isolated Data**: No interference with production Firebase data
- **Faster Development**: Local operations are faster than remote Firebase calls
- **Reproducible State**: Reset emulator data easily for consistent testing
- **Offline Development**: Work without internet connectivity
- **Cost-Free**: No Firebase usage charges during development

**Emulator Setup:**

1. **Java Auto-Install**: Run `./setup-java.ps1` (already included in project)
2. **Enable Emulators**: Set `USE_FIREBASE_EMULATOR=true` in `.env`
3. **Start Emulators**: `firebase emulators:start --only auth,firestore,storage`
4. **Emulator UI**: Access at `http://localhost:4000` for data inspection
5. **App Development**: `npm run dev` in separate terminal

**Emulator Ports (configured in `firebase.json`):**

- Auth: `localhost:9099`
- Firestore: `localhost:8080`
- Storage: `localhost:9199`
- Admin UI: `localhost:4000`

**Data Management:**

- **Fresh Start**: Stop emulators to reset all data
- **Seed Data**: Import/export data via emulator UI
- **Real-time Testing**: Multiple browser windows sync via local Firestore

### Code Quality

- **ESLint First**: ALL ESLint errors must be resolved before any build is considered complete
- **Linting**: `npm run lint` - strict TypeScript + Vue rules
- **Formatting**: `npm run format` - Prettier with project config
- **Type Checking**: Automatic via Vite plugin, manual via `npm run type-check`

### Admin Features

- **Development Override**: Visit `/admin/setup` for initial admin user
- **Role-Based**: Admin routes use `requireAuth` + Firebase custom claims
- **Admin Pages**: `/admin`, `/admin/users`, `/admin/games`
- **Streamlined Access**: Admin features need consistent UI patterns and better workflow organization
- **Custom Claims**: Firebase Auth custom claims determine admin permissions
- **Expandable Architecture**: Admin system designed for future feature expansion

## Common Patterns & Pitfalls

### Firebase Integration

```typescript
// ✅ Correct: Get fresh data from store
const store = useEventsFirebaseStore();
await store.fetchEvents(); // Ensure fresh data
const event = store.getEventById(eventId);

// ❌ Wrong: Using potentially stale component data
```

### RSVP State Management

- **Independent States**: RSVP (confirmed) and Interest are separate toggles
- **Loading States**: Individual button loading prevents double-clicks
- **Multi-participant**: RSVPs support `participants` count

### Real-time Components

- Use `computed` for reactive data from Firebase stores
- Avoid direct Firestore queries in components - use stores
- Loading states managed at store level, consumed by components

### URL Patterns

- Events: `/events/[firebaseDocId]/[title-slug]`
- Games: `/games/[firebaseDocId]/[title-slug]`
- Always include both Firebase ID and SEO slug

This codebase emphasizes real-time collaboration, type safety, and comprehensive testing. When adding features, follow the established Firebase-first, TypeScript-strict patterns.
