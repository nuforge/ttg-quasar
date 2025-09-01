# Tabletop Gaming (TTG### � Real-time Features

- **Live Event Updates**: Events sync automatically across all users
- **Calendar Integration**: Interactive calendar showing events with visual indicators
- **Selected Date Events**: Right drawer shows events for currently selected date
- **Instant RSVP Feedback**: Immediate response to user interactions
- **Reactive Player Lists**: Confirmed and interested player lists update automatically
- **Independent Button Loading**: Each RSVP action shows individual loading statesasar App

A comprehensive Tabletop Gaming Management Application built with Vue 3, Quasar Framework, and Firebase.

## 🚀 Features

### 🔐 Authentication

- **Multi-Provider Sign-In**: Google, Facebook, and Email/Password authentication
- **VueFire Integration**: Reactive authentication state management
- **Flexible Access**: Public browsing for games/events, authentication for interactions
- **User Profiles**: Automatic player profile creation and management

### 📅 Event Management

- **Create Events**: Organize gaming sessions with real-time RSVP tracking
- **Interactive Calendar**: Visual calendar with event indicators and date selection
- **Independent RSVP States**: Separate RSVP and Interest toggles for flexible participation
- **Player Limits**: Set minimum and maximum player counts
- **Real-time Updates**: Live event updates across all users
- **Firebase Integration**: Reliable event data storage and synchronization
- **SEO-Friendly URLs**: Events use `/events/firebase_doc_id/title-slug` format

### � Real-time Features

- **Live Event Updates**: Events sync automatically across all users
- **Calendar Integration**: Interactive calendar showing events with visual indicators
- **Selected Date Events**: Right drawer shows events for currently selected date
- **Instant RSVP Feedback**: Immediate response to user interactions

### 💬 Real-time Messaging

- **Game Comments**: Public discussions for each game
- **Event Messages**: Event-specific chat and coordination
- **Direct Messages**: Private conversations between players
- **Live Updates**: Real-time messaging with Firebase

### 🎮 Game Library

- **Comprehensive Database**: 50+ board games with detailed information
- **Smart Icons**: Intelligent icon mapping based on game mechanics
- **Rich Details**: Player counts, age ratings, playtime, and descriptions
- **Visual Assets**: High-quality game images and artwork
- **User Preferences**: Personal favorites, bookmarks, and notification settings
- **SEO-Friendly URLs**: Games use `/games/firebase_doc_id/title-slug` format
- **Firebase Integration**: Real-time syncing of user game preferences

### 🔔 Game Preferences & Notifications

- **Favorites**: Star games you love for easy access
- **Bookmarks**: Save games you want to play later
- **Event Notifications**: Get notified about events for specific games
- **Customizable Settings**: Configure notification timing and preferences
- **Real-time Updates**: Instant syncing across all devices
- **Notification Bell**: Header notification center with unread counts

### 👥 Player Management

- **Player Profiles**: Rich player information and preferences
- **Avatar Support**: Profile pictures and customization
- **Game History**: Track events and participation
- **Social Features**: Connect with other players

### 🛡️ Admin Features

- **Role-Based Access**: Secure admin permissions and user management
- **Admin Dashboard**: Comprehensive system overview and statistics
- **User Management**: Admin controls for user roles and permissions
- **Game Library Management**: Add, edit, and manage the game database
- **Development Mode**: Override admin access for initial setup and development

## 🔑 Admin Access

### Initial Setup

1. Visit `/admin/setup` for first-time admin user creation
2. Development mode allows temporary admin override
3. Production requires proper admin roles in Firebase

### Admin Features Access

- **Dashboard**: `/admin` - System overview and quick actions
- **User Management**: `/admin/users` - Manage user roles and permissions
- **Game Management**: `/admin/games` - Manage game library

## 🛠️ Technology Stack

- **Framework**: Vue 3 + Quasar v2.18.2
- **Language**: TypeScript with strict type checking
- **Backend**: Firebase v12.1.0 (Firestore, Authentication, Storage)
- **State Management**: Pinia + VueFire v3.2.2
- **Internationalization**: Vue i18n v9 with English and Spanish support
- **Routing**: Vue Router with authentication guards
- **Styling**: SCSS + Quasar components
- **Icons**: Material Design Icons + Material Design Icons (mdi-v7)
- **Build Tool**: Vite
- **Testing**: Vitest + Vue Test Utils + Happy DOM
- **Code Quality**: ESLint with TypeScript strict rules, Prettier

