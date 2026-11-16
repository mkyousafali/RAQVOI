# RAQVOI authentication, email and commerce plan

Updated: 16 November 2026. Status: customer OTP/profile/logout backend implemented in production; frontend under local review. Later conversation explicitly authorized Namecheap email setup and production backend work; frontend deployment remains pending.

## 1. Agreed scope

- India only; English interface; prices in INR.
- Visitors can browse freely. Login and a complete profile are required at checkout.
- Customers sign in using an email OTP, without a password.
- Mandatory profile: name, WhatsApp number with country code, and date of birth. No gender field.
- Minimum age requested: 10 years, including age 10. Any required handling of children's data and parental consent remains a pre-launch review item; this preference does not establish legal compliance.
- Customers can edit all profile fields and change their login email after verifying the new address. Require recent authentication and notify the old address.
- Customers can request account deletion with email OTP confirmation. Define deletion/anonymisation and necessary order-record retention before release.
- Customer sessions end with the browser session: use session cookies without persistent expiry attributes, plus a server-enforced maximum. Browser session restore may preserve cookies. Proposed maximum: 12 hours, to confirm during implementation.

## 2. Admin access

- Admin is the only staff role initially; no general employee role.
- Invitation-only accounts; password login plus mandatory authenticator-app MFA, compatible with free Google Authenticator.
- Admins can view and edit customer profiles, manage admin invitations, manage orders, manage catalogue/prices/stock, and change the order-receiving WhatsApp number.
- Email changes require address verification even when initiated by an Admin. Never allow an edit to silently grant Admin access.
- Record administrative changes in a restricted audit log. Avoid storing credentials, OTPs or unnecessary personal information in audit entries.
- Establish the first Admin through a controlled server-side bootstrap to a verified owner address. The address is a setup item, not a public self-registration route.
- Proposed safeguards: require MFA for every Admin API action; prevent removing the final active Admin; use expiring, single-use invitations; provide a documented identity-verified recovery process without an email-only MFA bypass.

## 3. Email

