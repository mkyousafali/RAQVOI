BEGIN;
-- The deployment runner creates raqvoi_admin_api as a distinct, non-owner,
-- non-bypass LOGIN role before applying this migration. Only the controlled
-- server-side bootstrap can insert the first pending membership.
CREATE TABLE public.admin_memberships (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE CHECK (
    length(email) BETWEEN 3 AND 254
    AND email = lower(btrim(email))
    AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'disabled')),
  password_set_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT active_admin_is_enrolled CHECK (
    status <> 'active' OR (password_set_at IS NOT NULL AND activated_at IS NOT NULL)
  )
);

ALTER TABLE public.admin_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_memberships FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_memberships FROM PUBLIC, anon, authenticated,
  raqvoi_customer_api, raqvoi_admin_api;
GRANT USAGE ON SCHEMA public TO raqvoi_admin_api;

-- This role is used for the verified customer session and for the initial
-- password sign-in membership lookup. The API checks that the Auth email is
-- verified and still equals this row's email before showing an Admin entry.
GRANT SELECT ON public.admin_memberships TO raqvoi_customer_api;
CREATE POLICY admin_membership_owner_read
  ON public.admin_memberships FOR SELECT TO raqvoi_customer_api
  USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);

-- The password is changed through Supabase Auth, never stored here. The API
-- marks this timestamp only after Auth confirms that operation succeeded.
GRANT UPDATE (password_set_at, updated_at)
  ON public.admin_memberships TO raqvoi_customer_api;
CREATE POLICY admin_membership_owner_password_setup
  ON public.admin_memberships FOR UPDATE TO raqvoi_customer_api
  USING (
    user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    AND status = 'pending'
  )
  WITH CHECK (
    user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    AND status = 'pending'
  );

-- raqvoi_admin_api is used only after the backend has verified a TOTP factor
-- with Supabase Auth. The backend sets both transaction-local claims itself.
GRANT SELECT ON public.admin_memberships TO raqvoi_admin_api;
GRANT UPDATE (status, activated_at, updated_at)
  ON public.admin_memberships TO raqvoi_admin_api;
CREATE POLICY admin_membership_verified_owner_read
  ON public.admin_memberships FOR SELECT TO raqvoi_admin_api
  USING (
    user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    AND current_setting('request.admin.verified', true) = 'true'
  );
CREATE POLICY admin_membership_verified_self_activate
  ON public.admin_memberships FOR UPDATE TO raqvoi_admin_api
  USING (
    user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    AND status = 'pending'
    AND current_setting('request.admin.verified', true) = 'true'
  )
  WITH CHECK (
    user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    AND status = 'active'
    AND current_setting('request.admin.verified', true) = 'true'
  );
COMMIT;
