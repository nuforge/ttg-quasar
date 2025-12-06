# GitHub Pages Environment Variables Setup

Quick reference guide for setting up environment variables (GitHub Secrets) for GitHub Pages deployment.

## Quick Setup Steps

1. **Go to Repository Settings**
   - Navigate to: `https://github.com/nuforge/ttg-quasar/settings/secrets/actions`

2. **Add Each Secret**
   - Click **"New repository secret"**
   - Enter the name (exactly as shown below)
   - Enter the value from your Firebase Console
   - Click **"Add secret"**

## Required Secrets

### Firebase Configuration

| Secret Name | Where to Find It |
|------------|------------------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps → Web app → apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings → Your apps → Web app → authDomain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → General → Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings → Your apps → Web app → storageBucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → Your apps → Web app → messagingSenderId |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings → Your apps → Web app → appId |

## Optional Secrets

| Secret Name | Description |
|------------|-------------|
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics Measurement ID (if using Analytics) |
| `SHARED_CALENDAR_ID` | Google Calendar ID (if using Google Calendar integration) |

## Finding Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **gear icon** (⚙️) → **Project settings**
4. Scroll down to **"Your apps"** section
5. If you don't have a web app yet:
   - Click **"Add app"** → **Web** (</> icon)
   - Register app name: "TTG Quasar" (or any name)
   - Click **Register app**
6. You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",           // → VITE_FIREBASE_API_KEY
  authDomain: "xxx.firebaseapp.com", // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "xxx",                // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "xxx.appspot.com", // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",   // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abc123"   // → VITE_FIREBASE_APP_ID
};
```

Copy each value to the corresponding GitHub Secret.

## Verification

After adding all secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see all the secrets listed
3. Push a commit to trigger the workflow
4. Check the **Actions** tab to verify the build succeeds

## Important Notes

- **Secret names are case-sensitive** - Use exact names as shown above
- **Values should not have quotes** - Just paste the raw value
- **Secrets are encrypted** - They're only visible during workflow execution
- **Update secrets** - If you change Firebase projects, update all secrets accordingly

## Troubleshooting

### Build Fails with "Firebase API Key is missing"

- Verify `VITE_FIREBASE_API_KEY` secret exists
- Check that the secret name is exactly `VITE_FIREBASE_API_KEY` (case-sensitive)
- Ensure the value was copied correctly (no extra spaces or quotes)

### Firebase Not Connecting

- Verify all 6 required Firebase secrets are set
- Check Firebase Console → Authentication → Settings → Authorized domains
- Ensure `nuforge.github.io` is in the authorized domains list

### Secrets Not Available in Workflow

- Verify secrets are in **Settings** → **Secrets and variables** → **Actions** (not "Variables")
- Check that the workflow file uses `${{ secrets.SECRET_NAME }}` syntax
- Ensure you're pushing to the correct branch (main/master)

