# Firebase Setup Guide for TTG Quasar

This guide will help you set up Firebase integration for your Tabletop Gaming application.

## Prerequisites

1. Node.js and npm installed
2. Firebase CLI installed globally: `npm install -g firebase-tools`
3. A Google account

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "ttg-tabletop-gaming")
4. Enable Google Analytics (optional)
5. Create the project

## Step 2: Enable Authentication

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable the following providers:
   - **Google**: Click Google > Enable > Configure (add your domain)
   - **Facebook**: Click Facebook > Enable > Add App ID and App Secret
   - **Email/Password**: Enable for fallback authentication

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to APIs & Services > Credentials
4. Add authorized domains:
   - `localhost` (for development)
   - Your production domain
5. Add authorized redirect URIs:
   - `http://localhost:9000` (for development)
   - Your production URL

### Facebook OAuth Setup (Optional)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app or use existing
3. Go to Facebook Login > Settings
4. Add Valid OAuth Redirect URIs:
   - `https://your-project-id.firebaseapp.com/__/auth/handler`

## Step 3: Enable Firestore Database

1. Go to Firestore Database
2. Click "Create database"
3. Start in **test mode** (we'll add security rules later)
4. Choose a location (closest to your users)

## Step 4: Enable Storage

1. Go to Storage
2. Click "Get started"
3. Start in **test mode**
4. Use the same location as Firestore

## Step 5: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" > Web app
4. Register the app with name "TTG Quasar"
5. Copy the configuration object

## Step 6: Environment Setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase configuration in `.env`:
   ```env
   FIREBASE_API_KEY=your-api-key-here
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789012
   FIREBASE_APP_ID=1:123456789012:web:abc123def456
   ```

## Step 7: Firebase CLI Setup

1. Login to Firebase:

   ```bash
   firebase login
   ```

2. Initialize Firebase in your project:

   ```bash
   firebase use your-project-id
   ```

3. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

## Step 8: Development with Emulators (Recommended)

1. Start Firebase emulators:

   ```bash
   firebase emulators:start
   ```

2. In another terminal, start your Quasar app:

   ```bash
   npm run dev
   ```

3. Access emulator UI at: http://localhost:4000

## Step 9: Google Calendar API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Calendar API:
   - Go to APIs & Services > Library
   - Search for "Google Calendar API"
   - Click and Enable
3. No additional setup needed - the Firebase Auth token will work

## Security Rules

The project includes production-ready security rules for:

- **Firestore**: Users can only modify their own data
- **Storage**: Profile pictures and event photos with size limits

## Production Deployment

1. Build the app:

   ```bash
   quasar build
   ```

2. Deploy to Firebase Hosting (optional):
   ```bash
   firebase deploy --only hosting
   ```

## Features Enabled

After setup, you'll have:

✅ **Authentication**: Google, Facebook, and Email sign-in
✅ **Real-time Events**: Create, join, and sync with Google Calendar
✅ **Real-time Messaging**: Game comments and event discussions
✅ **Profile Management**: Player profiles with photo uploads
✅ **Game Preferences**: User favorites, bookmarks, and notifications
✅ **Event Notifications**: Customizable game event alerts and reminders
✅ **Security**: Production-ready security rules
✅ **Offline Support**: Works offline with local caching

## Firebase Collections

The application uses the following Firestore collections:

### Core Collections

- **games**: Game library with metadata and images
- **events**: Gaming events with RSVP and calendar sync
- **players**: User profiles and player information
- **messages**: Real-time messaging for games and events

### User Preferences System

- **userPreferences**: User game favorites, bookmarks, and notification settings
- **gameEventNotifications**: Event notifications and reminders for users

### Admin Collections

- **userRoles**: Role-based access control (admin permissions)
- **userStatuses**: User account status tracking
- **gameSubmissions**: User-submitted games pending approval
- **eventSubmissions**: User-submitted events pending approval

## Troubleshooting

### Authentication Issues

- Check that your domain is added to authorized origins
- Verify OAuth redirect URIs are correct

### Firestore Permission Errors

- Check that security rules are deployed
- Verify user is authenticated before writes

### Calendar API Issues

- Ensure Google Calendar API is enabled
- Check that calendar scope is included in auth

### Emulator Connection Issues

- Make sure emulators are running
- Check ports aren't blocked by firewall

## Support

If you encounter issues:

1. Check Firebase Console for error logs
2. Check browser console for client-side errors
3. Verify all APIs are enabled in Google Cloud Console
4. Check that environment variables are set correctly
