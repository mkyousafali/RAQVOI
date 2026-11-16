BEGIN;
ALTER TABLE public.admin_memberships
 ADD COLUMN is_owner boolean NOT NULL DEFAULT false,
 ADD COLUMN can_manage_admins boolean NOT NULL DEFAULT false,
 ADD COLUMN can_view_customers boolean NOT NULL DEFAULT false;
-- The protected deployment runner supplies the existing verified owner's UUID.
UPDATE public.admin_memberships SET is_owner=true,can_manage_admins=true,can_view_customers=true
 WHERE user_id=nullif(current_setting('request.bootstrap.owner',true),'')::uuid AND status='active';
DO $$ BEGIN
 IF (SELECT count(*) FROM public.admin_memberships WHERE is_owner)<>1 THEN
  RAISE EXCEPTION 'Exactly one existing active Owner must be selected';
 END IF;
END $$;
CREATE UNIQUE INDEX single_admin_owner ON public.admin_memberships(is_owner) WHERE is_owner;
ALTER TABLE public.admin_memberships ADD CONSTRAINT owner_must_remain_active CHECK (NOT is_owner OR status='active');
ALTER TABLE public.admin_access_events DROP CONSTRAINT admin_access_events_action_check;
ALTER TABLE public.admin_access_events ADD CONSTRAINT admin_access_events_action_check
 CHECK (action IN ('invite','cancel','disable','enable','permissions','accept'));
