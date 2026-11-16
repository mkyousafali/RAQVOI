# RAQVOI deployment and security

## Gated HTTPS preview release (17 November 2026)

The current frontend includes customer accounts, email/Google sign-in, and the
separate Owner-controlled Admin window interface. The live customer API remains
bound to VPS loopback; the preview gate forwards authorized customer/Admin API
requests internally. Coming-soon visitors cannot access store pages, bundles or
API endpoints without preview authorization. The single Google return endpoint
is exempt from preview cookies and instead requires its single-use browser-bound
PKCE flow. It commits a same-origin handoff page so Strict session cookies work.
The external provider callback remains at `/__auth/callback`.

Production APP_ORIGIN and the provider return allowlist use `https://raqvoi.com`.
Preview, customer and Admin cookies are Secure and HttpOnly. The gate overwrites
the internal client-address header used for production rate limits. No auth
tokens, gate hash or private server configuration are included in the frontend.
New preview codes and signing secrets are supplied privately at release time.
The public release is still a gated preview: catalogue/orders remain demos and
unresolved launch prerequisites below still apply. Existing customer/Admin data
is preserved. Only the active release and one complete prior rollback are kept.

`deploy-preview.py` captures frontend, gate, API and runtime rollback copies,
saves a protected database backup and recreates only the changed services.
Run public checks and mark the release verified before running retention cleanup.
No database migrations are performed by this frontend release runner.

## Customer authentication backend (16 November 2026; historical rollout)

The live backend now includes email OTP authentication and `public.customer_profiles`,
protected by RLS and a dedicated non-bypass database role. The customer API is published
only on VPS loopback port 5180; local Vite reaches it through an SSH tunnel. No public
API Caddy route or updated frontend has been deployed. Production preview gating remains.
Supabase Auth uses the care mailbox SMTP and OTP templates served by the customer API.
The extra `docker-compose.customer.yml` layer must be preserved in `COMPOSE_FILE`.
Server credentials remain outside Git. See `backend/README.md` for operation and limitations.
The earlier blank database/signup-disabled descriptions below describe the previous state.
Only a clearly named test account/profile has been used; off-server backup and restore
testing and child-account requirements remain prerequisites for public customer use.

## Admin authentication backend (16 November 2026)

The loopback-only API now has a separate password-plus-TOTP Admin login and one
pending first-Admin membership for the verified owner. Setup requires a fresh
customer session and then a separate password/TOTP sign-in. The protected Admin
page and conditional account shortcut are local frontend changes only. No public
frontend or API route changed. Admin management now includes email invitations,
membership listing, invitation cancellation and access disabling. Migration 003
adds forced-RLS invitation/audit tables and narrowly restricted server functions.
Invitation recipients must prove email ownership and finish password/TOTP setup.
Migration 005 protects a sole verified Owner and adds per-Admin section permissions.
Only the Owner can change permissions or deactivate/reactivate other Admins.
Frontend controls remain local; backend authorization uses current database rights.
`public.admin_memberships` has forced RLS and a separate limited activation role.
The migration was tested against a restored database copy and the live RLS/denial
smoke checks passed. Protected database backups remain outside the web root.

This guide is safe to publish. Credentials, access codes, private keys, token files and live environment files must remain outside Git. Machine-specific connection details are in the locally excluded root `AGENTS.md`.

## Current architecture

- `https://raqvoi.com`: demo frontend, protected by a server-side preview code gate.
- `https://www.raqvoi.com`: redirects to the root domain.
- `https://studio.raqvoi.com`: self-hosted Supabase gateway and password-protected Studio.
- One VPS runs Docker Compose with Caddy for HTTPS and routing.
- Supabase has `customer_profiles` and `admin_memberships`; catalogue, order and storage features are still pending.
- The live frontend commerce still uses browser-local demo state. It is not connected to Supabase and does not accept real payments.

## Security requirements for all future work

