/*
# Account profile and membership management functions

1. New functions
- ensure_my_profile(full_name, phone): creates the signed-in user's profile once. Repeated calls do nothing.
- set_membership_role(membership_id, role): changes a member between admin and employee.
- set_membership_permission(membership_id, permission, granted): grants or revokes one permission for an employee.
- remove_membership(membership_id): removes a member from a farm and their permissions.

2. Security
- Every function is SECURITY DEFINER with search_path set to empty and fully qualified names.
- The acting user is always taken from auth.uid(), never from a parameter.
- Only owners and administrators of the farm (or a platform administrator) can manage memberships.
- Only the farm owner (or a platform administrator) can assign or remove the administrator role.
- The owner role can never be assigned, changed or removed through these functions.
- Permissions apply to employees only; a user cannot change their own permissions.
- EXECUTE is revoked from PUBLIC and anon and granted to authenticated only.

3. Notes
- No table is created or dropped. Existing functions are not modified.
- Each removal and change writes an entry to audit_log.
- Re-runnable: functions use CREATE OR REPLACE.
*/

CREATE OR REPLACE FUNCTION public.ensure_my_profile(p_full_name text, p_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_name text := btrim(coalesce(p_full_name, ''));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF char_length(v_name) < 2 OR char_length(v_name) > 120 THEN
    RAISE EXCEPTION 'Invalid full name' USING ERRCODE = '22023';
  END IF;

  IF p_phone IS NOT NULL AND char_length(btrim(p_phone)) > 30 THEN
    RAISE EXCEPTION 'Invalid phone number' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (v_uid, v_name, nullif(btrim(coalesce(p_phone, '')), ''))
  ON CONFLICT (id) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_membership_role(p_membership_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_farm_id uuid;
  v_current text;
  v_is_owner boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT m.farm_id, m.role INTO v_farm_id, v_current
  FROM public.farm_memberships m
  WHERE m.id = p_membership_id;

  IF v_farm_id IS NULL OR NOT (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.farm_memberships c
      WHERE c.farm_id = v_farm_id AND c.user_id = v_uid AND c.status = 'active' AND c.role IN ('owner', 'admin')
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF v_current = 'owner' THEN
    RAISE EXCEPTION 'The owner role cannot be changed' USING ERRCODE = '42501';
  END IF;

  IF p_role NOT IN ('admin', 'employee') THEN
    RAISE EXCEPTION 'Invalid role' USING ERRCODE = '22023';
  END IF;

  v_is_owner := public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.farm_memberships o
    WHERE o.farm_id = v_farm_id AND o.user_id = v_uid AND o.status = 'active' AND o.role = 'owner'
  );

  IF (v_current = 'admin' OR p_role = 'admin') AND NOT v_is_owner THEN
    RAISE EXCEPTION 'Only the farm owner can manage administrators' USING ERRCODE = '42501';
  END IF;

  IF v_current = p_role THEN
    RETURN;
  END IF;

  UPDATE public.farm_memberships SET role = p_role WHERE id = p_membership_id;

  INSERT INTO public.audit_log (farm_id, user_id, action, description)
  VALUES (v_farm_id, v_uid, 'member.role_changed', 'Role changed from ' || v_current || ' to ' || p_role);
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_membership_permission(p_membership_id uuid, p_permission text, p_granted boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_farm_id uuid;
  v_target_user uuid;
  v_role text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT m.farm_id, m.user_id, m.role INTO v_farm_id, v_target_user, v_role
  FROM public.farm_memberships m
  WHERE m.id = p_membership_id;

  IF v_farm_id IS NULL OR NOT (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.farm_memberships c
      WHERE c.farm_id = v_farm_id AND c.user_id = v_uid AND c.status = 'active' AND c.role IN ('owner', 'admin')
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF v_target_user = v_uid THEN
    RAISE EXCEPTION 'You cannot change your own permissions' USING ERRCODE = '42501';
  END IF;

  IF v_role <> 'employee' THEN
    RAISE EXCEPTION 'Permissions apply to employees only' USING ERRCODE = '22023';
  END IF;

  IF p_permission NOT IN ('farm.manage', 'members.manage', 'audit.view') OR p_granted IS NULL THEN
    RAISE EXCEPTION 'Invalid permission' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.membership_permissions (membership_id, permission, granted)
  VALUES (p_membership_id, p_permission, p_granted)
  ON CONFLICT (membership_id, permission) DO UPDATE SET granted = EXCLUDED.granted;

  INSERT INTO public.audit_log (farm_id, user_id, action, description)
  VALUES (
    v_farm_id,
    v_uid,
    'member.permission_changed',
    p_permission || CASE WHEN p_granted THEN ' granted' ELSE ' revoked' END
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_membership(p_membership_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_farm_id uuid;
  v_role text;
  v_is_owner boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT m.farm_id, m.role INTO v_farm_id, v_role
  FROM public.farm_memberships m
  WHERE m.id = p_membership_id;

  IF v_farm_id IS NULL OR NOT (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.farm_memberships c
      WHERE c.farm_id = v_farm_id AND c.user_id = v_uid AND c.status = 'active' AND c.role IN ('owner', 'admin')
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF v_role = 'owner' THEN
    RAISE EXCEPTION 'The farm owner cannot be removed' USING ERRCODE = '42501';
  END IF;

  v_is_owner := public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.farm_memberships o
    WHERE o.farm_id = v_farm_id AND o.user_id = v_uid AND o.status = 'active' AND o.role = 'owner'
  );

  IF v_role = 'admin' AND NOT v_is_owner THEN
    RAISE EXCEPTION 'Only the farm owner can remove administrators' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.farm_memberships WHERE id = p_membership_id;

  INSERT INTO public.audit_log (farm_id, user_id, action, description)
  VALUES (v_farm_id, v_uid, 'member.removed', 'Member removed (role ' || v_role || ')');
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.ensure_my_profile(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_membership_role(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_membership_permission(uuid, text, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.remove_membership(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.ensure_my_profile(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_membership_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_membership_permission(uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_membership(uuid) TO authenticated;
