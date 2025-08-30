# Tabletop Gaming (TTG) - Quasar App

A comprehensive Tabletop Gaming Management Application built with Vue 3, Quasar Framework, and Firebase.

## 🚀 Features

### 🔐 Authentication

- **Multi-Provider Sign-In**: Google, Facebook, and Email/Password authentication
- **VueFire Integration**: Reactive authentication state management
- **Route Protection**: Secure pages with authentication guards
- **User Profiles**: Automatic player profile creation and management

### 📅 Event Management

- **Create Events**: Organize gaming sessions with real-time RSVP tracking
- **Google Calendar Sync**: Optional integration with personal calendars
- **Custom Calendar Selection**: Choose specific Google Calendars for event migration
- **Auto-Authentication**: Seamless Google Calendar token refresh without manual re-auth
- **Event Migration**: Import existing event data with Firebase sync
- **Player Limits**: Set minimum and maximum player counts
- **Real-time Updates**: Live event updates across all users

### 🔄 Data Migration & Integration

- **Event Migration Dashboard**: Interactive UI for migrating JSON data to Firebase
- **Google Calendar Integration**: Automatic sync with configurable target calendars
- **Auto-Token Refresh**: Eliminates manual Google re-authentication requirements
- **Progress Tracking**: Real-time migration progress with error reporting
- **Dry Run Mode**: Test migrations before applying changes
- **Admin Controls**: Secure admin-only access to migration tools

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

### 👥 Player Management

- **Player Profiles**: Rich player information and preferences
- **Avatar Support**: Profile pictures and customization
- **Game History**: Track events and participation
- **Social Features**: Connect with other players

### 🛡️ Admin Features

- **Role-Based Access**: Secure admin permissions and user management
- **Admin Dashboard**: Comprehensive system overview and statistics
- **Event Migration Tools**: Import and sync event data to Firebase and Google Calendar
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
- **Data Migration**: `/admin/migration` - Event migration and Google Calendar sync

## 🛠️ Technology Stack

- **Framework**: Vue 3 + Quasar v2.18.2
- **Language**: TypeScript with strict type checking
- **Backend**: Firebase v12.1.0 (Firestore, Authentication, Storage)
- **State Management**: Pinia + VueFire v3.2.2
- **Routing**: Vue Router with authentication guards
- **Styling**: SCSS + Quasar components
- **Icons**: Material Design Icons + Material Design Icons (mdi-v7)
- **Build Tool**: Vite
- **Testing**: Vitest + Vue Test Utils + Happy DOM
- **Code Quality**: ESLint with TypeScript strict rules, Prettier

## 🎯 TypeScript Integration

This project uses **strict TypeScript** with advanced type safety features:

- **Exact Optional Property Types**: Ensures complete type accuracy
- **Strict Type Checking**: Eliminates `any` types for better code safety
- **Firebase Type Integration**: Proper typing for Firestore operations
- **Reactive Store Types**: Full TypeScript support for Pinia stores
- **Component Prop Types**: Strongly typed Vue component interfaces

### Type Safety Features

- **ReadonlyPlayerWithFirebase**: Handles readonly store objects with Firebase fields
- **Strict ESLint Rules**: Enforces TypeScript best practices
- **Interface Definitions**: Comprehensive type definitions for all data models
- **Generic Type Support**: Flexible typing for dynamic data structures

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
npm run build           # Build for production
npm run format          # Format code with Prettier
npm run lint            # Lint code with ESLint (TypeScript strict)
npm run type-check      # TypeScript compilation check

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
├── services/         # External services (Firebase, Google Calendar)
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

Routes are protected using authentication guards:

```typescript
// Protected route example
{
  path: '/events',
  beforeEnter: requireAuth,
  component: EventsPage
}
```

## 🎯 Key Features Deep Dive

### Real-time Event Management

- Create events with game selection
- Real-time RSVP tracking
- Google Calendar integration
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

## 🔒 Security

- **Firestore Security Rules**: Row-level security for all collections
- **Authentication Required**: Protected routes and API calls
- **Data Validation**: Client and server-side validation
- **Storage Rules**: Secure file uploads with size limits

## 🧪 Testing

This project includes a comprehensive testing suite to ensure code quality and prevent regressions:

### Test Suite Overview

- **59 passing tests** across 7 test files (100% success rate)
- **Component Testing**: GameIcon, PlayerCard, PlayersPage
- **Store Testing**: Players Firebase Store with mocked Firebase operations
- **Utility Testing**: Game icons mapping and conversation utilities
- **Integration Testing**: Cross-component interactions

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