- Planned provider: Namecheap Private Email Launch.
- Configured support inbox: care@raqvoi.com, for receiving and replying to customers.
- Use server-side SMTP for customer OTPs, Admin invitations/password resets, email changes, deletion confirmations and order updates, subject to delivery testing.
- Pricing checked 16 November 2026: 30-day trial; advertised renewal USD 14.88/year before applicable taxes; one 5 GB mailbox and 10 aliases. Promotional checkout prices may differ.
- Published sending limits: paid mailbox 500/hour; trial mailbox 20/hour. These are provider limits, not the application's allowed OTP request rate.
- Confirm sender/alias configuration and reliable delivery to major inbox providers before relying on this SMTP service. Use a separate transactional provider later if necessary, with cost review first.
- Configure MX, SPF, DKIM and DMARC at the authoritative Cloudflare DNS, preserving unrelated records and avoiding duplicate SPF records. Test receiving, replies, authentication alignment, bounce handling and spam placement.
- Keep mailbox/app passwords and SMTP credentials server-side. Prefer a restricted sending credential if supported; protect mailbox access with MFA.
- Sources: [pricing](https://www.namecheap.com/hosting/email/?plan=1), [sending limits](https://www.namecheap.com/support/knowledgebase/article.aspx/10719/2179/email-sending-and-usage-limits-for-private-email/), [Google Authenticator](https://support.google.com/accounts/answer/1066447).

## 4. Checkout and WhatsApp handoff

1. Require customer login and profile completion.
2. Collect recipient name, phone, address lines, city, state and Indian PIN code; validate on the server.
3. Re-read published variants, prices and stock on the server. Return changed prices for customer review before submission.
4. In one database transaction, save the order and reserve its stock. Use row locking or equivalent atomic checks to prevent overselling and an idempotency key to prevent duplicate submissions.
5. Store immutable item/price and delivery-address snapshots. Show the product subtotal; delivery charges and final amount will be confirmed by the team on WhatsApp. No online payment in this phase.
6. Clear the cart only after the order is saved successfully.
7. Open WhatsApp with an order reference and prepared message to the configured business number. The customer must tap Send. Opening the link does not prove message delivery or order confirmation.
8. Keep sensitive details such as date of birth and full delivery address out of WhatsApp URL query text; staff can view the saved address in Admin.
9. If WhatsApp fails to open, show the saved order and a retry link. Retrying must not create another order.

## 5. Orders and stock

- Customer account shows only that customer's order history, details, status and WhatsApp handoff link.
- Statuses: New, Confirmed, Shipped, Delivered, Cancelled and Expired.
- Customers may cancel only New orders. Enforce this atomically on the server.
- New orders reserve stock for 24 hours; automatically expire unconfirmed orders and release reservations exactly once.
- Confirmation must atomically check that the reservation is still valid. Confirmed orders retain stock allocation.
- Define explicit allowed status transitions; reject arbitrary or stale transitions.
- Cancellation before shipment releases reserved/allocated stock exactly once. Cancellation after shipment and restocking delivered/returned items require a separately defined return process; do not automatically increase stock.
- Admin enters agreed delivery charges and shipment tracking information. The server calculates the final total. Validate tracking URLs and safely render tracking text.
- Send emails when orders are saved, confirmed, shipped, delivered, cancelled or expired. A New order email says it awaits confirmation and delivery-charge agreement.
- Use a transactional outbox/queue for email retries: mail failure must not duplicate or roll back a successfully saved order. Do not promise exactly-once email delivery.
- Apply reservation/order rate limits and quantity caps to reduce stock hoarding. Limit values remain implementation settings.

## 6. Catalogue management

- Import current demo products as drafts; review prices, variants and stock before publishing.
- Admin can create/edit/archive products, manage images, set INR prices and update stock by size/colour variant.
- Only published products and intended public catalogue fields are returned to visitors.
- Keep historical order snapshots when products are edited or archived.
- Record stock movements and prohibit adjustments that make reserved stock exceed available stock.
- Validate image size, file content and type on the server. Use private Storage by default and reviewed backend delivery/signed URLs; no direct browser Storage calls or public writes.

## 7. Technical and security design

- Preserve the Svelte frontend and existing self-hosted Supabase; add a same-origin backend for authentication, application APIs and sessions.
- Verify supported Auth/MFA/SMTP behaviour against the installed Supabase versions and official documentation before implementation.
- All browser application data access goes through authenticated/authorized backend endpoints or purpose-built RPCs. No direct browser table/Storage calls.
- Use verified caller identity and RLS; never trust browser user IDs, roles, prices, totals or inventory values. Do not use service-role credentials as default request credentials.
- Proposed entities: customer profiles, Admin memberships/invitations, products/variants/images, inventory/movements/reservations, orders/items/status events, business settings, restricted audit log, email outbox and session records as needed.
- Enable RLS in every application-table migration before grants. Use minimal grants and per-operation policies, with correct USING/WITH CHECK clauses.
- Prefer SECURITY INVOKER functions. Any privileged bootstrap, invitation, deletion or background worker needs a documented minimal privilege boundary, explicit authorization and review before use.
- Keep Auth tokens and provider secrets server-side. Production cookies must be Secure, HttpOnly and SameSite, with CSRF protection for mutations. No auth tokens or customer profiles in localStorage.
- Proposed OTP controls: short expiry, one-time use, resend cooldown, attempt limits and IP/account rate limits. Avoid account enumeration and redact OTPs/tokens/personal data from logs.
- Rotate sessions after login/security changes, revoke on logout/deletion/role removal, and enforce server-side expiry. Protect MFA setup, factor removal and recovery with recent strong authentication.
- Do not cache authenticated pages or APIs in the PWA. Preserve network-only behaviour.
- Follow deployment/README.md throughout. Production preview protection remains until separately authorized; the current direct local preview remains available.

## 8. Implementation phases

1. Review existing source and installed services; settle the open setup/security decisions below. Research current India privacy requirements using authoritative sources before designing children's account handling.
2. Prepare an isolated local backend/database and test email delivery. No real customer data in development; no production schema changes during local review.
3. Add reviewed migrations, RLS, backend sessions and customer OTP/profile flows.
4. Add invitation-only Admin login, mandatory MFA, customer editing, settings and audit records.
5. Add catalogue/variant/image/stock management and import demo products as drafts.
6. Add checkout, stock reservation/expiry, WhatsApp handoff, customer order history, Admin order management and email outbox.
7. Add verified email change, deletion and recovery flows; complete responsive/accessibility review.
8. Run functional, concurrency, privacy and authorization tests; show the working local system for review.
9. Before production stores real data, configure encrypted off-server backups and verify a restore; finalize privacy/retention notices and launch setup.
10. Deploy only after authorization. Back up the database before migrations, preserve service volumes, verify HTTPS/email/MFA/access controls, and retain only the active build plus one rollback build after successful checks. Database rollback/restore needs its own plan; restoring frontend files does not undo migrations.

## 9. Acceptance checks

- OTP success, wrong/expired/reused codes, resend limits and enumeration resistance.
- Mandatory profile fields, editable fields, email verification, age boundary and server-side validation.
- Session logout/expiry/revocation, CSRF, expired tokens and no browser token storage.
- Anonymous access, customer ownership, other-customer IDs, forged Admin roles, missing MFA and revoked Admin access.
- Invitations, first Admin bootstrap, recovery and last-Admin protection.
- Product drafts hidden; private Storage denied; unsafe/oversized uploads rejected.
- Simultaneous final-stock orders, duplicate checkout retries, expiry versus confirmation races, cancellation and stock release exactly once.
- Server totals unaffected by client tampering; snapshots survive catalogue/profile changes.
- WhatsApp failure/retry and customer Send requirement; delivery fees clearly provisional.
- Order email queue retries and provider-limit behaviour; account deletion and retained-record access restrictions.
- Svelte checks/build, appropriate API/database/browser tests and mobile review. Scan source/build/staged content/history for secrets before any commit or push.

## 10. Remaining setup and launch decisions

- Owner email for the first Admin; recovery verification procedure.
- Initial business WhatsApp number, editable later by Admin.
- Purchase/trial activation and SMTP credentials through a secure setup process; no credentials in this document.
- Customer/Admin maximum and idle session durations, OTP timings, reservation-abuse limits.
- Supported child-account and parental-consent process after India-specific review; do not silently substitute an 18+ requirement or launch an unresolved process.
- Privacy notice, account deletion/retention periods, order cancellation/returns policy and support procedures.
- Confirm which final-total adjustments are allowed: initial proposal is fixed saved item prices plus delivery charge, with no unrequested discounts/payment integration.
- Choose backup destination, schedule and restore procedure.

## 11. Excluded initially

- Online payment gateway, automated WhatsApp sending, WhatsApp-number OTP verification, non-Admin staff roles, additional languages and international delivery.
- This document itself does not authorize further changes. See backend/README.md for the implemented OTP/profile step.


## Implemented and verified — 16 November 2026

Production customer API, Supabase email OTP and RLS-protected customer profiles are live, reachable locally through an SSH tunnel. Local frontend supports OTP login, required name/WhatsApp/date-of-birth, profile editing, session-only cookies, logout and checkout account gating. Real API and browser OTP tests, RLS denial checks, Svelte checks/build and mobile layout checks passed. Public frontend remains unchanged. Email changes/deletion and real order/catalogue phases remain pending. Checkout is still a browser-local demonstration.


## First Admin login implemented ? 16 November 2026

The live loopback-only backend has one pending first-Admin membership linked to
the verified owner?s Auth user ID. A fresh customer sign-in allows that owner
to set a password and verify an authenticator-app TOTP factor. Setup then
requires a separate password-plus-TOTP Admin sign-in. A distinct Admin session
is issued only after both factors, and membership and factor status are checked
on each Admin request. The local customer account shows the Admin shortcut only
for a server-verified pending or active membership. The frontend remains local.
Live anonymous, cross-origin, forged-session and RLS denial checks passed. The
Admin workspace currently has a secure entry screen; invitation management,
customer editing, catalogue, orders, recovery and audit work remain.
