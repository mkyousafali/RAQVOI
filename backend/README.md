# Customer authentication backend

Production backend; frontend changes remain local until explicitly deployed.
Uses Supabase Auth for email OTP and verifies caller identity on every profile
request. Database access uses a dedicated non-owner, non-bypass role with RLS.
No service-role key is used. Auth tokens stay in process memory, behind opaque
HttpOnly session cookies (12-hour maximum). Restarting the API invalidates sessions.

`APP_ORIGIN` currently accepts only `http://localhost:5173`. The API is bound to
VPS loopback and connected locally through an SSH tunnel on port 5180. Vite proxies
`/api/customer` to that tunnel. Use localhost rather than 127.0.0.1 for mutations.
No public Caddy API route has been added. For eventual frontend release, review
same-origin HTTPS routing and switch APP_ORIGIN, which enables Secure/__Host cookies.

`provision.py` is a one-time provisioner, not a general migration runner. It creates
a protected full database backup and checks its archive listing before applying
001. A listing check is not a restore test; encrypted off-server backups and an
actual restore test remain launch prerequisites. It preserves all existing Compose
layers and adds one dedicated layer. Never print api.env or expanded Compose config.

OTP delivery is capped at 15/hour in Auth while the mailbox is on its 20/hour trial.
The API also limits IP/email requests and verification attempts. Limits/sessions
are currently memory-based; multi-instance operation needs shared storage.

Run `npm test` in backend for input validation and Admin auth denial checks. Run tests/rls.sql as supabase_admin
against the deployed schema: fixtures are inside a transaction and rolled back.
API tests must cover origin rejection, missing sessions, forged cookies, bad codes,
correct code once, profile validation/edit, logout and replayed cookies.

Admin login is now implemented on the loopback API. The first verified owner has
one pending Admin membership, inserted by the protected server-side bootstrap.
The local account page shows the Admin entry only when `/api/customer/session`
returns a server-verified pending or active membership. Pending setup requires
a fresh customer sign-in (within 15 minutes), a new password (12+ characters),
then verification of a Google Authenticator-compatible TOTP factor. Setup does
not create an Admin session: the owner must separately sign in with the Admin
password and TOTP code. Only then does the API issue a separate opaque Admin
cookie. Admin sessions have a 2-hour absolute limit, 15-minute idle limit, and
are checked against the current Auth identity, verified factor and active
membership on every Admin request. Customer sign-out also revokes the Admin
session in that browser. API restart invalidates both types of session.

Admin management now supports listing memberships/invitations, inviting or
resending by email, cancelling unaccepted invitations, and disabling another
Admin. The verified original account is the sole Owner. Migration 005 gives only
the Owner permission/activation controls; other Admins start with no section
access. The Owner can independently grant Admin management (list/invite/cancel)
and Customers section access. Only the Owner can disable or enable another Admin
or change section permissions. The Owner cannot be disabled or edited through
these endpoints. Invitation acceptance resets a re-invited disabled account's
section access to deny by default. Invitations expire
after seven days and are bound to the exact verified Auth email on acceptance.
Invitees sign in to the customer account, set a password and verify TOTP using
the existing setup flow. Self-disable is forbidden; disable operations serialize
before checking the actor, preventing concurrent Admins from disabling each
other and leaving no active account. Each action records a private audit event.
Invitation email uses the existing mailbox through server-only Nodemailer SMTP.
Migration 004 adds `last_login_at` to memberships. It is written only after a
successful separate Admin password/TOTP sign-in, using the verified server
identity and the restricted management function. The Admin list returns it as
`lastLoginAt`; pre-update logins remain unknown. The local UI shows added and
last-login timestamps in the viewer's device time zone under Manage Admins.
Failed delivery leaves a saved invitation and returns an explicit delivery flag;
the interface reports this and supports resend. No invitation is issued by
deployment itself. The frontend remains local and invitation links use APP_ORIGIN.

Migration 003 creates forced-RLS invitation/audit tables with no direct API-role
grants. Two restricted SECURITY DEFINER functions perform management and claim
operations; they use an empty search_path and fully qualified objects. The
management function checks a verified MFA claim plus the caller's current
active, email-matched membership and current Owner/section rights for each
operation. UI visibility derives from the Admin session's server-reported
permissions; the shell refreshes visibility every 30 seconds. Backend permission
revocations apply to the next request, independently of the sidebar refresh.
Customers data management is still unimplemented; this permission currently
controls access to its blank window and must guard any future data endpoints.
The claim function derives its email from Auth,
never a request parameter. The API derives transaction claims from verified
server sessions, applies rate limits and the existing origin/CSRF guards.
These functions run under the migration owner for narrowly scoped Auth and
cross-membership access; browser and default API credentials cannot bypass RLS.
Protected database/code backups are taken by deploy-management.py before rollout.

Customer, order, catalogue and account-recovery management remain future phases.
There is no public
Admin signup or email-only MFA recovery route. Admin membership is bound to
the immutable Auth user ID; sharing a customer email does not grant Admin rights.

`deploy-admin.py` was used for the Admin schema rollout. It backed up the live
database, restored Auth and application schemas into a temporary database,
ran migration and RLS denial checks there, then applied migration 002 and
rebuilt only `customer-api`. Its generated Admin DB password remains solely in
the server's mode-600 `api.env`. The new Admin table has forced RLS; its
activation role cannot insert memberships or read another Admin's row.

For a future Admin backend update, preserve the private `api.env` and all
Compose layers. Never rerun this one-time deployment script. Run local backend
tests, Svelte checks/build and the no-email `tests/admin-live-smoke.py` on the
VPS after deployment. Keep the Admin API on loopback until the reviewed
same-origin HTTPS route and frontend release are ready.

This step implements OTP, profile creation/edit, logout and first-Admin
password/TOTP login. Verified email changes, deletion, real orders and other
plan phases remain pending.
The current checkout still creates browser-local demo orders; the account guard
is navigation UX and must not be represented as a server order authorization boundary.
Minor-account legal/consent handling remains unresolved and prevents a public launch.
