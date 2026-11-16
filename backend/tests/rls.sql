\set ON_ERROR_STOP on
BEGIN;
INSERT INTO auth.users(id,email) VALUES ('10000000-0000-4000-8000-000000000001','rls-test-one@example.invalid'),('10000000-0000-4000-8000-000000000002','rls-test-two@example.invalid');
INSERT INTO public.customer_profiles(user_id,name,whatsapp,date_of_birth) VALUES ('10000000-0000-4000-8000-000000000001','RLS Test One','+919999999991','2000-01-01'),('10000000-0000-4000-8000-000000000002','RLS Test Two','+919999999992','2000-01-01');
SET LOCAL ROLE raqvoi_customer_api;
DO $$ BEGIN IF EXISTS(SELECT FROM public.customer_profiles) THEN RAISE EXCEPTION 'Anonymous profile leak'; END IF; END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.customer_profiles)<>1 THEN RAISE EXCEPTION 'Ownership read failed'; END IF;
 IF EXISTS(SELECT FROM public.customer_profiles WHERE user_id='10000000-0000-4000-8000-000000000002') THEN RAISE EXCEPTION 'Other-user leak'; END IF;
 UPDATE public.customer_profiles SET name='Permitted Edit' WHERE user_id='10000000-0000-4000-8000-000000000001';
 IF NOT FOUND THEN RAISE EXCEPTION 'Owner update failed'; END IF;
 UPDATE public.customer_profiles SET name='Forbidden Edit' WHERE user_id='10000000-0000-4000-8000-000000000002';
 IF FOUND THEN RAISE EXCEPTION 'Other-user update allowed'; END IF;
 BEGIN
  UPDATE public.customer_profiles SET user_id='10000000-0000-4000-8000-000000000003';
  RAISE EXCEPTION 'Ownership transfer allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  DELETE FROM public.customer_profiles;
  RAISE EXCEPTION 'Delete allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM * FROM public.customer_profiles; RAISE EXCEPTION 'Anon grant leak'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM * FROM public.customer_profiles; RAISE EXCEPTION 'Direct browser grant leak'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