1. Route application data operations through purpose-built backend endpoints or Supabase RPC/functions. Do not add direct browser table or Storage API calls. A function is not an authorization boundary by itself: authenticate each request, authorize the requested action and validate every input server-side.
2. Never use a service-role/secret key in browser code or as the default credential for application requests. Prefer the caller's verified identity and database permissions so RLS applies. The service role bypasses RLS. Any exceptional administrative job requires an explicitly justified server-only design and authorization checks. Supabase's own internal service credentials must remain internal.
3. Keep private API keys, payment secrets, database passwords, JWT signing keys and access-code/session secrets in server-side environment or secret storage. New third-party integrations must execute secret-bearing calls on the server. Everything embedded in frontend bundles, `VITE_*`, HTML, source maps, browser storage and network responses is visible to users. Supabase publishable/anon keys are public by design; they never substitute for authentication or RLS.
4. Enable RLS when creating every application table in a migration, before granting access. Deny access by default. Explicitly define SELECT/INSERT/UPDATE/DELETE policies with ownership or tenant checks, both `USING` and `WITH CHECK` where applicable. Never trust a client-supplied user ID, role, tenant, price or order total. Apply restrictive grants as well as RLS; review views and functions for bypasses.
5. Prefer `SECURITY INVOKER` RPCs. Revoke default PUBLIC execution and grant only intended roles. For an approved `SECURITY DEFINER` function, use a fixed safe `search_path`, fully qualified objects, minimal owner privileges and explicit caller authorization. Review its RLS behavior, prevent arbitrary SQL, and return only permitted fields.
6. Keep storage buckets private by default. Review whether each object is intentionally public. Add narrowly scoped `storage.objects` policies for every allowed operation and tenant/user path. Validate upload type and size; authorize server-generated signed URLs, keep expiry short and never put private files in a public bucket. Access through the application's backend/functions; no broad public write policies.
7. Keep catalogue prices, stock, discounts, order creation, payment state and admin actions authoritative on the server. Rate-limit sensitive endpoints, restrict CORS to intended origins, prevent CSRF for cookie-authenticated mutations, verify webhook signatures and redact secrets/personal data from logs and errors.
8. Before every commit and push, inspect the exact staged content and scan it plus relevant existing history for secrets, access codes and private files. Inspect generated bundles as well as source. Ignore files do not remove already tracked secrets. If a leak is found, stop publication, revoke/rotate affected credentials and coordinate history cleanup; deleting the visible line alone is insufficient.
9. Verify denied access as well as allowed access: anonymous visitors, different users/tenants, forged IDs, expired tokens, unauthorized RPC calls, private object URLs and privilege escalation. Never assume RLS is effective based only on policy presence.

## Server layout

| Path | Purpose |
| --- | --- |
| `/opt/raqvoi/frontend` | Built static frontend files |
| `/opt/raqvoi/access-gate/server.mjs` | Preview gate implementation |
| `/opt/raqvoi/access-gate/gate.env` | Private gate secrets; mode 600 |
| `/opt/raqvoi/supabase` | Supabase Compose runtime and persistent volumes |
| `/opt/raqvoi/supabase/.env` | Private Supabase configuration; mode 600 |
| `/opt/raqvoi/supabase/volumes/proxy/caddy/Caddyfile` | HTTPS routing configuration |

The runtime combines `docker-compose.yml`, `docker-compose.caddy.yml` and `docker-compose.raqvoi.yml` through `COMPOSE_FILE` in its private `.env`. Always run Compose from `/opt/raqvoi/supabase` so all layers load. The Supabase gateway and pooler bind to loopback only; preview-gate exposes no host port. Only SSH and web ports should be reachable publicly. Review Docker bindings independently of firewall rules.

## Update the frontend

