# Modern Communication Links

A mobile-first AI workshop website for Liberia, built with Next.js App Router, TypeScript, Tailwind CSS, Firebase Authentication, and Firestore. This is a working MVP implementation; Firebase must be connected before registrations or staff operations can run. No sample workshops or invented testimonials are published.

## Start locally

Use Node.js 24 and npm. From this repository:

```sh
npm install
```

Copy `.env.example` to `.env.local`, then fill its values privately. For a public-content preview, no Firebase configuration is required:

```sh
npm run dev
```

Open http://localhost:3000. Without Firebase, informative pages and honest empty states render; registration is unavailable and `/admin` explains setup. No data is silently saved to browser storage.

```sh
npm test
npm run typecheck
npm run build
npm start
```

The project plan is in `outputs/PROJECT_PLAN.md`. Dependencies are installed and package-lock.json is present. Seven policy tests, TypeScript checking, and the production build pass. The updated home page was visually reviewed at desktop and phone widths. Live certificate issuance still needs a staff-user check with a completed participant.

## Firebase setup

1. Create a Firebase project and register a Web app. Copy the Web app values to the four `NEXT_PUBLIC_FIREBASE_*` variables. These identify your Firebase app and are not service-account credentials.
2. Enable Authentication → Email/Password. Add localhost and your eventual hosting domain under authorised domains. Create each staff account manually; there is no public sign-up UI.
3. Create Firestore in production mode and choose a location appropriate to your users and host. Apply the included deny-all client rules; all database access is through the server.
4. Use a dedicated service account with the minimum Firestore and Firebase Authentication permissions needed by this server. Fill `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` using that credential. Prefer your host’s secret manager. Never commit a credential JSON file or place it in public assets. The private key may contain escaped `\n` sequences.
5. Set `APP_URL` to the exact site origin, e.g. `http://localhost:3000`, and generate a random secret of at least 32 characters for `LOOKUP_HASH_SECRET`. Do not change the hash secret casually: it determines duplicate-registration keys. Plan a key migration if rotating it.
6. Install/use the Firebase CLI, sign in to your account, and deploy rules explicitly to the intended project:

```sh
npx firebase-tools deploy --only firestore --project YOUR_PROJECT_ID
```

7. Grant the staff UID the `admin: true` custom claim from a trusted machine using the included script. This script preserves other custom claims. Run it with environment values loaded (Node 22):

```sh
node --env-file=.env.local scripts/set-admin.mjs STAFF_FIREBASE_UID
```

Sign out and back in after granting access. The server verifies ID tokens, checks revocation, and requires the admin claim on every admin request. Being signed in alone does not grant access. To remove admin access, change the claim with Firebase Admin and revoke refresh tokens.

8. In `/admin`, create a workshop, fill every date, venue, capacity, deadline, price, and program, then publish. No events are hard-coded. The editor starts at US$20; each workshop can override this. Enter times in Liberia time (Africa/Monrovia / UTC+0). Set the payment deadline normally one week before training. Registration must close no later than the payment deadline.
9. Use Content to edit Michael Khan and Teddy Morris, their profile fields, gallery image links, testimonials, and signature image links. Only publish photos and testimonials with permission. Use trusted HTTPS images; upload management is a future extension.

## Participant and payment workflow

Visitors register without an account. The server validates and normalizes Liberian phone numbers, creates a cryptographically random `MCL-` reference, records the price at registration, and starts Payment Pending. A Firestore transaction prevents exceeding capacity and prevents registering the same phone twice for one workshop. A pending registration reserves capacity; there is no automatic expiration job. Staff should review overdue payments and cancel unpaid reservations to release seats. Cancellations keep duplicate protection, so staff should restore an existing registration rather than creating another for the same phone.

The confirmation tells the participant where and when to pay and supports printing/saving. No email or SMS is automatically sent. A participant checks status with the reference and the exact phone number used at registration (local or international formats are accepted). Only minimum status information is returned, never the participant’s address or email. A lost-reference recovery requires staff assistance.

Staff select a registration and choose Paid / Seat Confirmed. Receipt numbers are no longer collected or required. Attendance can be marked by program session for paid participants. Staff may cancel or restore a reservation; transactions keep seat counts correct and enforce remaining capacity. Audit records store actor, time, target, and before/after payment details. The dashboard loads registrations in pages of 100. Use Load more to retrieve older records. Search, workshop filters, and summary counts apply to the loaded records; refreshing after a save returns to the first page.

Default payment location: Snow Hill Community Junction, Gardnersville Supermarket, Montserrado County, Liberia. Physical receipt issued. Workshop-specific payment location is editable. No payment gateway, card collection, checkout, or online payment is implemented.

## Firestore schema and access

