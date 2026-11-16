BEGIN;
CREATE TABLE public.admin_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 254),
 invited_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
 accepted_at timestamptz,
 revoked_at timestamptz
);
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_invitations FROM PUBLIC, anon, authenticated, raqvoi_customer_api, raqvoi_admin_api;

CREATE TABLE public.admin_access_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id uuid NOT NULL REFERENCES auth.users(id),
 action text NOT NULL CHECK (action IN ('invite','cancel','disable','accept')),
 target text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_access_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_access_events FROM PUBLIC, anon, authenticated, raqvoi_customer_api, raqvoi_admin_api;

-- These narrow server-only functions are the management boundary. Their owner
-- must read Auth identities and memberships without recursive RLS policies.
-- Caller identity and MFA are established by the API, never request payloads.
CREATE FUNCTION public.raqvoi_manage_admins(operation text, target text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 actor uuid := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
 result jsonb;
 target_id uuid;
 normalized text := lower(btrim(target));
BEGIN
 IF operation='disable' THEN LOCK TABLE public.admin_memberships IN SHARE ROW EXCLUSIVE MODE; END IF;
 IF current_user IS NULL OR current_setting('request.admin.verified', true) IS DISTINCT FROM 'true'
  OR NOT EXISTS (SELECT 1 FROM public.admin_memberships m JOIN auth.users u ON u.id=m.user_id
   WHERE m.user_id=actor AND m.status='active' AND lower(u.email)=m.email AND u.email_confirmed_at IS NOT NULL)
 THEN RAISE EXCEPTION 'Admin authorization required' USING ERRCODE='42501'; END IF;

 IF operation='list' THEN
  SELECT coalesce(jsonb_agg(row_data ORDER BY sort_at DESC), '[]'::jsonb) INTO result FROM (
   SELECT jsonb_build_object('id',m.user_id,'email',m.email,'status',m.status,
    'createdAt',m.created_at,'activatedAt',m.activated_at,'self',m.user_id=actor,'kind','member') AS row_data,
    m.created_at AS sort_at FROM public.admin_memberships m
   UNION ALL
   SELECT jsonb_build_object('id',i.id,'email',i.email,
    'status',CASE WHEN i.revoked_at IS NOT NULL THEN 'cancelled' WHEN i.expires_at<=now() THEN 'expired' ELSE 'invited' END,
    'createdAt',i.created_at,'expiresAt',i.expires_at,'self',false,'kind','invitation'),i.created_at
   FROM public.admin_invitations i WHERE i.accepted_at IS NULL
  ) rows;
  RETURN result;
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
 ELSIF operation='disable' THEN
  target_id := target::uuid;
  IF target_id=actor THEN RAISE EXCEPTION 'You cannot disable your own Admin access' USING ERRCODE='22023'; END IF;
  UPDATE public.admin_memberships SET status='disabled',updated_at=now() WHERE user_id=target_id AND status IN ('pending','active');
  IF NOT FOUND THEN RAISE EXCEPTION 'Admin access is no longer available' USING ERRCODE='22023'; END IF;
  INSERT INTO public.admin_access_events(actor_id,action,target) VALUES(actor,'disable',target);
  RETURN jsonb_build_object('disabled',true);
 ELSE RAISE EXCEPTION 'Unknown management operation' USING ERRCODE='22023';
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.raqvoi_manage_admins(text,text) FROM PUBLIC, anon, authenticated, raqvoi_customer_api;
GRANT EXECUTE ON FUNCTION public.raqvoi_manage_admins(text,text) TO raqvoi_admin_api;

-- An invitation grants pending setup only to the Auth identity that has proved
-- ownership of the exact email. The browser cannot choose the identity/email.
CREATE FUNCTION public.raqvoi_accept_admin_invitation()
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
   password_set_at=NULL,activated_at=NULL,updated_at=now()
  WHERE public.admin_memberships.status='disabled';
 UPDATE public.admin_invitations SET accepted_at=now() WHERE id=invitation;
 INSERT INTO public.admin_access_events(actor_id,action,target) VALUES(actor,'accept',invitation::text);
END;
$$;
REVOKE ALL ON FUNCTION public.raqvoi_accept_admin_invitation() FROM PUBLIC, anon, authenticated, raqvoi_admin_api;
GRANT EXECUTE ON FUNCTION public.raqvoi_accept_admin_invitation() TO raqvoi_customer_api;
COMMIT;
