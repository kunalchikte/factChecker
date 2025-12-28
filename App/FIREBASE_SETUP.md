# Firebase Setup Guide

Follow these steps to set up Firebase Authentication for FactCheckAI.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "FactCheckAI")
4. Disable Google Analytics (optional) and click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project, click the web icon (`</>`) to add a web app
2. Enter an app nickname (e.g., "FactCheckAI Web")
3. Click "Register app"
4. Copy the `firebaseConfig` object - you'll need these values

## Step 3: Enable Authentication Providers

### Google Sign-In:
1. Go to **Authentication** > **Sign-in method**
2. Click on **Google**
3. Toggle **Enable**
4. Select a support email
5. Click **Save**

### Apple Sign-In:
1. Go to **Authentication** > **Sign-in method**
2. Click on **Apple**
3. Toggle **Enable**
4. You'll need:
   - Apple Developer Account
   - Services ID
   - Apple Team ID
   - Private Key

For Apple Sign-In detailed setup, see: https://firebase.google.com/docs/auth/web/apple

## Step 4: Add Authorized Domains

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Add your production domain (e.g., `factcheck-ai.vercel.app`)
3. `localhost` is already added by default for development

## Step 5: Create Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

Replace the values with your actual Firebase config.

## Step 6: For Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add all the `NEXT_PUBLIC_FIREBASE_*` variables with your production values

## Troubleshooting

### "auth/popup-closed-by-user"
- User closed the popup before completing sign-in
- This is normal behavior, not an error

### "auth/unauthorized-domain"
- Add your domain to Firebase Console > Authentication > Settings > Authorized domains

### Apple Sign-In not working
- Ensure you have a valid Apple Developer account ($99/year)
- Follow Apple's requirements for Sign in with Apple
- Configure Services ID correctly in Apple Developer Console

## Testing Locally

1. Run `npm run dev`
2. Click "Analyze" with a YouTube URL
3. After analysis, the login popup should appear
4. Test both Google and Apple sign-in
5. Check that user avatar appears in header after login