- `workshops/{id}`: title, summary, startAt, endAt, venue, city, capacity, reserved, price, registrationDeadline, paymentDeadline, paymentLocation, published, program[]. Dates are UTC ISO strings; reserved is server-maintained.
- `registrations/{reference}`: reference, workshopId, workshopTitle, fullName, normalized phone, email, occupation, city, optional gender, immutable price snapshot, paymentStatus, certificate (optional summary), attendance[], createdAt, consentAt, updatedAt.
- `registrationKeys/{HMAC(workshopId:phone)}`: reference. Internal duplicate index.
- `content/site`: trainers[{name,title,bio,photoUrl,signatureUrl}], gallery[{url,caption}], testimonials[{name,quote,detail}].
- `auditLogs/{autoId}`: action, uid, target when applicable, at, before/after for participant changes. Only accessible with server credentials; not exposed in the public API.
- `rateLimits/{hashedKey}`: count, expiresAt (Firestore timestamp). TTL policy in `firestore.indexes.json`; deletion may lag, but expired buckets are never reused.
- `certificates/{code}`: see below.

Client SDK Firestore access is denied to everyone, including signed-in admins. Next.js server APIs use Firebase Admin (which bypasses security rules), so authorization and validation in those endpoints are essential. Do not remove them or replace them with client-only checks. Public data access is limited to published workshops and display content. Participant endpoints return `Cache-Control: no-store`.

## Certificate management

In Admin → Participants → Manage, use Add completion certificate after a workshop ends. Confirm the participant completed training, enter the completion date, and optionally add an HTTPS link to a designed PDF/image. Payment must be confirmed first. Public verification requires the participant's consent.

Saving issues a secure code and records a certificate in Firestore, with a summary attached to the registration. Repeated saves update the same certificate; concurrent requests cannot create multiple certificates for one participant. Trainer names/signatures are copied on first issuance and preserved on later edits. Configure these under Website content before issuing certificates.

Participants find the code and optional file link through registration-status lookup. Consented records appear on /verify with trainer details and a print option. Staff can change the certificate status to Revoked; verification then hides signatures and the file link. Revoking the record does not revoke access to a file hosted separately.

There is no file-upload or PDF-generation service: use an existing HTTPS file link, or print the verification record. Existing historical receipt data is retained in Firestore, but is not used or displayed.

## Deployment (Node runtime)

This implementation uses the Firebase Admin SDK in Next.js server routes. It needs a Node-capable Next.js host, not static hosting or a browser-only export. No domain purchase is needed initially.

**Vercel:** import the repository, select Next.js, use `npm install` and `npm run build`, and add all `.env.example` values through environment settings. Set `APP_URL` to the deployment’s stable HTTPS origin. Redeploy after setting browser Firebase variables because Next.js inlines them during build. Add that host to Firebase Authentication authorised domains. Configure a separate Firebase project and origin for staging. Do not point untrusted branch previews at production credentials.

**Firebase App Hosting:** connect the Git repository, create a backend using the supported Node/Next.js runtime, and map server credentials/secrets through Google Secret Manager. Set the public Firebase configuration at build time and `APP_URL` to the backend’s stable origin. Follow the current App Hosting console’s framework/build guidance. Classic static Firebase Hosting alone is not sufficient for these API routes.

Add a custom domain later, update `APP_URL` and authorised domains, and redeploy. This repository has not been published or connected to a Firebase account.

## Production checks before Facebook ads

- Complete a staging registration → lookup → receipt/payment → attendance → cancellation/restoration cycle. Test simultaneous last-seat registrations, duplicate retries, wrong-phone lookup, revoked/non-admin users, and direct Firestore denial with emulators or staging. Policy unit tests alone cannot verify real IAM, transaction behavior or deployed rules.
- Add host-managed edge rate limits/challenge protection to `/api/register`, `/api/status`, `/api/verify`, and authentication. Built-in durable per-phone/reference throttling and the honeypot reduce repeated submissions, but a distributed attacker can rotate identifiers. Origin checks are not bot protection. Do not rely on arbitrary forwarded-IP headers.
- Set database budgets, backup/recovery, log monitoring and alerts. Avoid logging contact details or tokens. Review admin access regularly and use strong staff passwords.
- Agree a participant retention/deletion policy and cancellation/refund process. A deletion process should account for registration keys, attendance, receipts, audit obligations and issued certificates.
- Review dates, payment location, device requirements and capacity, and publish real trainer biographies. Confirm photo and testimonial permissions.
- Verify on a low-end phone / slow connection, keyboard-only navigation and text zoom. The public homepage has no downloaded font or hero photograph, keeping initial assets light. Added gallery assets should be compressed.

## Technical references

- Next.js App Router: https://nextjs.org/docs
- Firebase Admin setup: https://firebase.google.com/docs/admin/setup
- Verify tokens: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Firestore transactions: https://firebase.google.com/docs/firestore/manage-data/transactions