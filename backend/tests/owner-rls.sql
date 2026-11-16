\set ON_ERROR_STOP on
BEGIN;
INSERT INTO auth.users(id,email,email_confirmed_at) VALUES
 ('30000000-0000-4000-8000-000000000001','owner-test-admin@example.invalid',now()),
 ('30000000-0000-4000-8000-000000000002','owner-test-guest@example.invalid',now());
INSERT INTO public.admin_memberships(user_id,email,status,password_set_at,activated_at) VALUES
 ('30000000-0000-4000-8000-000000000001','owner-test-admin@example.invalid','active',now(),now());
SELECT set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE raqvoi_admin_api;
SELECT set_config('request.admin.verified','false',true);
DO $$ BEGIN
 BEGIN PERFORM public.raqvoi_manage_admins('list'); RAISE EXCEPTION 'MFA bypass';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.admin.verified','true',true);
DO $$ BEGIN
 BEGIN PERFORM public.raqvoi_manage_admins('list'); RAISE EXCEPTION 'Section permission bypass';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.raqvoi_manage_admins('permissions','{"id":"30000000-0000-4000-8000-000000000001","admins":true,"customers":true}');
 RAISE EXCEPTION 'Self escalation'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.raqvoi_manage_admins('disable','30000000-0000-4000-8000-000000000001');
 RAISE EXCEPTION 'Owner action bypass'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN UPDATE public.admin_memberships SET is_owner=true;
 RAISE EXCEPTION 'Direct Owner column write'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM * FROM public.admin_invitations;
 RAISE EXCEPTION 'Direct invitation read'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
UPDATE public.admin_memberships SET can_manage_admins=true WHERE user_id='30000000-0000-4000-8000-000000000001';
SET LOCAL ROLE raqvoi_admin_api;
SELECT public.raqvoi_manage_admins('list');
DO $$ BEGIN
 BEGIN PERFORM public.raqvoi_manage_admins('enable','30000000-0000-4000-8000-000000000001');
 RAISE EXCEPTION 'Delegated Admin enable bypass'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.admin_memberships WHERE is_owner),true);
SET LOCAL ROLE raqvoi_admin_api;
SELECT public.raqvoi_manage_admins('permissions','{"id":"30000000-0000-4000-8000-000000000001","admins":false,"customers":true}');
SELECT public.raqvoi_manage_admins('disable','30000000-0000-4000-8000-000000000001');
SELECT public.raqvoi_manage_admins('enable','30000000-0000-4000-8000-000000000001');
DO $$ BEGIN
 BEGIN PERFORM public.raqvoi_manage_admins('disable',current_setting('request.jwt.claim.sub'));
 RAISE EXCEPTION 'Owner disabled'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
SELECT public.raqvoi_manage_admins('invite','owner-test-guest@example.invalid');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE raqvoi_customer_api;
SELECT public.raqvoi_accept_admin_invitation();
RESET ROLE;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.admin_memberships WHERE user_id='30000000-0000-4000-8000-000000000002') THEN RAISE EXCEPTION 'Wrong email accepted invite'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',true);
SET LOCAL ROLE raqvoi_customer_api;
SELECT public.raqvoi_accept_admin_invitation();
RESET ROLE;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.admin_memberships WHERE user_id='30000000-0000-4000-8000-000000000002' AND status='pending' AND NOT is_owner AND NOT can_manage_admins AND NOT can_view_customers) THEN RAISE EXCEPTION 'Invite scope incorrect'; END IF;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.raqvoi_manage_admins('list'); RAISE EXCEPTION 'Anon function access';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
