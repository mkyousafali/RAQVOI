BEGIN;
-- The deployment provisioner creates a dedicated LOGIN role with no bypass privileges.
CREATE TABLE public.customer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 80),
  whatsapp text NOT NULL CHECK (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  date_of_birth date NOT NULL CHECK (date_of_birth >= DATE '1900-01-01'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_profiles FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO raqvoi_customer_api;
GRANT SELECT, INSERT, UPDATE ON public.customer_profiles TO raqvoi_customer_api;
CREATE POLICY customer_profile_read ON public.customer_profiles FOR SELECT TO raqvoi_customer_api
  USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
CREATE POLICY customer_profile_insert ON public.customer_profiles FOR INSERT TO raqvoi_customer_api
  WITH CHECK (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
CREATE POLICY customer_profile_update ON public.customer_profiles FOR UPDATE TO raqvoi_customer_api
  USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
COMMIT;
