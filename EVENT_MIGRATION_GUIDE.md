# Event Migration & Google Calendar Integration Guide

This document provides a complete guide to the advanced event migration system that migrates event data from JSON files to Firebase and synchronizes with Google Calendar, featuring automatic authentication and custom calendar selection.

## 🚀 Recent Enhancements

### ✨ New Features (Latest Update)

- **🗓️ Custom Calendar Selection**: Choose specific Google Calendars for event migration
- **🔄 Auto-Authentication**: Seamless Google Calendar access without manual re-authentication
- **⚡ Proactive Token Refresh**: Automatic token renewal 15 minutes before expiration
- **📊 Enhanced Migration Dashboard**: Real-time calendar loading and selection
- **🎯 Targeted Calendar Migration**: Override default primary calendar selection
- **🔐 Background Token Management**: 2-minute interval monitoring for optimal performance

## Overview

The event migration system provides enterprise-level data migration with:

1. **Event Data Migration**: Migrate events from `src/assets/data/events.json` to Firebase Firestore
2. **Smart Google Calendar Sync**: Auto-sync to selected calendars with rich event details
3. **Interactive Migration Dashboard**: User-friendly interface with real-time progress tracking
4. **Advanced Authentication**: Eliminates repetitive Google sign-in requirements
5. **Testing & Validation Tools**: Dry-run capabilities and comprehensive error reporting

## Architecture

### Enhanced Services (Updated)

#### `EventMigrationService` (`src/services/event-migration-service.ts`)

- **Firebase Integration**: Seamless migration from JSON to Firestore
- **Google Calendar Sync**: Advanced calendar integration with custom targeting
- **Dry-Run Capabilities**: Safe testing before actual migration
- **Rich Event Descriptions**: Deep links, RSVP instructions, and comprehensive details
- **Error Handling**: Comprehensive error reporting and recovery

#### `GoogleCalendarService` (`src/services/google-calendar-service.ts`) ⚡ **Enhanced**

- **Calendar Selection**: Override default calendar with `setCalendarId()`
- **Auto-Authentication**: Seamless token refresh without user intervention
- **Enhanced Timezone Handling**: Proper event scheduling across timezones
- **CRUD Operations**: Full create, read, update, delete capabilities
- **Token Management**: Proactive refresh and error recovery

#### `VueFireAuthService` (`src/services/vuefire-auth-service.ts`) 🆕 **Major Update**

- **Auto-Token Refresh**: Background monitoring every 2 minutes
- **Proactive Renewal**: Refresh tokens 15 minutes before expiration
- **Popup Re-authentication**: Seamless Google token renewal
- **Token Persistence**: Cross-session token management
- **Error Recovery**: Graceful handling of authentication failures

#### `DataMigrationService` (updated in `src/services/data-migration-service.ts`)

- Orchestrates complete migration workflow (players → events)
- **Enhanced Status Tracking**: Real-time migration progress
- **Dependency Management**: Handles inter-data relationships
- **Batch Operations**: Efficient bulk data processing

### UI Components

#### `EventMigrationDashboard` (`src/components/events/EventMigrationDashboard.vue`) ⚡ **Enhanced**

- **Calendar Selection Dropdown**: Choose target Google Calendar from available options
- **Real-time Calendar Loading**: Automatic loading of user's Google Calendars
- **Interactive Migration Interface**: Comprehensive controls and options
- **Live Progress Tracking**: Real-time status updates and error reporting
- **Migration Options**:
  - Custom target calendar selection
  - Sync to Google Calendar toggle
  - Skip existing events option
  - Dry-run mode for testing
  - Configurable app base URL for deep links

#### `MigrationPage` (`src/pages/MigrationPage.vue`)

- **Admin Access**: Secure page accessible via `/admin/migration`
- **Role-Based Security**: Requires admin authentication
- **Dashboard Integration**: Embeds the EventMigrationDashboard component

### 🗓️ Calendar Selection Feature

The migration system now supports selecting specific Google Calendars:

1. **Automatic Loading**: Calendars load when dropdown is focused
2. **Visual Selection**: Calendar names with IDs and primary calendar badges
3. **Default Configuration**: Pre-configured with your specified calendar
4. **Error Handling**: User-friendly messages if calendars can't be loaded

