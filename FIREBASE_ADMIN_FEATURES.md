# Firebase Integration & Admin Features

This document outlines the Firebase integration and admin features that have been added to the TTG Quasar application.

## Overview

The application has been refactored to support Firebase authentication and live data instead of hardcoded JSON files. The system maintains backward compatibility with the existing data structure while providing enhanced user management capabilities.

## Key Features

### 🔐 Firebase Authentication

- Email/password authentication
- Google OAuth integration
- Facebook OAuth integration
- User profile management
- Session management
- **TypeScript-first authentication guards**

### 👥 User Management System

- Firebase-based user storage with **strict typing**
- Role-based access control
- User status management (active, blocked, suspended)
- Admin controls for user moderation
- **Type-safe user operations**

### 🛡️ Admin Panel

- Comprehensive admin dashboard
- User management interface with **proper TypeScript interfaces**
- Role and permission assignment
- System monitoring and statistics
- Bulk operations for user management
- **Readonly store object compatibility**

### 📊 Data Management

- Migration from JSON to Firebase
- Live data synchronization
- Backward compatibility with existing data
- Audit logging for admin actions
- **Strict TypeScript validation throughout**

## File Structure

### New Pages

- `src/pages/AdminDashboard.vue` - Main admin dashboard
- `src/pages/AdminUsers.vue` - User management interface
- `src/pages/AdminSetup.vue` - First-time admin setup

### New Services

- `src/services/user-management-service.ts` - Core user management operations
- `src/services/data-migration-service.ts` - Data migration utilities
- `src/services/config-service.ts` - Application configuration management

### New Stores

- `src/stores/players-firebase-store.ts` - Firebase-based player data management

### Updated Components

- `src/layouts/MainLayout.vue` - Added admin navigation
- `src/composables/useAuthGuard.ts` - Enhanced with admin role checking and **strict typing**
- `src/models/Player.ts` - Extended for Firebase compatibility with **TypeScript interfaces**
- `src/stores/players-store.ts` - Updated to support Firebase integration
- `src/components/PlayerAvatar.vue` - **Readonly-compatible PlayerLike interface**
- `src/components/players/PlayerCard.vue` - **TypeScript-safe player handling**
- `src/components/players/PlayerDetails.vue` - **Proper type definitions**
- `src/pages/AdminUsers.vue` - **ReadonlyPlayerWithFirebase type integration**
- `src/pages/PlayersPage.vue` - **Eliminated any type usage**

### TypeScript Improvements

- **ReadonlyPlayerWithFirebase Type**: Handles readonly store objects with Firebase fields
- **PlayerLike Interface**: Flexible component interface supporting readonly properties
- **Strict ESLint Configuration**: Eliminates `any` type usage across the codebase
- **Type-Safe Firebase Operations**: Proper typing for Firestore operations
- **Component Prop Validation**: Strongly typed component interfaces

## Setup Instructions

### 1. Initial Admin Setup

1. Navigate to `/admin/setup`
2. Create the first administrator account
3. The system will automatically assign admin privileges

### 2. Data Migration

1. Go to Admin Dashboard (`/admin`)
2. Use the data migration tools to import existing JSON data
3. Monitor migration progress and handle any errors

### 3. User Management

1. Access the Users section from the admin menu
2. Manage user roles, permissions, and status
3. Use bulk operations for efficient user management

## Admin Permissions

The system uses a role-based permission system:

### Permission Levels

- `admin` - Full system access
- `moderator` - User management and content moderation
- `organizer` - Event creation and management
- `user` - Standard user access

### Role Assignment

Admins can assign multiple roles to users:

- Roles are stored in the `userRoles` Firestore collection
- Each user can have multiple permissions
- Role changes are logged for audit purposes

## User Status Management

### Status Types

- `active` - Normal user access
- `blocked` - Access denied with reason
- `suspended` - Temporary access restriction
- `pending` - Awaiting approval

### Status Operations

- Bulk status updates
- Temporary restrictions with expiration
- Reason tracking for all status changes
- Audit trail for administrative actions

## Security Features

### Route Protection

- Admin routes require authentication and admin role
- Role checking happens at route level and component level
- Graceful fallbacks for insufficient permissions

### Data Access

- Firebase security rules (to be configured)
- Client-side permission validation
- Server-side permission enforcement

### Audit Logging

- All admin actions are logged
- User creation, modification, and deletion tracking
- Role and status change history
- Searchable audit trails

## Configuration Options

The app supports various configuration options:

```typescript
// Feature flags in config-service.ts
useFirebaseData: boolean; // Enable Firebase vs local data
enableUserManagement: boolean; // Enable admin user management
requireAdminApproval: boolean; // Require admin approval for new users
allowUserRegistration: boolean; // Allow self-registration
enableGuestAccess: boolean; // Allow unauthenticated access
```

## API Reference

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

// Admin operations (if user has admin privileges)
await playersStore.updatePlayerRole(firebaseId, role);
await playersStore.updateUserStatus(firebaseId, 'blocked');
await playersStore.deleteUser(firebaseId);
```

## Migration Notes

### Backward Compatibility

- Existing components continue to work with local data
- Firebase integration can be enabled/disabled via configuration
- Gradual migration path from JSON to Firebase

### Data Mapping

- Legacy player IDs are preserved
- Firebase document IDs are separate from display IDs
- Migration maintains referential integrity

### Error Handling

- Graceful degradation when Firebase is unavailable
- Fallback to local data for read operations
- User-friendly error messages for admin operations

## Next Steps

1. Configure Firebase security rules
2. Implement server-side admin operations (Cloud Functions)
3. Add email notifications for user status changes
4. Implement advanced search and filtering
5. Add data export capabilities
6. Create automated backup systems

## Troubleshooting

### Common Issues

1. **Admin access denied**: Ensure user has admin role in `userRoles` collection
2. **Migration failures**: Check Firebase connection and permissions
3. **Route redirects**: Verify auth guards and role requirements
4. **Data not loading**: Check Firebase configuration and network connectivity

### Debug Mode

Enable debug logging by setting:

```javascript
localStorage.setItem('debug', 'ttg:*');
```

This will provide detailed logging for all admin operations and data flows.
