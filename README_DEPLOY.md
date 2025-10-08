KelulutApp — Deploy & Publish Guide
Generated: 2025-10-06T10:38:44.282513 UTC

Goal: Host as a PWA with Firebase multi-device sync and optionally convert to APK via webintoapk.com.

1) Firebase setup
- Go to https://console.firebase.google.com and create a project.
- Add a Web app and copy the config. Paste into js/firebase-config.js (replace REPLACE_ME).
- Under Authentication → Sign-in method enable Google (and Email if you want).
- Under Firestore Database create database (start in test mode for initial testing; secure rules later).

2) Prepare icons
- Replace icons/icon-192.png and icons/icon-512.png with real PNG files (192x192 and 512x512).
- Ensure manifest.json references these paths.

3) Host on HTTPS (Netlify example)
- Create an account at https://app.netlify.com
- Drag & drop the `deploy-ready` folder (root of this ZIP) into Netlify → Sites
- Or connect a GitHub repo and point Netlify to build/publish branch (no build step needed for static sites).
- After deploy, visit your site (https://your-site.netlify.app). Open DevTools → Application → Manifest to ensure service worker and manifest working.

4) Test PWA & Offline
- Open the site, should see "ServiceWorker registered." in console.
- Click 'Install App' button (bottom-right) to add to home screen.
- Put browser offline and reload—offline.html should show as fallback.

5) Test Firebase Sync
- Open the site on two devices, sign in with same Google account.
- Add/edit data (colonies, harvests, sales, inventory, invoices) on one device — changes should appear on the other device within seconds (10s upload interval for local->remote pushes).

6) Convert to APK (if you still want an APK)
- Option A (recommended): Use Trusted Web Activity (TWA) via Android Studio for best user experience (requires generating android project with Digital Asset Links).
- Option B (simpler): Use https://webintoapk.com
  - Enter your hosted HTTPS URL (Netlify URL).
  - Provide app name, package name, icons, splash screen.
  - webintoapk will wrap your PWA into an APK. Note: background sync and some PWA features may behave differently in APK wrapper.

7) Security & Production Notes
- After testing, set Firestore rules to restrict read/write to authenticated users only.
- Consider migrating push notifications, analytics, and scheduled backups if needed.

If you want, I can:
- A) Replace icons with generated icons from your logo (if you upload one).
- B) Create a GitHub repo and push this deploy-ready folder for you.
- C) Walk through Netlify deploy step-by-step while you watch.