From `source/` locally:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run build
```

`source/dist/` is the deployment artifact. Root `index.html` and `assets/` are a separate portable snapshot and are not refreshed automatically.

Using the SSH identity and destination from the private local guide, upload the complete build to a new release directory outside the web root. Verify it contains `index.html` and all referenced assets, then back up the current build outside the web root and promote the release during a controlled update. Keep directories readable (755) and files readable (644) by the non-root gate process. Do not copy `.env`, keys, backups, source or `node_modules` into the served directory.

The preview-gate container bind-mounts `/opt/raqvoi/frontend` at `/srv/site`. If promotion replaces the directory itself rather than its contents, recreate the container so the bind mount points at the new directory:

```sh
cd /opt/raqvoi/supabase
docker compose up -d --force-recreate --wait preview-gate
```

Keep the gate enabled during development. Do not replace the frontend Caddy route with an unprotected `file_server`. Do not run Supabase initialization or migrations for a frontend-only update.

## Update the preview gate

Copy both `deployment/access-gate/server.mjs` and `deployment/access-gate/coming-soon.mjs` to `/opt/raqvoi/access-gate/`. The gate imports its coming-soon template module. Before deploying this version, add a read-only Compose mount for `/opt/raqvoi/access-gate/coming-soon.mjs:/app/coming-soon.mjs:ro` alongside the existing server mount, and recreate `preview-gate` with `docker compose up -d --force-recreate --wait preview-gate`. For later updates with unchanged mounts:

```sh
cd /opt/raqvoi/supabase
docker compose restart preview-gate
docker compose ps
```

The service uses `node:22-alpine`, a non-root user, read-only mounts/filesystem and dropped capabilities. Its private `gate.env` contains `ACCESS_CODE_SHA256` and a random `SESSION_SECRET`. Never publish the access code or its hash; a six-digit code hash can be brute-forced offline. Code validation happens on the server. Successful access sets a signed Secure/HttpOnly/SameSite browser-session cookie without Max-Age or Expires. Normal browser shutdown ends access; session-restore settings may preserve session cookies. The server also enforces a 12-hour maximum lifetime. Previously issued persistent preview cookies are no longer accepted. Failed attempts are limited per IP, and unauthorized visitors cannot load application assets. Rate limits are held in process memory and reset on restart. Trust forwarded client IPs only from the controlled reverse proxy; never expose the gate directly.

Rotate the code and session secret server-side when needed, then recreate the service to reload its environment. Rotating the session secret invalidates existing sessions. Do not include secret values in command output, shell history or this guide.

## Supabase operations

Use the official [Docker self-hosting guide](https://supabase.com/docs/guides/self-hosting/docker) and [HTTPS guide](https://supabase.com/docs/guides/self-hosting/self-hosted-proxy-https). Preserve pinned upstream versions and local overrides; back up before upgrades. Signup is currently disabled. SMTP, production authentication, application schema and application integrations are future work.

```sh
cd /opt/raqvoi/supabase
docker compose config --quiet
docker compose ps
```

Do not print expanded Compose configuration: it contains credentials. Inspect logs selectively and redact before sharing. Never use `docker compose down -v`, reset scripts or database directory deletion against this deployment without an explicit data-destruction request. Store database/storage/configuration backups encrypted outside the served directories, and arrange off-server backups plus restore testing before real customer data is stored; automated off-server backups have not been configured in this setup.

## Verification and rollback

- Confirm valid HTTPS for root, www and Studio without disabling certificate verification.
- Anonymous root access must show the preview form; direct JS/image requests must be blocked.
- Wrong code must fail, correct code must load the demo, and tampered sessions must fail.
- Studio must reject unauthenticated requests and accept the configured admin login.
- Confirm relevant containers are healthy and database/internal ports remain private.
- For data features, run authorization/RLS/Storage checks for anonymous, owner, other-user and admin identities before release.
- If a frontend update fails, restore the prior static release and recreate preview-gate when necessary. Preserve the gate and Supabase volumes. Configuration backups from before the gate was installed would remove protection and must not be used as a routine rollback.

## Publish to GitHub

Review `git status`, staged filenames and the exact diff. Use an established secret scanner where available and check for private keys, JWTs, API tokens, connection URLs, passwords and numeric preview codes without echoing any matches into shared output. Confirm `AGENTS.md`, `.env` and private credential files are ignored and untracked. Commit only reviewed source and this sanitized guide. Never force-push to hide a leak; rotate secrets first and coordinate any required history rewrite.

## PWA and brand assets

Original user-provided artwork lives in root `static/`. Web-ready wordmark/icon files are in `source/public/assets/brand/`; favicon, touch and install icons are in `source/public/icons/`. Keep original artwork unchanged when updating derivatives.

`source/public/manifest.webmanifest` defines standalone installation. The footer offers installation or browser-specific instructions. `source/public/sw.js` is deliberately network-only: it never caches app pages, images, API responses or credentials. Its offline screen contains no protected app content. Retain this behavior while preview access is required; offline caching must not bypass session expiration.

The gate allows anonymous GETs only for the manifest, service worker, two coming-soon brand PNGs and generated floral WebP and explicitly listed app icon files, allowing browser/OS installation metadata fetches. All application pages, bundles, product images remain gated; the two brand PNGs and floral decoration used on the coming-soon screen are intentionally public. Add any new public metadata file explicitly after reviewing its contents. Static production serving must return `application/manifest+json` for the manifest.

Verify locally with `node tests/pwa.test.mjs` from `source/`, supplying `RAQVOI_PREVIEW_CODE` in the process environment and optionally `RAQVOI_URL`/`RAQVOI_CHROME`. This checks actual Chromium installability in a temporary normal profile, brand loading, mobile overflow, worker control, session expiration and safe offline behavior. Do not commit the preview code or the temporary browser profile. Browser-managed installation itself is a user action.

The coming-soon page hides the access form until the wordmark button is clicked five times (keyboard activation works too). This is a presentation choice, not authentication; code validation and session authorization remain server-side. Wrong-code responses reveal the form for retry. The small reveal script is authorized by an exact CSP hash, without unsafe-inline JavaScript.

## Required release retention

Keep only the active frontend/gate and one immediately previous rollback version. Before promoting a new release, capture the current frontend, gate modules and Compose override in the new release's `previous/` directory outside the web root. Once the new deployment is healthy and all live checks pass, run the repository's `deployment/prune-releases.py` on the VPS (installed at `/opt/raqvoi/bin/prune-releases.py`), passing the deployed commit identifier. It retains that release record and its `previous/`, removes older release directories and duplicate upload archives/gate staging copies. Do not keep an accumulating build history. Do not run cleanup before successful verification. Database, Storage and secret backups are separate from build retention and must not be removed by this script.
