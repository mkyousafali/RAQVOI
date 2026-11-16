\set ON_ERROR_STOP on
BEGIN;
INSERT INTO auth.users(id,email) VALUES
  ('20000000-0000-4000-8000-000000000001','admin-rls-one@example.invalid'),
  ('20000000-0000-4000-8000-000000000002','admin-rls-two@example.invalid');
INSERT INTO public.admin_memberships(user_id,email,status,password_set_at,activated_at) VALUES
  ('20000000-0000-4000-8000-000000000001','admin-rls-one@example.invalid','pending',NULL,NULL),
  ('20000000-0000-4000-8000-000000000002','admin-rls-two@example.invalid','active',now(),now());

SET LOCAL ROLE raqvoi_customer_api;
DO $$ BEGIN
  IF EXISTS(SELECT FROM public.admin_memberships) THEN RAISE EXCEPTION 'Anonymous membership leak'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.admin_memberships) <> 1 THEN RAISE EXCEPTION 'Own membership read failed'; END IF;
  IF EXISTS(SELECT FROM public.admin_memberships WHERE user_id='20000000-0000-4000-8000-000000000002') THEN
    RAISE EXCEPTION 'Other membership leaked';
  END IF;
  UPDATE public.admin_memberships SET password_set_at=now() WHERE user_id='20000000-0000-4000-8000-000000000001';
  IF NOT FOUND THEN RAISE EXCEPTION 'Own pending password setup failed'; END IF;
  UPDATE public.admin_memberships SET password_set_at=now() WHERE user_id='20000000-0000-4000-8000-000000000002';
  IF FOUND THEN RAISE EXCEPTION 'Other membership password setup allowed'; END IF;
  BEGIN
    UPDATE public.admin_memberships SET status='active' WHERE user_id='20000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Customer role changed Admin status';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    DELETE FROM public.admin_memberships;
    RAISE EXCEPTION 'Customer role deleted Admin membership';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
  UPDATE public.admin_memberships SET password_set_at=now()
    WHERE user_id='20000000-0000-4000-8000-000000000002';
  IF FOUND THEN RAISE EXCEPTION 'Active Admin password setup allowed through pending-only policy'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
RESET ROLE;

SET LOCAL ROLE raqvoi_admin_api;
SELECT set_config('request.admin.verified','false',true);
DO $$ BEGIN
  IF EXISTS(SELECT FROM public.admin_memberships) THEN RAISE EXCEPTION 'Unverified Admin read allowed'; END IF;
  UPDATE public.admin_memberships SET status='active',activated_at=now()
    WHERE user_id='20000000-0000-4000-8000-000000000001';
  IF FOUND THEN RAISE EXCEPTION 'Unverified Admin activation allowed'; END IF;
END $$;
SELECT set_config('request.admin.verified','true',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.admin_memberships) <> 1 THEN RAISE EXCEPTION 'Verified self-read failed'; END IF;
  BEGIN
    UPDATE public.admin_memberships SET status='disabled'
      WHERE user_id='20000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Verified role bypassed pending-to-active check';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE public.admin_memberships SET status='active',activated_at=now()
    WHERE user_id='20000000-0000-4000-8000-000000000001';
  IF NOT FOUND THEN RAISE EXCEPTION 'Verified self-activation failed'; END IF;
  BEGIN
    UPDATE public.admin_memberships SET status='disabled'
      WHERE user_id='20000000-0000-4000-8000-000000000001';
    IF FOUND THEN RAISE EXCEPTION 'Self-demotion allowed by activation policy'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE public.admin_memberships SET status='disabled'
    WHERE user_id='20000000-0000-4000-8000-000000000002';
  IF FOUND THEN RAISE EXCEPTION 'Other Admin modification allowed'; END IF;
  BEGIN
    UPDATE public.admin_memberships SET email='other@example.invalid'
      WHERE user_id='20000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Admin API role changed membership email';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO public.admin_memberships(user_id,email) VALUES
      ('20000000-0000-4000-8000-000000000003','forged@example.invalid');
    RAISE EXCEPTION 'Admin API role issued an invitation';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM * FROM public.admin_memberships;
    RAISE EXCEPTION 'Anon membership read allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN PERFORM * FROM public.admin_memberships;
    RAISE EXCEPTION 'Browser authenticated role membership read allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