**Default Calendar ID**: `cf4f155a3c69597b84acfb7ac13cda167375de8bf6c83f34da2f9de64684867e@group.calendar.google.com`

### Testing & Validation

✅ **Production Ready**: All testing utilities have been removed for security. The migration system is accessible through the admin dashboard at `/admin/migration`.

### 🔥 Firebase Store Migration

The application has **completed migration** from legacy local stores to Firebase-based real-time stores:

#### ✅ **Migrated Pages** (Firebase)

- `EventPage.vue` - Individual event display
- `PlayersPage.vue` - Player listing and management
- `GamePage.vue` - Game details page
- `GamePageFirebase.vue` - Firebase-enabled game page
- `App.vue` - Application initialization

#### ✅ **Migrated Components** (Firebase)

- `EventCard.vue` - Event display cards
- `EventCardMini.vue` - Compact event cards

#### 🔄 **Pending Migration** (Still using Legacy Stores)

- `MessagesPage.vue` - Complex messaging interface (requires enhanced Firebase store methods)
- Messaging components (`MessageList.vue`, `MessageItem.vue`, `MessageComposer.vue`, `ConversationList.vue`)

> **Note**: MessagesPage.vue was temporarily reverted to legacy stores due to missing conversation management methods in the Firebase messaging store. Migration requires implementing methods like `getConversationWith()`, `markConversationAsRead()`, `conversations` computed property, etc.

#### 🏗️ **Firebase Store Features**

- **Real-time Data**: Live updates from Firestore
- **Authentication Integration**: Firebase Auth with Google OAuth
- **Offline Support**: Built-in Firestore offline capabilities
- **Type Safety**: Full TypeScript support
- **Error Handling**: Comprehensive error states and recovery

#### 📈 **Migration Benefits**

- **Performance**: Real-time updates without manual refresh
- **Scalability**: Cloud Firestore handles concurrent users
- **Security**: Built-in Firestore security rules
- **Reliability**: Automatic data synchronization
- **Developer Experience**: Consistent API across all stores

## Usage

### 1. Access the Migration Dashboard

Navigate to `/admin/migration` (requires admin privileges) or use the "Event Migration" button on the Admin Dashboard.

### 2. Migration Options

## 📋 Complete Migration Guide

### Step 1: Access the Migration Dashboard

1. **Navigate to Admin**: Go to `/admin` or click Admin menu in header
2. **Access Migration**: Click "Event Migration" button or go to `/admin/migration`
3. **Admin Authentication**: Ensure you have admin privileges

### Step 2: Configure Google Calendar (New!)

1. **Sign in with Google**: If not already authenticated, sign in to enable calendar access
2. **Select Target Calendar**:
   - Click on "Target Google Calendar" dropdown
   - System automatically loads your available calendars
   - Choose your desired target calendar (pre-set to your specified calendar)
   - Calendar names display with IDs and primary calendar badges

### Step 3: Configure Migration Options

- **App Base URL**: Set your domain for deep links in calendar events (e.g., `https://your-domain.com`)
- **Target Google Calendar**: Selected calendar from Step 2
- **Sync to Google Calendar**: Enable/disable calendar synchronization
- **Skip Existing**: Skip events that already exist in Firebase
- **Dry Run**: Preview migration without making changes

### Step 4: Migration Execution Options

#### Option A: Step-by-Step Migration (Recommended)

1. **Dry Run First**: Enable "Dry run" mode and click "Migrate Events Only"
2. **Review Results**: Check migration preview and any warnings/errors
3. **Actual Migration**: Disable dry run and click "Migrate Events Only"
4. **Monitor Progress**: Watch real-time progress tracking
5. **Verify Results**: Check Firebase and Google Calendar for migrated events

#### Option B: Full Migration

- Click "Migrate All Data" to run players and events migration in sequence
- Automatically sets the target calendar and syncs all events

#### Option C: Calendar Sync Only

- Click "Sync to Calendar" to sync existing Firebase events to Google Calendar
- Uses the selected target calendar

