# Google Calendar Integration Setup Guide

This guide walks through setting up Google Calendar API integration with Firebase Auth OAuth for TTG Quasar.

## Overview

The TTG Quasar app uses a **hybrid OAuth approach** for Google Calendar integration:

- **Real Google OAuth** for Calendar API access (bypasses Firebase emulator limitations)
- **Firebase emulator** for other development services (Auth, Firestore, Storage)
- **Automatic event synchronization** between TTG events and Google Calendar

## Architecture

### Key Components

1. **`google-calendar-service.ts`**: Handles Google Calendar API calls with real OAuth tokens
2. **`vuefire-auth-service.ts`**: Manages both emulator auth and real Google OAuth tokens
3. **`GoogleCalendarSettings.vue`**: Admin interface for calendar configuration
4. **`ttg-event-sync-service.ts`**: Handles bidirectional event synchronization

### OAuth Flow

```
Firebase Emulator (Dev Auth) → Real Google OAuth (Calendar API) → Google Calendar
```

## Prerequisites

- ✅ Google Calendar API enabled in Google Cloud Console
- ✅ Firebase project configured with Google Auth provider
- ✅ Environment variables configured
- ✅ OAuth 2.0 Client IDs configured for real Google OAuth

## Step 1: Google Cloud Console Configuration

### 1.1 Enable Google Calendar API ✅

The Google Calendar API is already enabled in your project.

### 1.2 Configure OAuth 2.0 Client IDs ✅

OAuth client is already configured with:

- **Development origins**: `http://localhost:9000`
- **Calendar API scopes**: `https://www.googleapis.com/auth/calendar`
- **Real OAuth bypass**: Separate Firebase app instance for production OAuth

### 1.3 API Key Configuration ✅

API key is configured but **not used** - OAuth tokens are required for Calendar API access.

## Step 2: Development Environment Setup ✅

### 2.1 Environment Variables (`.env`) ✅

Your `.env` file is already configured with:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=ttgaming-dd3c0
USE_FIREBASE_EMULATOR=true

# Google Calendar Configuration
SHARED_CALENDAR_ID=cf4f155a3c69597b84acfb7ac13cda167375de8bf6c83f34da2f9de64684867e@group.calendar.google.com
```

### 2.2 Firebase Configuration ✅

- **Firebase Auth** configured with Google provider
- **Calendar scopes** included in Firebase Auth provider: `https://www.googleapis.com/auth/calendar`
- **Real OAuth bypass** implemented for Calendar API access

## Step 3: Implementation Details ✅

### 3.1 Hybrid OAuth Architecture

The implementation uses a dual-authentication approach:

**Emulator Auth** (for TTG development):

```typescript
// Uses Firebase emulator for TTG authentication
const auth = getAuth(app); // Connected to emulator
```

**Real Google OAuth** (for Calendar API):

```typescript
// Bypasses emulator for real Google OAuth tokens
const realAuth = initializeApp(firebaseConfig, 'realAuth');
const result = await signInWithPopup(realAuth, googleProvider);
```

### 3.2 Service Integration ✅

**`google-calendar-service.ts`**:

- Detects emulator mode automatically
- Falls back to real OAuth when emulator tokens fail
- Handles Calendar API CRUD operations with proper error handling

**`vuefire-auth-service.ts`**:

- Maintains both emulator and real auth instances
- Provides `getRealGoogleOAuthToken()` for Calendar API
- Manages token storage and refresh

### 3.3 Admin Interface ✅

**`GoogleCalendarSettings.vue`**:

- Tests Calendar connection and permissions
- Lists available Google calendars for selection
- Configures sync modes (Manual vs Auto)
- Handles authentication flow with proper error messaging
  // Automatically configured from environment variables
  const API_KEY = process.env.FIREBASE_API_KEY; // Same as Firebase API key
  const CLIENT_ID = process.env.GOOGLE_CLOUD_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLOUD_SECRET;

```

### 3.2 OAuth Flow Implementation

The application will need to implement proper OAuth flow:

1. User clicks "Connect Google Calendar"
## Step 4: Usage and Testing ✅

### 4.1 Admin Configuration

1. Navigate to `http://localhost:9000/admin`
2. Go to "Google Calendar Integration" section
3. Click "Test Connection" - triggers real OAuth flow
4. Select target calendar from dropdown (6 calendars found)
5. Choose sync mode (Manual or Auto)
6. Click "Save" to persist configuration

### 4.2 Event Synchronization ✅

**Manual Sync**:
- Click "Sync All Events" button
- Result: ✅ 9 TTG events successfully synced to Google Calendar
- Timestamp: 9/2/2025, 6:09:15 PM

**Auto Sync** (when enabled):
- New TTG events automatically create Google Calendar events
- TTG event updates sync to Google Calendar in real-time
- TTG event deletions remove corresponding Google Calendar events

### 4.3 Sync Status Tracking

- **Last Sync Results**: Shows success/failure count and timestamp
- **Connection Status**: Real-time authentication and permission status
- **Calendar Selection**: Dropdown populated with actual user calendars
- **Error Handling**: Specific messages for auth and scope errors

## Step 5: Production Deployment

### 5.1 Environment Variables

Production will use the same hybrid approach:
- Firebase Auth for TTG authentication
- Real Google OAuth for Calendar API (no emulator)
- Same OAuth client IDs and Calendar configuration

### 5.2 Deployment Considerations

- OAuth client origins must include production domain
- All environment variables must be available in production
- Real Google OAuth works identically in production (no emulator bypass needed)

## Architecture Benefits ✅

### Emulator Development + Real Calendar API

1. **Clean Development**: Firebase emulator isolates development data
2. **Real Calendar Access**: Actual Google Calendar API integration during development
3. **No Mocking Required**: Real OAuth flow and Calendar operations
4. **Production Parity**: Same OAuth flow works in both environments

### Error Handling

- **`GOOGLE_AUTH_REQUIRED`**: Prompts for Google sign-in
- **`GOOGLE_CALENDAR_SCOPE_REQUIRED`**: Prompts for Calendar permissions
- **Token Refresh**: Automatic fallback to real OAuth when emulator tokens expire
- **Connection Testing**: Validates authentication before attempting sync operations

## Troubleshooting ✅

### Resolved Issues

1. **Firebase Emulator Limitation**: ✅ Solved with real OAuth bypass
2. **API Key Restrictions**: ✅ Bypassed by using OAuth tokens exclusively
3. **Cross-Origin Policy Warnings**: ✅ Normal OAuth popup behavior
4. **Token Management**: ✅ Automatic refresh and real token acquisition
5. **Calendar Permissions**: ✅ Proper scope handling and user consent flow

### Current Status

- ✅ **Authentication**: Real Google OAuth working
- ✅ **Calendar Access**: 6 calendars retrieved successfully
- ✅ **Event Sync**: 9 events synced to `nuforge@gmail.com` calendar
- ✅ **Admin Interface**: Full configuration and testing capabilities
- ✅ **Error Handling**: Comprehensive error messages and recovery flows

## Next Steps

1. **Enable Auto Sync**: Switch from Manual to Auto mode for real-time synchronization
2. **Production Testing**: Deploy and verify production Calendar integration
3. **Documentation**: Keep this guide updated with any production-specific considerations

Make sure environment variables are:

- ✅ Added to `.env` file for development
- ✅ Set in Firebase config for production
- ✅ Properly typed in `src/env.d.ts`
- ✅ Used consistently in service files
```
