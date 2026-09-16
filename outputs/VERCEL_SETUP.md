# Vercel launch guide

The project is prepared for Vercel’s Next.js framework preset. No domain purchase is required: use the provided vercel.app address first.

## 1. Connect the repository

Push the working repository to your Git provider, then import it in Vercel. Use this repository’s root as the project root. The included vercel.json selects Next.js, npm install, and npm run build. Node 24 is the intended runtime.

Do not upload .env.local. It already contains your Firebase web configuration locally and is ignored by Git.

## 2. Complete Firebase

Your Firebase project is modern-communication-cb57c.

In Firebase Console:

1. Create the Firestore database in production mode if it does not exist.
2. Enable Authentication → Sign-in method → Email/Password.
3. Create your staff login under Authentication → Users.
4. Open Project settings → Service accounts. Generate a private key for a dedicated service account with the required Firestore and Firebase Auth permissions. Keep the downloaded JSON private.
5. Copy client_email and private_key from that JSON into the server environment settings below. Do not paste the whole JSON into a browser-prefixed variable.
6. Deploy the included Firestore rules and TTL configuration using the command in README.md.
7. Grant the staff account the admin claim using scripts/set-admin.mjs on a trusted machine with the server environment values available. Sign out and sign back in afterward.

## 3. Add environment variables in Vercel

Open Project → Settings → Environment Variables. For the production deployment, add:

| Variable | Where the value comes from |
| --- | --- |
| NEXT_PUBLIC_FIREBASE_API_KEY | Your Firebase Web app configuration, already saved locally |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | modern-communication-cb57c.firebaseapp.com |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | modern-communication-cb57c |
| NEXT_PUBLIC_FIREBASE_APP_ID | Your Firebase Web app configuration, already saved locally |
| FIREBASE_PROJECT_ID | modern-communication-cb57c |
| FIREBASE_CLIENT_EMAIL | client_email in the private service-account JSON |
| FIREBASE_PRIVATE_KEY | private_key in the private service-account JSON; escaped newlines are supported |
| APP_URL | Your exact stable HTTPS Vercel site origin, without a path |
| LOOKUP_HASH_SECRET | The generated value in your local .env.local, or a new random 32+ character secret before any registrations exist |

Do not add quotes around values in Vercel’s value fields. Mark server credentials and the hash secret sensitive. Keep production credentials out of untrusted preview branches. Use a separate Firebase project and matching APP_URL for staging.

The web configuration supplied does not grant secure server access by itself. Firebase Storage and Analytics are not needed for this MVP. Gallery/profile images use HTTPS URLs managed in the admin panel.

## 4. Deploy and authorise the domain

Deploy. Add the stable vercel.app hostname to Firebase Authentication → Settings → Authorised domains. Set APP_URL to the same stable HTTPS origin and redeploy if you learned the URL only after the first deployment. Firebase browser values are set at build time, so redeploy after changing them too.

Only the exact APP_URL origin may submit forms. A temporary preview URL will not be able to submit to a production-origin configuration; use the stable production URL or a separately configured staging environment.

## 5. Launch the first workshop

Sign in at /admin. Create a workshop, set dates/times, venue, registration and payment deadlines, capacity, program, and price. US$20 is the starting default. Publish it, complete a test registration, verify status, record a physical receipt/payment, mark attendance, and test cancellation.

Before Facebook traffic, configure Vercel firewall/rate-limit protection for the public API routes. The application has per-identifier throttling, but rotating identifiers still needs edge-level protection. Configure Firebase billing alerts, backups, and regular overdue-payment review.

## Later: add your domain

Add the domain in Vercel, follow its DNS instructions, update APP_URL, add the hostname to Firebase Authentication, and redeploy. Workshop content and participant data remain in Firebase.

References: [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), [supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), and [Firebase Admin setup](https://firebase.google.com/docs/admin/setup).
