# Event Migration & Google Calendar Integration

This document outlines the comprehensive event migration system that migrates event data from JSON files to Firebase and synchronizes with Google Calendar.

## Overview

The event migration system includes:

1. **Event Data Migration**: Migrate events from `src/assets/data/events.json` to Firebase Firestore
2. **Google Calendar Integration**: Sync events to Google Calendar with rich descriptions and deep links
3. **Migration Dashboard**: User-friendly interface for running and monitoring migrations
4. **Testing Tools**: Dry-run capabilities and validation tools

## Architecture

### Core Services

#### `EventMigrationService` (`src/services/event-migration-service.ts`)

- Handles migration from JSON to Firebase
- Manages Google Calendar synchronization
- Provides dry-run capabilities
- Creates rich calendar event descriptions with deep links

#### `DataMigrationService` (updated in `src/services/data-migration-service.ts`)

- Orchestrates full migration (players → events)
- Provides migration status checking
- Handles dependencies between data types

#### `GoogleCalendarService` (`src/services/google-calendar-service.ts`)

- Enhanced with better timezone handling
- Creates events with rich descriptions
- Supports reminders and attendee management

### UI Components

#### `EventMigrationDashboard` (`src/components/events/EventMigrationDashboard.vue`)

- Interactive migration interface
- Real-time progress tracking
- Error and warning reporting
- Configuration options for migration behavior

#### `MigrationPage` (`src/pages/MigrationPage.vue`)

- Admin page for data migration
- Accessible via `/admin/migration`

### Testing & Validation

#### `MigrationTestRunner` (`src/utils/migration-test-runner.ts`)

- Dry-run testing capabilities
- Data validation functions
- Preview calendar event generation
- Browser console utilities

## Usage

### 1. Access the Migration Dashboard

Navigate to `/admin/migration` (requires admin privileges) or use the "Event Migration" button on the Admin Dashboard.

### 2. Migration Options

- **App Base URL**: Set your domain for deep links in calendar events
- **Sync to Google Calendar**: Enable/disable calendar synchronization
- **Skip Existing**: Skip events that already exist in Firebase
- **Dry Run**: Preview migration without making changes

### 3. Migration Steps

#### Option A: Step-by-Step Migration

1. **Test Event Migration**: Run a dry-run to validate data
2. **Preview Calendar Events**: See what calendar events will be created
3. **Run Migration**: Execute the actual migration
4. **Sync to Calendar**: Sync existing Firebase events to Google Calendar

#### Option B: Full Migration

Click "Migrate All Data" to run players and events migration in sequence.

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

Use the MigrationTestRunner in browser console:

```javascript
// Test migration without making changes
MigrationTestRunner.testEventMigration();

// Preview calendar events
MigrationTestRunner.previewCalendarEvents(10);

// Test full migration workflow
MigrationTestRunner.testFullMigration();
```

#### Firebase Console

Monitor Firestore collections:

- `/events` - Migrated event documents
- Check document counts and structure

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
