/*
# Multi-farm access helper functions

1. New functions
- is_platform_admin(): true when the current user is a super administrator.
- is_farm_member(farm_id): true when the current user has an active membership in that farm.
- has_farm_permission(farm_id, permission): true when the current user may perform a permission-controlled action in that farm.
  - Super administrators: always true.
  - Farm must be active (suspended or archived farms are read-only for everyone except super administrators).
  - Owners and administrators: true for every permission.
  - Employees: true only when the matching permission is granted and not revoked.

2. Modified tables
- None.

3. Security
- The functions are SECURITY DEFINER so that policies can check membership without recursion into the tables they protect.
- The search_path is fixed to an empty value and every object is fully qualified, so a caller cannot redirect the functions to other objects.
- EXECUTE is revoked from PUBLIC and anon; only authenticated users may call them.

4. Important notes
- With no signed-in user, auth.uid() is null and every function returns false.
*/

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_farm_member(p_farm_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.farm_memberships m
    WHERE m.farm_id = p_farm_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_farm_permission(p_farm_id uuid, p_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_farm_status text;
  v_membership_id uuid;
  v_role text;
BEGIN
  IF public.is_platform_admin() THEN
    RETURN true;
  END IF;

  SELECT f.status INTO v_farm_status FROM public.farms f WHERE f.id = p_farm_id;
  IF v_farm_status IS DISTINCT FROM 'active' THEN
    RETURN false;
  END IF;

  SELECT m.id, m.role INTO v_membership_id, v_role
  FROM public.farm_memberships m
  WHERE m.farm_id = p_farm_id
    AND m.user_id = auth.uid()
    AND m.status = 'active';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.membership_permissions mp
    WHERE mp.membership_id = v_membership_id
      AND mp.permission = p_permission
      AND mp.granted
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_farm_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_farm_permission(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_farm_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_farm_permission(uuid, text) TO authenticated;
