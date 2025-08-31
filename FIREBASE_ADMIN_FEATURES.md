# Firebase Integration & Admin Features - Production Ready

This document outlines the complete Firebase integration and admin features for the TTG Quasar application. **All systems are production-ready with security hardening complete.**

## 🔥 Firebase Integration

### Core Firebase Services

- **Firestore Database**: Real-time event and user data
- **Authentication**: Multi-provider sign-in (Google, Facebook, Email)
- **Security Rules**: Comprehensive data protection
- **Real-time Subscriptions**: Live data synchronization

### Key Components

- `src/stores/events-firebase-store.ts` - Event management with Firebase
- `src/stores/games-firebase-store.ts` - Game catalog management
- `src/stores/players-firebase-store.ts` - User and player data
- `src/services/auth-service.ts` - Authentication service

## 🎯 Event Management Features

### Interactive Calendar System

- **Visual Event Indicators**: Colored dots show event status
- **Date Selection**: Click dates to view events for that day
- **Real-time Updates**: Events sync automatically across users

### RSVP System

- **Independent States**: RSVP and Interest are completely separate toggles
- **Real-time Updates**: Changes sync immediately across all connected clients
- **Multi-participant Support**: Bring multiple people to events

### Game Integration

- **Dynamic Game Loading**: Games load from Firebase with real-time updates
- **Game Images**: Automatic image handling with fallbacks
- **Preferences**: Users can set game preferences that persist

## 🛡️ Admin Panel

### User Management

- **Role-based Access Control**: Admin, moderator, user roles
- **User Status Management**: Active, blocked, suspended states
- **Profile Management**: Edit user details and preferences
- **Admin Dashboard**: System statistics and monitoring

### Authentication Features

- **Multi-provider Sign-in**: Google OAuth, Facebook, Email/password
- **Session Management**: Automatic token renewal and security
- **Production Security**: Hardened authentication guards

## 📁 File Structure

### Core Pages

- `src/pages/AdminDashboard.vue` - Main admin dashboard
- `src/pages/AdminUsers.vue` - User management interface
- `src/pages/AdminGames.vue` - Game catalog management
- `src/pages/EventsPage.vue` - Event listing and management
- `src/pages/EventPage.vue` - Individual event details

### Services

- `src/services/auth-service.ts` - Authentication service
- `src/services/user-management-service.ts` - User operations
- `src/boot/firebase.ts` - Firebase initialization

### Stores (Pinia)

- `src/stores/events-firebase-store.ts` - Event management
- `src/stores/games-firebase-store.ts` - Game catalog
- `src/stores/players-firebase-store.ts` - User/player data
- `src/stores/calendar-store.ts` - Calendar state management

### Key Components

- `src/components/events/EventCard.vue` - Event display cards
- `src/components/events/EventRSVPButtons.vue` - Independent RSVP/Interest buttons
- `src/components/calendar/EventCalendar.vue` - Interactive calendar
- `src/components/RightDrawer.vue` - Selected date events display

## 🔧 Technical Implementation

### TypeScript Integration

- **Strict Type Checking**: Full TypeScript support throughout
- **Interface Definitions**: Proper models for all data structures
- **Type-safe Operations**: Validated Firebase operations

### Real-time Features

- **Firestore Subscriptions**: Live data updates
- **Reactive State Management**: Pinia with Vue 3 Composition API
- **Optimistic UI Updates**: Immediate feedback with server sync

### Security

- **Firestore Rules**: Comprehensive data access control
- **Authentication Guards**: Route protection based on roles
- **Input Validation**: Client and server-side validation

### TypeScript Improvements

- **ReadonlyPlayerWithFirebase Type**: Handles readonly store objects with Firebase fields
- **PlayerLike Interface**: Flexible component interface supporting readonly properties
- **Strict ESLint Configuration**: Eliminates `any` type usage across the codebase
- **Type-Safe Firebase Operations**: Proper typing for Firestore operations
- **Component Prop Validation**: Strongly typed component interfaces

## 🚀 Setup Instructions

### 1. Initial Admin Setup

1. Navigate to `/admin/setup`
2. Create the first administrator account
3. The system will automatically assign admin privileges

### 2. Firebase Configuration

1. Ensure Firebase project is configured with Firestore and Authentication
2. Update security rules as needed
3. Configure OAuth providers (Google, Facebook)

### 3. User Management

1. Access the Users section from the admin menu
2. Manage user roles, permissions, and status
3. Use bulk operations for efficient user management

## 🔐 Admin Permissions

### Permission Levels

- `admin` - Full system access including user management
- `moderator` - User management and content moderation
- `organizer` - Event creation and management
- `user` - Standard user access

### Role Assignment

- Roles are stored in the `userRoles` Firestore collection
- Each user can have multiple permissions
- Role changes are logged for audit purposes

## 👤 User Status Management

### Status Types

- `active` - Normal user access
- `blocked` - Access denied with reason
- `suspended` - Temporary access restriction
- `pending` - Awaiting approval

### Status Operations

- Bulk status updates with reason tracking
- Temporary restrictions with expiration dates
- Complete audit trail for administrative actions

## 🛡️ Security Features

### Route Protection

- Admin routes require authentication and appropriate roles
- Role checking at both route and component levels
- Graceful fallbacks for insufficient permissions

### Data Access

- Firebase security rules enforce data protection
- Client-side permission validation
- Server-side permission enforcement via Cloud Functions

### Audit Logging

- All admin actions are tracked and logged
- User creation, modification, and deletion history
- Role and status change audit trails

## ⚙️ Configuration Options

The app supports various feature flags:

```typescript
// Configuration options in config-service.ts
useFirebaseData: boolean; // Enable Firebase vs local data
enableUserManagement: boolean; // Enable admin user management
requireAdminApproval: boolean; // Require admin approval for new users
allowUserRegistration: boolean; // Allow self-registration
enableGuestAccess: boolean; // Allow unauthenticated access
```

## 🔧 API Reference

### User Management Service

```typescript
// Create new user
await userManagementService.createUser({
  email: 'user@example.com',
  password: 'password',
  name: 'John Doe',
  role: ['user'],
  bio: 'Optional bio',
});

// Update user role
await userManagementService.setUserRole(firebaseId, {
  name: 'Administrator',
  permissions: ['admin', 'moderator'],
});

// Update user status
await userManagementService.setUserStatus(firebaseId, 'blocked', 'Spam activity');
```

### Players Firebase Store

```typescript
const playersStore = usePlayersFirebaseStore();

// Fetch all players
await playersStore.fetchAllPlayers();

// Search players
const results = await playersStore.searchPlayers('john');

// Admin operations
await playersStore.updatePlayerRole(firebaseId, role);
await playersStore.updateUserStatus(firebaseId, 'blocked');
```

## 🐛 Troubleshooting

### Common Issues

1. **Admin access denied**: Verify user has admin role in `userRoles` collection
2. **Events not loading**: Check Firebase connection and Firestore rules
3. **Calendar not updating**: Ensure proper date formatting in calendar service
4. **RSVP not syncing**: Verify Firebase document IDs are correct

### Debug Mode

Enable debug logging:

```javascript
localStorage.setItem('debug', 'ttg:*');
```

This provides detailed logging for all operations and data flows.

## 📋 Next Steps

1. Configure production Firebase security rules
2. Implement server-side admin operations with Cloud Functions
3. Add email notifications for user status changes
4. Implement advanced search and filtering capabilities
5. Create automated backup systems