### Step 5: Auto-Authentication Benefits (New!)

The enhanced system provides:

- **No Re-authentication**: Google Calendar access persists across browser sessions
- **Automatic Refresh**: Tokens refresh 15 minutes before expiration
- **Background Monitoring**: System checks every 2 minutes for token validity
- **Seamless Experience**: Migration runs without authentication interruptions

### 4. Testing Dashboard Integration

The migration tools are also integrated into the Testing Dashboard (`/testing`) with additional testing capabilities:

- Connectivity testing
- API validation
- Console utilities

## Google Calendar Integration Features

### Rich Event Descriptions

Calendar events include:

- 🎮 Event title and game information
- 📝 Event description
- 📍 Location details
- 👥 Player count and limits
- 🎯 Host information
- 🔗 Deep link to event page in your app
- 📱 Instructions for RSVP management

### Deep Links

Events include deep links in the format: `https://your-domain.com/events/{eventId}`

### Reminders

Automatic reminders:

- Email: 24 hours before event
- Popup: 1 hour before event

### Timezone Handling

Uses system timezone for proper event scheduling.

## Data Structure

### Firebase Event Document

```typescript
{
  // Legacy compatibility
  legacyId: number,
  migratedFrom: 'json',

  // Core event data
  gameId: number,
  title: string,
  date: string, // YYYY-MM-DD
  time: string, // HH:MM
  endTime: string, // HH:MM
  location: string,
  status: 'upcoming' | 'completed' | 'cancelled',
  minPlayers: number,
  maxPlayers: number,
  currentPlayers: number,
  description: string,
  notes: string,

  // Host information
  host: {
    name: string,
    email: string,
    phone: string,
    playerId?: number
  },

  // RSVP tracking
  rsvps: Array<{
    playerId: number,
    status: 'confirmed' | 'waiting' | 'cancelled',
    participants: number
  }>,

  // Firebase metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  googleCalendarEventId?: string
}
```

## Security & Permissions

### Firebase Security Rules

Events are protected by Firestore security rules in `firebase/firestore.rules`:

- Public read access for event listings
- Authenticated write access for event creation
- Host/admin permissions for event updates

### Google Calendar Permissions

Requires Google OAuth with Calendar scope:

- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

## Configuration

### Environment Variables

Update your `.env` file:

```env
# Google Calendar (optional shared calendar)
SHARED_CALENDAR_ENABLED=false
SHARED_CALENDAR_ID=your-shared-calendar@group.calendar.google.com
```

### App Base URL

Update the `appBaseUrl` in migration options or service defaults to your actual domain for proper deep links.

## Error Handling

### Migration Errors

- **Data Validation**: Invalid dates, times, or missing fields
- **Firebase Errors**: Network issues, permission problems
- **Calendar Sync Errors**: OAuth token expired, calendar access denied

### Graceful Degradation

- Events migrate to Firebase even if calendar sync fails
- Warnings are logged for calendar sync issues
- Existing events are skipped (configurable)

## Monitoring & Logging

### Migration Results

Each migration provides detailed results:

- Total events processed
- Successful migrations
- Skipped events (already exist)
- Calendar sync count
- Errors and warnings with details

### Activity Logging

The Testing Dashboard provides real-time activity logging for all operations.

## Best Practices

### Before Migration

1. **Backup Data**: Ensure your JSON data is backed up
2. **Test Authentication**: Verify Google OAuth is working
3. **Validate Data**: Run dry-run migration first
4. **Check Permissions**: Ensure proper Firebase and Calendar permissions

### During Migration

1. **Monitor Progress**: Watch for errors and warnings
2. **Don't Interrupt**: Allow migration to complete fully
3. **Check Results**: Review migration summary

### After Migration

1. **Verify Data**: Check Firebase console and calendar
2. **Test Deep Links**: Ensure event URLs work correctly
3. **Update App Logic**: Switch from JSON to Firebase data sources

## Troubleshooting

### Common Issues

#### "Google Calendar access token is expired"

- Re-authenticate with Google in the Testing Dashboard
- Check OAuth scope permissions

#### "Calendar not found"

- Verify `SHARED_CALENDAR_ID` in environment variables
- Check calendar sharing permissions

