# Event Management & Firebase Integration Guide

This document provides a guide to the Firebase-based event management system that handles real-time event data and RSVP functionality.

## 🚀 Current Features

### ✨ Event Management System

- **� Real-time Firebase Integration**: Live event data from Firestore
- **� Interactive Calendar**: Click dates to view events with visual indicators
- **✅ Independent RSVP & Interest**: Separate toggleable states for event participation
- **� Multi-participant RSVPs**: Support for bringing multiple people
- **🎯 Event Filtering**: Filter by date, status, and participation
- **� Responsive Design**: Mobile-friendly event management

## Overview

The event management system provides:

1. **Real-time Event Data**: All events stored and synced via Firebase Firestore
2. **Interactive Calendar**: Visual calendar with event indicators and date selection
3. **RSVP Management**: Join/leave events with real-time updates
4. **Interest Tracking**: Express interest without committing to attend
5. **Event Discovery**: Browse upcoming events and filter by preferences

## Architecture

### Core Services

#### `events-firebase-store.ts`

- **Firebase Integration**: Real-time event data from Firestore with live synchronization
- **Fresh Data Operations**: All RSVP operations use latest store data to prevent stale state issues
- **Independent RSVP Logic**: Separate join, leave, and interest tracking with proper state management
- **Event Creation**: Create new events with Firebase persistence and validation
- **Error Handling**: Comprehensive error reporting and recovery mechanisms

## Key Pages and Components

### `EventPage.vue` - Individual Event Details

- **Real-time Event Loading**: Loads event data from Firebase with live updates
- **RSVP Interface**: Integration with EventRSVPButtons for user participation
- **Reactive Player Lists**: Confirmed and interested player lists update automatically when RSVP states change
- **Reactive Player Counts**: All count displays use computed properties that reactively update with store changes
- **Fresh Data Architecture**: All computed properties use fresh store data instead of potentially stale props
- **Event Comments**: Real-time messaging for event coordination

### `EventsPage.vue` - Event Listing and Management

- **Event Grid**: Displays all events with filtering and sorting capabilities
- **Real-time Updates**: Event cards update automatically as data changes
- **Search and Filter**: Find events by game, date, status, or player count
- **Navigation Integration**: Links to individual event pages

### `EventCard.vue` - Event Display Component

- **Visual Status Indicators**: Shows user's participation status with colored borders
- **Interactive Elements**: Calendar date selection and player list access
- **Game Integration**: Links to associated game pages
- **Compact Information**: Essential event details in card format

### `EventRSVPButtons.vue` - User Interaction Component

- **Independent Button States**: RSVP and Interest buttons work separately
- **Real-time State Reflection**: Buttons show current participation status immediately
- **Click Handler Debugging**: Enhanced logging for troubleshooting
- **Authentication Integration**: Secure operations with proper login checks

## Technical Implementation

### Firebase Real-time Updates

- **Firestore Subscriptions**: Live data synchronization across all users
- **Store Management**: Pinia stores maintain fresh event data
- **Reactive Components**: Vue computed properties reflect data changes instantly

### RSVP State Management

- **Fresh Data Lookups**: All operations check latest store data instead of stale props
- **Independent Toggles**: RSVP and Interest states work completely independently
- **Proper Error Handling**: Clear error messages and graceful failure recovery

### Calendar Integration

- **Date Selection**: Interactive calendar with proper date handling
- **Event Filtering**: Display events for selected dates in right drawer
- **Visual Indicators**: Calendar shows event availability and user participation

## Current System Status

### ✅ Firebase Integration Complete

All event management functionality is now powered by Firebase:

- **Real-time Data Synchronization**: Events sync automatically across all users
- **Live RSVP Updates**: Changes appear immediately without page refresh
- **Independent States**: RSVP and Interest work as separate toggleable states
- **Proper State Management**: Fixed stale data issues for reliable button functionality

### 🏗️ **Key Architecture Features**

- **Real-time Data**: Live updates from Firestore with instant synchronization
- **Authentication Integration**: Firebase Auth with Google OAuth and secure route guards
- **Offline Support**: Built-in Firestore offline capabilities for reliable access
- **Type Safety**: Full TypeScript support with strict type checking
- **Error Handling**: Comprehensive error states and graceful recovery

### 📈 **System Benefits**

- **Performance**: Real-time updates without manual refresh requirements
- **Scalability**: Cloud Firestore handles concurrent users efficiently
- **Security**: Built-in Firestore security rules and authentication
- **Reliability**: Automatic data synchronization and conflict resolution
- **Developer Experience**: Consistent API across all stores and components

## How to Use the System

### 1. Viewing Events

Navigate to `/events` to see all available events with:

- **Interactive Event Cards**: Click to view full event details
- **Real-time Status**: See current RSVP and interest counts
- **Search and Filter**: Find events by game, date, or status
- **Calendar Integration**: Click dates to filter events

### 2. RSVP Functionality

**RSVP (Confirmed Attendance)**:

- Click the calendar icon button to confirm attendance
- Green button indicates you're confirmed
- Counts toward the event's player limit
- Can be toggled on/off independently

**Interest (Maybe Attending)**:

- Click the star icon button to show interest
- Orange button indicates you're interested
- Does NOT count toward player limit
- Completely independent from RSVP state

### 3. Calendar Features

**Interactive Calendar** (`/events` page):