## 🎯 TypeScript Integration

This project uses **strict TypeScript** with advanced type safety features:

- **Exact Optional Property Types**: `exactOptionalPropertyTypes: true` ensures complete type accuracy
- **Strict Type Checking**: Eliminates `any` types for better code safety
- **Firebase Type Integration**: Proper typing for Firestore operations
- **Reactive Store Types**: Full TypeScript support for Pinia stores
- **Component Prop Types**: Strongly typed Vue component interfaces

### Type Safety Patterns

```typescript
// ✅ Optional properties with conditional spreading
const user = {
  name: 'John',
  ...(displayName && { displayName }),
};

// ✅ Safe array access with optional chaining
expect(results[0]?.title).toBe('Expected');

// ✅ Type-safe parsing with explicit base
const hour = parseInt(timeString || '0', 10) ?? 0;

// ✅ Const assertions for enum-like values
const eventType = 'tournament' as const;
```

### Type Safety Features

- **ReadonlyPlayerWithFirebase**: Handles readonly store objects with Firebase fields
- **Strict ESLint Rules**: Enforces TypeScript best practices (`@typescript-eslint/no-explicit-any`)
- **Interface Definitions**: Comprehensive type definitions for all data models
- **Generic Type Support**: Flexible typing for dynamic data structures
- **Test Type Safety**: All test mocks enforce strict interface compliance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase project (see setup guides)

### Installation

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd ttg-quasar
   npm install
   ```

2. **Firebase Setup**

   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your Firebase configuration
   # Follow DEV_SETUP.md for detailed instructions
   ```

3. **Start Development Server**

   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build for production (includes TypeScript compilation)
npm run format          # Format code with Prettier
npm run lint            # Lint code with ESLint (TypeScript strict)

# Testing
npm test                # Run tests in watch mode
npm run test:run        # Run all tests once
npm run test:ui         # Run tests with UI interface
npm run test:coverage   # Run tests with coverage report

# Firebase (after setup)
firebase emulators:start # Start Firebase emulators for local development
firebase deploy         # Deploy to Firebase hosting (optional)
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Firebase Configuration
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Development
NODE_ENV=development
```

### Firebase Setup

See detailed setup guides:

- `DEV_SETUP.md` - Complete development setup instructions
- `FIREBASE_SETUP.md` - Firebase project configuration guide

## 🏗️ Project Structure

```
src/
├── boot/              # Quasar boot files (Firebase, i18n, etc.)
├── components/        # Reusable Vue components
│   ├── events/       # Event-related components
│   ├── messaging/    # Chat and messaging components
│   ├── players/      # Player management components
│   └── qrcode/       # QR code functionality
├── composables/      # Vue composables (auth guards, etc.)
├── layouts/          # Page layouts
├── models/           # TypeScript models (Event, Player, Message, Game)
├── pages/            # Page components
├── router/           # Vue Router configuration
├── services/         # External services (Firebase, Auth)
├── stores/           # Pinia stores (events, messages, players)
└── utils/            # Utility functions
```

## 🔐 Authentication

The app uses VueFire for reactive Firebase authentication:

```typescript
// Using the current user in components
import { useCurrentUser } from 'vuefire';

const user = useCurrentUser();
const isAuthenticated = computed(() => !!user.value);
```

### Route Protection

Routes use flexible authentication - public browsing with auth for interactions:

```typescript
// Public browsing routes (no auth required)
{
  path: '/games',
  component: GamesPage // Browse games publicly
},
{
  path: '/events',
  component: EventsPage // Browse events publicly
},