CREATE OR REPLACE FUNCTION public.raqvoi_manage_admins(operation text, target text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 actor uuid := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
 result jsonb;
 target_id uuid;
 actor_owner boolean;
 actor_manage boolean;
 settings jsonb;
 normalized text := lower(btrim(target));
BEGIN
 IF operation IN ('disable','enable','permissions') THEN LOCK TABLE public.admin_memberships IN SHARE ROW EXCLUSIVE MODE; END IF;
 IF current_user IS NULL OR current_setting('request.admin.verified', true) IS DISTINCT FROM 'true'
  OR NOT EXISTS (SELECT 1 FROM public.admin_memberships m JOIN auth.users u ON u.id=m.user_id
   WHERE m.user_id=actor AND m.status='active' AND lower(u.email)=m.email AND u.email_confirmed_at IS NOT NULL)
 THEN RAISE EXCEPTION 'Admin authorization required' USING ERRCODE='42501'; END IF;

 SELECT is_owner,can_manage_admins INTO actor_owner,actor_manage FROM public.admin_memberships WHERE user_id=actor;
 IF operation IN ('disable','enable','permissions') AND NOT actor_owner THEN
  RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501';
 END IF;
 IF operation IN ('list','invite','cancel') AND NOT (actor_owner OR actor_manage) THEN
  RAISE EXCEPTION 'Admin management permission required' USING ERRCODE='42501';
 END IF;
 IF operation='list' THEN
  SELECT coalesce(jsonb_agg(row_data ORDER BY sort_at DESC), '[]'::jsonb) INTO result FROM (
   SELECT jsonb_build_object('id',m.user_id,'email',m.email,'status',m.status,
    'isOwner',m.is_owner,'permissions',jsonb_build_object('admins',m.can_manage_admins,'customers',m.can_view_customers),'createdAt',m.created_at,'lastLoginAt',m.last_login_at,'activatedAt',m.activated_at,'self',m.user_id=actor,'kind','member') AS row_data,
    m.created_at AS sort_at FROM public.admin_memberships m
   UNION ALL
   SELECT jsonb_build_object('id',i.id,'email',i.email,
    'status',CASE WHEN i.revoked_at IS NOT NULL THEN 'cancelled' WHEN i.expires_at<=now() THEN 'expired' ELSE 'invited' END,
    'createdAt',i.created_at,'expiresAt',i.expires_at,'self',false,'kind','invitation'),i.created_at
   FROM public.admin_invitations i WHERE i.accepted_at IS NULL
  ) rows;
  RETURN result;
 ELSIF operation='login' THEN
  UPDATE public.admin_memberships SET last_login_at=now() WHERE user_id=actor AND status='active';
  RETURN jsonb_build_object('recorded',true);
 ELSIF operation='invite' THEN
  IF normalized IS NULL OR length(normalized)>254 OR normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
   THEN RAISE EXCEPTION 'Invalid invitation email' USING ERRCODE='22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.admin_memberships WHERE email=normalized AND status IN ('active','pending'))
   THEN RAISE EXCEPTION 'This email already has Admin access or setup pending' USING ERRCODE='23505'; END IF;
  INSERT INTO public.admin_invitations(email,invited_by) VALUES(normalized,actor)
   ON CONFLICT(email) DO UPDATE SET invited_by=actor,created_at=now(),expires_at=now()+interval '7 days',accepted_at=NULL,revoked_at=NULL;
  INSERT INTO public.admin_access_events(actor_id,action,target) VALUES(actor,'invite',normalized);
  RETURN jsonb_build_object('invited',true);
 ELSIF operation='cancel' THEN
  UPDATE public.admin_invitations SET revoked_at=now() WHERE id=target::uuid AND accepted_at IS NULL AND revoked_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation is no longer available' USING ERRCODE='22023'; END IF;
  INSERT INTO public.admin_access_events(actor_id,action,target) VALUES(actor,'cancel',target);
  RETURN jsonb_build_object('cancelled',true);
 ELSIF operation='permissions' THEN
  settings := target::jsonb;
  target_id := (settings->>'id')::uuid;
  IF NOT (settings ? 'admins' AND settings ? 'customers')
   OR jsonb_typeof(settings->'admins') IS DISTINCT FROM 'boolean'
   OR jsonb_typeof(settings->'customers') IS DISTINCT FROM 'boolean'
   THEN RAISE EXCEPTION 'Invalid permissions' USING ERRCODE='22023'; END IF;
  UPDATE public.admin_memberships SET can_manage_admins=(settings->>'admins')::boolean,
   can_view_customers=(settings->>'customers')::boolean,updated_at=now()
   WHERE user_id=target_id AND NOT is_owner;
  IF NOT FOUND THEN RAISE EXCEPTION 'Admin is protected or unavailable' USING ERRCODE='22023'; END IF;
  INSERT INTO public.admin_access_events(actor_id,action,target) VALUES(actor,'permissions',target);
  RETURN jsonb_build_object('updated',true);
 ELSIF operation='enable' THEN
  UPDATE public.admin_memberships SET status=CASE WHEN password_set_at IS NOT NULL AND activated_at IS NOT NULL THEN 'active' ELSE 'pending' END,
   updated_at=now() WHERE user_id=target::uuid AND status='disabled' AND NOT is_owner;
  IF NOT FOUND THEN RAISE EXCEPTION 'Admin is protected or unavailable' USING ERRCODE='22023'; END IF;
  INSERT INTO public.admin_access_events(actor_id,action,target) VALUES(actor,'enable',target);
  RETURN jsonb_build_object('enabled',true);
 ELSIF operation='disable' THEN
  target_id := target::uuid;
  IF target_id=actor THEN RAISE EXCEPTION 'You cannot disable your own Admin access' USING ERRCODE='22023'; END IF;
  UPDATE public.admin_memberships SET status='disabled',updated_at=now() WHERE user_id=target_id AND NOT is_owner AND status IN ('pending','active');
  IF NOT FOUND THEN RAISE EXCEPTION 'Admin access is no longer available' USING ERRCODE='22023'; END IF;
  INSERT INTO public.admin_access_events(actor_id,action,target) VALUES(actor,'disable',target);
  RETURN jsonb_build_object('disabled',true);
 ELSE RAISE EXCEPTION 'Unknown management operation' USING ERRCODE='22023';
 END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.raqvoi_accept_admin_invitation()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 actor uuid := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
 verified_email text;
 invitation uuid;
BEGIN
 SELECT lower(email) INTO verified_email FROM auth.users WHERE id=actor AND email_confirmed_at IS NOT NULL;
 IF verified_email IS NULL THEN RETURN; END IF;
 SELECT id INTO invitation FROM public.admin_invitations WHERE email=verified_email
  AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at>now() FOR UPDATE;
 IF invitation IS NULL THEN RETURN; END IF;
 INSERT INTO public.admin_memberships(user_id,email) VALUES(actor,verified_email)
  ON CONFLICT(user_id) DO UPDATE SET status='pending',email=excluded.email,
   password_set_at=NULL,activated_at=NULL,can_manage_admins=false,can_view_customers=false,updated_at=now()
  WHERE public.admin_memberships.status='disabled';
 UPDATE public.admin_invitations SET accepted_at=now() WHERE id=invitation;
 INSERT INTO public.admin_access_events(actor_id,action,target) VALUES(actor,'accept',invitation::text);
END;
$$;
COMMIT;