- **Date Selection**: Click any date to view events for that day
- **Visual Indicators**: Colored dots show events and your participation
- **Right Drawer**: Selected date events appear in the side panel
- **Navigation**: Click event titles to view full details

## Technical Details

### Fixed Issues

✅ **Stale Data Problem**: Fixed all RSVP operations to use fresh store data instead of stale props
✅ **Independent States**: RSVP and Interest buttons now work completely independently  
✅ **Calendar Navigation**: Fixed date selection and event filtering functionality
✅ **Event Propagation**: Added proper click handling to prevent duplicate operations
✅ **Firebase Integration**: All operations use proper Firebase document IDs

### Core Store Methods

- `joinEvent()`: Add confirmed RSVP using latest event data
- `leaveEvent()`: Remove confirmed RSVP using latest event data
- `toggleInterest()`: Toggle interest status using latest event data

## Data Structure

### Firebase Event Document

```typescript
{
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

  // RSVP tracking with independent states
  rsvps: Array<{
    playerId: number,
    status: 'confirmed' | 'interested',
    participants: number // 0 for interested, 1+ for confirmed
  }>,

  // Firebase metadata
  firebaseDocId: string, // Firebase document ID for operations
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Security & Permissions

### Firebase Security Rules

Events are protected by Firestore security rules in `firebase/firestore.rules`:

- **Public read access**: Anyone can view event listings
- **Authenticated write access**: Logged-in users can create events
- **RSVP permissions**: Users can only modify their own RSVPs
- **Host/admin permissions**: Special permissions for event updates

### Authentication Requirements

- **Google OAuth**: Primary authentication method
- **Facebook OAuth**: Alternative authentication option
- **Email/Password**: Fallback authentication method

## Troubleshooting

### Common Issues

1. **Buttons not responding**: Check browser console for Firebase connection errors
2. **RSVP state not updating**: Verify user is authenticated and has proper permissions
3. **Events not loading**: Check Firebase configuration and network connectivity
4. **Calendar not showing events**: Verify event data includes proper date formatting

### Debug Mode

Enable comprehensive logging:

```javascript
localStorage.setItem('debug', 'ttg:*');
```

This provides detailed logging for:

- Firebase operations and errors
- RSVP state changes and updates
- Calendar date selection and filtering
- Authentication status and user data

### Error Recovery

- **Network Issues**: App works offline with cached data, syncs when reconnected
- **Authentication Problems**: Clear authentication prompts guide users to re-login
- **Data Conflicts**: Firebase handles concurrent updates automatically

## Best Practices

### For Users

1. **Authentication**: Always log in before attempting to RSVP or show interest
2. **Network**: Ensure stable internet connection for real-time updates
3. **Browser**: Use modern browsers for best compatibility
4. **Mobile**: App is fully responsive and works on all device sizes

### For Developers

1. **Fresh Data**: Always use store data instead of props for current state
2. **Error Handling**: Implement comprehensive try-catch blocks for Firebase operations
3. **Type Safety**: Use TypeScript interfaces for all data structures
4. **Real-time Updates**: Subscribe to Firebase listeners for live data synchronization

---

## Recent Fixes Applied

### Critical Bug Fixes

✅ **Fixed Stale Data Issue**: All RSVP operations now use fresh store data instead of stale props
✅ **Independent RSVP States**: RSVP and Interest buttons work completely independently
✅ **Calendar Functionality**: Fixed date selection and event filtering
✅ **Event Navigation**: Proper routing and state management for event pages
✅ **Click Handling**: Added event propagation prevention for reliable button behavior

## This system now provides reliable, real-time event management with independent RSVP and Interest functionality.

## Development Notes

### Recent Critical Fixes

✅ **Fixed Stale Data Bug**: All RSVP operations (joinEvent, leaveEvent, toggleInterest) now use fresh store data instead of stale props  
✅ **Independent Button States**: RSVP and Interest buttons work completely independently without mutual interference  
✅ **Reactive Player Lists**: EventPage confirmed and interested player lists now update automatically when RSVP states change  
✅ **Reactive Player Counts**: All player count displays use reactive computed properties for real-time updates  
✅ **Calendar Integration**: Fixed date selection and event filtering functionality  
✅ **Event Navigation**: Proper routing and state management for event pages  
✅ **Click Event Handling**: Added proper event propagation prevention for reliable button behavior

### Firebase Collections

The system uses these Firestore collections:

- **`events`**: Core event documents with RSVP data
- **`games`**: Game catalog for event creation
- **`players`**: User profiles and authentication data
- **`messages`**: Event comments and discussion threads
- **`userRoles`**: Admin permissions and role management

### API Methods

**Events Store Methods**:

- `subscribeToEvents()`: Real-time Firebase listener
- `joinEvent(event)`: Add confirmed RSVP (uses fresh store data)
- `leaveEvent(event)`: Remove confirmed RSVP (uses fresh store data)
- `toggleInterest(event)`: Toggle interest status (uses fresh store data)
- `createEvent(eventData)`: Create new event with Firebase persistence

**Key Fix**: All methods now look up fresh event data from the store using `events.value.find(e => e.id === event.id)` instead of using potentially stale prop data.

---

_Last Updated: August 2025 - Post Stale Data Fix_  
_System Status: ✅ Fully Operational - Independent RSVP/Interest Functionality_
