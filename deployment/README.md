# RAQVOI deployment and security

This guide is safe to publish. Credentials, access codes, private keys, token files and live environment files must remain outside Git. Machine-specific connection details are in the locally excluded root `AGENTS.md`.

## Current architecture

- `https://raqvoi.com`: demo frontend, protected by a server-side preview code gate.
- `https://www.raqvoi.com`: redirects to the root domain.
- `https://studio.raqvoi.com`: self-hosted Supabase gateway and password-protected Studio.
- One VPS runs Docker Compose with Caddy for HTTPS and routing.
- Supabase is initialized with its required system schemas. No application tables, users or storage buckets have been created.
- Frontend commerce still uses browser-local demo state. It is not connected to Supabase and does not accept real payments.

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

Copy `deployment/access-gate/server.mjs` to its server path, then:

```sh
cd /opt/raqvoi/supabase
docker compose restart preview-gate
docker compose ps
```

The service uses `node:22-alpine`, a non-root user, read-only mounts/filesystem and dropped capabilities. Its private `gate.env` contains `ACCESS_CODE_SHA256` and a random `SESSION_SECRET`. Never publish the access code or its hash; a six-digit code hash can be brute-forced offline. Code validation happens on the server. Successful access sets a signed Secure/HttpOnly/SameSite cookie for 12 hours. Failed attempts are limited per IP, and unauthorized visitors cannot load application assets. Rate limits are held in process memory and reset on restart. Trust forwarded client IPs only from the controlled reverse proxy; never expose the gate directly.

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
