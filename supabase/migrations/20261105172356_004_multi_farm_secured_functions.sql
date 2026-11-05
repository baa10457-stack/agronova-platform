/*
# Secured multi-farm business functions and append-only audit log

1. New functions (all SECURITY DEFINER, search_path fixed to empty, every object fully qualified)
- create_farm(...): creates a farm owned by the caller and gives the caller the owner membership, in one step.
- set_farm_status(farm_id, status): changes a farm to active, suspended or archived. Super administrators only.
- create_invitation(farm_id, email, role): creates a pending invitation and returns the one-time token. Requires members.manage. Only owners can invite administrators.
- accept_invitation(token): claims a pending, unexpired invitation addressed to the caller's own email, then creates the membership. The claim and the check happen in a single statement.
- revoke_invitation(invitation_id): cancels a pending invitation. Requires members.manage on its farm.

2. Trigger
- audit_log rejects every UPDATE and DELETE, so the history is append-only.

3. Modified tables
- None.

4. Security
- EXECUTE is revoked from PUBLIC and anon on every function; only authenticated users may call them.
- Each function derives the acting user from the session, never from a parameter.
- Invitation tokens are 256-bit random values. Only their SHA-256 hash is stored, so a database leak does not reveal usable tokens.
- Invitations expire after 7 days.
- Error messages are generic and do not reveal whether an email or farm exists.

5. Important notes
- Changing a member's role or permissions and removing members is intentionally not included yet; it will be added with the staff management step.
- Email delivery is not connected: the invitation token is returned once to the administrator who created it.
*/

CREATE OR REPLACE FUNCTION public.create_farm(
  p_name text,
  p_address text,
  p_location text,
  p_phone text,
  p_email text,
  p_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_farm_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.farms (name, address, location, phone, email, description, owner_id)
  VALUES (
    btrim(p_name),
    nullif(btrim(p_address), ''),
    nullif(btrim(p_location), ''),
    nullif(btrim(p_phone), ''),
    nullif(lower(btrim(p_email)), ''),
    nullif(btrim(p_description), ''),
    v_uid
  )
  RETURNING id INTO v_farm_id;

  INSERT INTO public.farm_memberships (farm_id, user_id, role, status)
  VALUES (v_farm_id, v_uid, 'owner', 'active');

  INSERT INTO public.audit_log (farm_id, user_id, action, description)
  VALUES (v_farm_id, v_uid, 'farm.created', 'Farm created');

  RETURN v_farm_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_farm_status(p_farm_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('active', 'suspended', 'archived') THEN
    RAISE EXCEPTION 'Invalid status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.farms SET status = p_status WHERE id = p_farm_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Farm not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.audit_log (farm_id, user_id, action, description)
  VALUES (p_farm_id, auth.uid(), 'farm.status_changed', 'Farm status set to ' || p_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_invitation(p_farm_id uuid, p_email text, p_role text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(p_email));
  v_token text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT public.has_farm_permission(p_farm_id, 'members.manage') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_role NOT IN ('admin', 'employee') THEN
    RAISE EXCEPTION 'Invalid role' USING ERRCODE = '22023';
  END IF;

  IF p_role = 'admin' AND NOT (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.farm_memberships m
      WHERE m.farm_id = p_farm_id AND m.user_id = v_uid AND m.role = 'owner' AND m.status = 'active'
    )
  ) THEN
    RAISE EXCEPTION 'Only the farm owner can invite administrators' USING ERRCODE = '42501';
  END IF;

  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(v_email) > 254 THEN
    RAISE EXCEPTION 'Invalid email address' USING ERRCODE = '22023';
  END IF;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  BEGIN
    INSERT INTO public.invitations (farm_id, email, role, token_hash, status, expires_at, created_by)
    VALUES (
      p_farm_id,
      v_email,
      p_role,
      encode(extensions.digest(v_token, 'sha256'), 'hex'),
      'pending',
      now() + interval '7 days',
      v_uid
    );
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'A pending invitation already exists for this email' USING ERRCODE = '23505';
  END;

  INSERT INTO public.audit_log (farm_id, user_id, action, description)
  VALUES (p_farm_id, v_uid, 'invitation.created', 'Invitation created with role ' || p_role);

  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(auth.jwt() ->> 'email'));
  v_farm_id uuid;
  v_role text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_token IS NULL OR char_length(p_token) <> 64 THEN
    RAISE EXCEPTION 'Invitation is invalid or has expired' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.invitations i
  SET status = 'accepted', accepted_by = v_uid, accepted_at = now()
  WHERE i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    AND i.status = 'pending'
    AND i.expires_at > now()
    AND i.email = v_email
  RETURNING i.farm_id, i.role INTO v_farm_id, v_role;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation is invalid or has expired' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.farms f WHERE f.id = v_farm_id AND f.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Invitation is invalid or has expired' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.farm_memberships m WHERE m.farm_id = v_farm_id AND m.user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'You are already a member of this farm' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.farm_memberships (farm_id, user_id, role, status)
  VALUES (v_farm_id, v_uid, v_role, 'active');

  INSERT INTO public.audit_log (farm_id, user_id, action, description)
  VALUES (v_farm_id, v_uid, 'member.joined', 'Member joined with role ' || v_role);

  RETURN v_farm_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_farm_id uuid;
BEGIN
  SELECT i.farm_id INTO v_farm_id FROM public.invitations i WHERE i.id = p_invitation_id;

  IF v_farm_id IS NULL OR NOT public.has_farm_permission(v_farm_id, 'members.manage') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.invitations SET status = 'revoked'
  WHERE id = p_invitation_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation is no longer pending' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.audit_log (farm_id, user_id, action, description)
  VALUES (v_farm_id, auth.uid(), 'invitation.revoked', 'Invitation revoked');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_farm(text, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_farm_status(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_invitation(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_invitation(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_farm(text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_farm_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_invitation(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_invitation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_audit_log_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only' USING ERRCODE = '42501';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_audit_log_changes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_log_append_only ON public.audit_log;
CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_changes();
