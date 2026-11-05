/*
# RLS performance and foreign key indexes

1. Changes
- Re-create the SELECT and write policies that call auth.uid() so that the call is evaluated once per statement instead of once per row.
- Add covering indexes on foreign key columns that had none: audit_log.user_id, invitations.created_by, invitations.accepted_by.

2. Security
- No change to who can read or write. Each policy keeps exactly the same predicate; only the way auth.uid() is evaluated changes.
- Policies are dropped and re-created in the same migration with the same names.

3. Notes
- Re-runnable: every statement uses IF EXISTS / IF NOT EXISTS or DROP POLICY IF EXISTS.
- No data is modified.
*/

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.farm_memberships theirs
    WHERE theirs.user_id = public.profiles.id
      AND public.is_farm_member(theirs.farm_id)
  )
);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "platform_admins_select" ON public.platform_admins;
CREATE POLICY "platform_admins_select" ON public.platform_admins FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.is_platform_admin());

DROP POLICY IF EXISTS "farms_select" ON public.farms;
CREATE POLICY "farms_select" ON public.farms FOR SELECT
TO authenticated
USING (
  public.is_platform_admin()
  OR owner_id = (SELECT auth.uid())
  OR public.is_farm_member(id)
);

DROP POLICY IF EXISTS "farm_memberships_select" ON public.farm_memberships;
CREATE POLICY "farm_memberships_select" ON public.farm_memberships FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.is_farm_member(farm_id)
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS "membership_permissions_select" ON public.membership_permissions;
CREATE POLICY "membership_permissions_select" ON public.membership_permissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farm_memberships m
    WHERE m.id = public.membership_permissions.membership_id
      AND (
        m.user_id = (SELECT auth.uid())
        OR public.is_farm_member(m.farm_id)
        OR public.is_platform_admin()
      )
  )
);

CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON public.audit_log (user_id);
CREATE INDEX IF NOT EXISTS invitations_created_by_idx ON public.invitations (created_by);
CREATE INDEX IF NOT EXISTS invitations_accepted_by_idx ON public.invitations (accepted_by);