#### "Event already exists, skipping"

- This is normal behavior with `skipExisting: true`
- Use `skipExisting: false` to force re-migration

#### Migration fails with Firebase errors

- Check internet connection
- Verify Firebase configuration
- Check Firestore security rules

### Debug Tools

#### Browser Console

## Testing & Validation (Production)

### Admin Migration Dashboard

Access the migration tools through the admin panel:

1. **Navigate to**: `/admin/migration`
2. **Use the Interactive Dashboard**: Real-time migration with progress tracking
3. **Google Calendar Sync**: Select target calendars and migrate events
4. **Dry Run Mode**: Test migrations before applying changes

#### Firebase Console

Monitor Firestore collections:

- `/events` - Migrated event documents
- `/userRoles` - Admin permissions
- Check document counts and structure

## 🔧 Troubleshooting Guide

### Google Calendar Issues (New!)

#### "Google Calendar access token is expired" Error

- **Solution**: This should no longer occur with auto-refresh enabled
- **Manual Fix**: Refresh the page - system will automatically re-authenticate
- **Prevention**: Auto-refresh runs every 2 minutes with 15-minute proactive renewal

#### "Failed to load Google Calendars" Error

- **Check**: Google OAuth is properly configured in Firebase
- **Verify**: User is signed in with Google (not just email/password)
- **Fix**: Sign out and sign back in with Google to refresh permissions

#### Calendar Events Not Appearing

- **Check**: Selected target calendar ID is correct
- **Verify**: Calendar permissions allow event creation
- **Solution**: Try using primary calendar first, then switch to target calendar

### Authentication Issues

#### Admin Access Denied

- **Check**: User has admin role in `userRoles` Firestore collection
- **Temporary**: Visit `/admin/setup` for development mode override
- **Fix**: Ensure proper admin permissions are configured

#### Token Refresh Failures

- **Auto-Recovery**: System attempts automatic re-authentication
- **Manual Fix**: Sign out and sign back in
- **Prevention**: Enhanced error handling and retry logic now active

### Migration Issues

#### Events Not Migrating

- **Check**: Source file `src/assets/data/events.json` exists and is valid
- **Verify**: Firebase connection and Firestore rules allow admin writes
- **Debug**: Use dry-run mode to identify issues without making changes

#### Calendar Sync Failures

- **Solution**: New auto-authentication should prevent most sync failures
- **Fallback**: Use "Sync to Calendar" button to retry just the calendar portion
- **Debug**: Check browser console for detailed error messages

### Performance Issues

#### Slow Calendar Loading

- **New Feature**: Calendars cache after first load
- **Improvement**: Enhanced error handling prevents repeated failed requests
- **Optimization**: Background token monitoring reduces authentication delays

## 🎯 Next Steps & Future Enhancements

### Planned Features

- **Bulk Calendar Operations**: Mass event updates and deletions
- **Advanced Filtering**: Migrate only specific event types or date ranges
- **Backup & Restore**: Automated backup before major migrations
- **Conflict Resolution**: Handle duplicate events more intelligently

### Migration Best Practices

1. **Always test first**: Use dry-run mode before actual migration
2. **Verify calendar selection**: Ensure target calendar is correct
3. **Monitor progress**: Watch real-time feedback during migration
4. **Check results**: Verify both Firebase and Google Calendar after migration
5. **Use auto-authentication**: Let the system handle token refresh automatically

#### Google Calendar

Verify events appear in the target calendar with:

- Correct titles and descriptions
- Proper timezone
- Deep links working

## Migration Rollback

If you need to rollback:

1. **Delete Firebase Events**:

   ```javascript
   // In browser console (admin only)
   // This would need to be implemented if needed
   ```

2. **Remove Calendar Events**:
   - Manually delete from Google Calendar, or
   - Use bulk delete tools if many events

3. **Restore JSON Usage**:
   - Switch stores back to local data mode
   - Redeploy without Firebase migration

## Future Enhancements

- Incremental sync for new events
- Bidirectional sync (calendar → Firebase)
- Batch operations for large datasets
- Migration scheduling and automation
- Advanced conflict resolution