// Protected routes (auth required)
{
  path: '/account',
  beforeEnter: requireAuth,
  component: AccountPage
}
```

## 🎯 Key Features Deep Dive

### Real-time Event Management

- Create events with game selection
- Real-time RSVP tracking
- Interactive calendar with event management
- Player limit enforcement

### Messaging System

- Public game comments
- Private event discussions
- Direct messaging
- Real-time updates via Firestore

### Game Integration

- Comprehensive game database
- Intelligent icon mapping
- Event creation from game pages
- Rich game details and artwork

## 🌍 Internationalization (i18n)

TTG Quasar supports full internationalization with comprehensive language support:

### Supported Languages

- **English (en-US)**: Primary language with complete translations
- **Spanish (en-ES)**: Full Spanish translations for all UI elements

### i18n Features

- **Complete UI Translation**: 250+ translation keys covering all interface elements
- **Vue i18n Integration**: Reactive language switching using Vue i18n v9
- **Pluralization Support**: Smart pluralization for counts and dynamic content
- **Type Safety**: TypeScript ensures translation key consistency across languages
- **Dynamic Language Switching**: Users can switch languages seamlessly
- **SEO-Friendly**: Supports locale-specific routing and meta tags
- **Comprehensive Coverage**: All user-visible text translated, including notifications and tooltips

### Translation Coverage

- **Navigation**: All menu items, page titles, and navigation elements
- **Actions**: Buttons, form actions, and interactive elements
- **RSVP States**: Event participation status and feedback messages
- **Form Fields**: Input labels, validation messages, and placeholders
- **Admin Features**: Administrative interface and management tools
- **Notifications**: Alert messages, confirmations, and status updates including game collection management
- **Tooltips**: Help text and contextual information for all interactive elements
- **Error Messages**: User-friendly error handling and validation
- **Search & Filters**: Search placeholders and filter options
- **Status Indicators**: Loading states, success messages, and progress indicators
- **Game Interactions**: Favorites, bookmarks, ownership, and notification preferences
- **User Feedback**: Success/error messages for all user actions with dynamic content

### Language File Structure

```typescript
// src/i18n/en-US/index.ts
export default {
  // Navigation
  home: 'Home',
  events: 'Events',
  games: 'Games',

  // Actions
  create: 'Create',
  edit: 'Edit',
  save: 'Save',

  // RSVP States
  confirmed: 'Confirmed',
  interested: 'Interested',
  pending: 'Pending',

  // Pluralization
  playersCount: '{count} player | {count} players',

  // ... 220+ more keys
};
```

### Adding New Translations

1. **Add to English**: Add new keys to `src/i18n/en-US/index.ts`
2. **Add to Spanish**: Add corresponding translations to `src/i18n/en-ES/index.ts`
3. **Use in Components**: Import and use via `useI18n()` composable

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <q-btn :label="t('create')" />
  <p>{{ t('playersCount', { count: playerCount }) }}</p>
</template>
```

### Language Switching

Users can switch languages through the language selector in the settings or header menu. The entire application interface will update immediately to reflect the selected language.

## 🔒 Security

- **Firestore Security Rules**: Row-level security for all collections
- **Flexible Authentication**: Public browsing for discovery, auth required for interactions (RSVPs, messaging, admin)
- **Data Validation**: Client and server-side validation
- **Storage Rules**: Secure file uploads with size limits

## 🧪 Testing

This project includes a comprehensive testing suite to ensure code quality and prevent regressions:

### Test Suite Overview

- **202 passing tests** across 11 test files (100% success rate)
- **Component Testing**: GameIcon, PlayerCard, PlayersPage
- **Store Testing**: Events Firebase Store, Games Firebase Store, Players Firebase Store with comprehensive business logic
- **Service Testing**: Event Submission Service with full CRUD operations
- **Utility Testing**: Game icons mapping and conversation utilities
- **Firebase Strategy**: Business logic testing focused on testable operations (not Firebase Auth internals)

### Testing Stack

- **Vitest**: Fast, modern test runner with TypeScript support
- **Vue Test Utils**: Official Vue.js testing utilities
- **Happy DOM**: Lightweight browser environment for testing
- **Firebase Mocks**: Complete Firebase operation mocking

### Running Tests

```bash
npm test                # Watch mode for development
npm run test:run        # Single test run
npm run test:coverage   # Coverage report
npm run test:ui         # Interactive test UI
```

For detailed testing documentation, see `TESTING.md`.

## 🚀 Deployment

### Firebase Hosting (Recommended)

```bash
npm run build
firebase deploy --only hosting
```

### Other Platforms

The built `dist/spa` folder can be deployed to any static hosting service.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🆘 Support

For setup issues or questions:

1. Check `DEV_SETUP.md` for configuration help
2. Review `FIREBASE_SETUP.md` for Firebase-specific issues
3. Check the Firebase Console for backend logs
4. Verify environment variables are correctly set

---

Built with ❤️ using Vue 3, Quasar, and Firebase
