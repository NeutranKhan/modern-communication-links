# Modern Communication Links — production project plan

## MVP and acceptance criteria
1. Mobile-first public pages: Home, About, Program, Upcoming Workshops, Registration, Gallery, Testimonials, FAQ, Contact, status lookup, and certificate verification scaffold.
2. Firestore-backed workshop settings: dates/times (Africa/Monrovia), venue, capacity, registration and payment deadlines, price (default USD20), payment location, and program. Never fabricate scheduled events.
3. Account-free registration: validated contact information, secure random reference, Pending payment, immutable price snapshot. A transaction enforces capacity and duplicate protection; pending registrations reserve capacity until an admin cancels them. No online payment.
4. Admin: Firebase email/password authentication with server-verified admin claim; create/update workshops, manage trainers/gallery/testimonials, record physical receipt, confirm paid seat, attendance, cancellation. Transactions protect seat counts. Audit trail records staff changes.
5. Private lookup: reference plus phone; return only minimum status data. Certificate schema and verification support signed trainer snapshots without issuing certificates automatically.
6. Quality: responsive accessible UI, honest missing-data states, server validation, deny-by-default rules, request throttling, tests of registration policy, production build, and setup/deployment documentation.

## Architecture
Next.js App Router, TypeScript, Tailwind CSS. Server route handlers exclusively access Firestore through Firebase Admin. Firebase browser SDK handles admin sign-in only. Public reads expose published content. No browser access to participant records. Missing Firebase disables transactional operations explicitly while public informational content remains available.

## Delivery sequence
Plan and scaffold → shared design/public routes → data schemas and service endpoints → admin workflow → tests/build/visual review → handoff.

## Launch prerequisites
Create Firebase project and Firestore; enable email/password; set environment variables privately; grant the first admin custom claim; deploy security rules; publish a configured workshop; test complete registration/payment/attendance cycle in staging. Deploy to a Node-capable host (Vercel or Firebase App Hosting); add domain later. Add production edge rate limiting, backups, retention policy and monitoring before advertising. Certificate issuance/export and student accounts are later work.

## Additional validation scenarios

Before production launch, also test registration input with extra payment/role fields (must be ignored), path-like workshop IDs (must be rejected), dates without an explicit UTC timezone (must be rejected), and attendance outside the configured program (must be rejected). Confirm that non-admin Firebase users cannot call either admin endpoint and that cross-origin mutation requests are denied.
