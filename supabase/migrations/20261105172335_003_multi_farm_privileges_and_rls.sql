/*
# Multi-farm privileges and row level security policies

1. Privileges
- Every new table starts from zero: all default privileges granted to anon and authenticated are revoked first.
- authenticated users receive only the privileges the application needs:
  - profiles: read, create own profile, update own name, phone and avatar. Nothing else.
  - farms: read; update descriptive fields only (name, address, location, phone, email, description). Owner, status and creation date cannot be changed directly.
  - farm_memberships, membership_permissions, audit_log: read only.
  - invitations: read of metadata only; the token hash is never exposed.
  - platform_admins: read of its own rows only.
- No table grants INSERT, UPDATE or DELETE on sensitive tables to clients. Those actions go through the secured functions created in the next migration.

2. Row level security policies
- profiles: a user sees and edits only their own profile; members of the same active farm can see each other's profile; super administrators see all.
- platform_admins: a user can see their own row; only super administrators can see the list. Nobody can insert, update or delete it through the API.
- farms: visible to super administrators, the owner, and active members. Updated only by users with the farm.manage permission, and only while the farm is active.
- farm_memberships: visible to the member, to active members of the same farm, and to super administrators.
- membership_permissions: visible to the same audience as the membership it belongs to.
- invitations: visible only to users holding the members.manage permission on the farm.
- audit_log: visible to super administrators and to users holding the audit.view permission on the farm.

3. Modified tables
- No structure change. Only privileges and policies are added.

4. Important notes
- Each policy is idempotent: it is dropped first if it already exists.
- Table-level privileges are restricted to the columns listed above, so a user cannot write a role, status or owner value directly even on rows they own.
*/

-- profiles
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (id, full_name, phone, avatar_url) ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, avatar_url) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.farm_memberships theirs
      WHERE theirs.user_id = profiles.id
        AND public.is_farm_member(theirs.farm_id)
    )
  );

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- platform_admins (no write privilege for any client role)
REVOKE ALL ON public.platform_admins FROM anon, authenticated;
GRANT SELECT (id, user_id, created_at) ON public.platform_admins TO authenticated;

DROP POLICY IF EXISTS platform_admins_select ON public.platform_admins;
CREATE POLICY platform_admins_select ON public.platform_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

-- farms
REVOKE ALL ON public.farms FROM anon, authenticated;
GRANT SELECT ON public.farms TO authenticated;
GRANT UPDATE (name, address, location, phone, email, description) ON public.farms TO authenticated;

DROP POLICY IF EXISTS farms_select ON public.farms;
CREATE POLICY farms_select ON public.farms FOR SELECT
  TO authenticated
  USING (
    public.is_platform_admin()
    OR owner_id = auth.uid()
    OR public.is_farm_member(id)
  );

DROP POLICY IF EXISTS farms_update ON public.farms;
CREATE POLICY farms_update ON public.farms FOR UPDATE
  TO authenticated
  USING (public.has_farm_permission(id, 'farm.manage'))
  WITH CHECK (public.has_farm_permission(id, 'farm.manage'));

-- farm_memberships (read only; changes go through secured functions)
REVOKE ALL ON public.farm_memberships FROM anon, authenticated;
GRANT SELECT ON public.farm_memberships TO authenticated;

DROP POLICY IF EXISTS farm_memberships_select ON public.farm_memberships;
CREATE POLICY farm_memberships_select ON public.farm_memberships FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_farm_member(farm_id)
    OR public.is_platform_admin()
  );

-- membership_permissions (read only)
REVOKE ALL ON public.membership_permissions FROM anon, authenticated;
GRANT SELECT ON public.membership_permissions TO authenticated;

DROP POLICY IF EXISTS membership_permissions_select ON public.membership_permissions;
CREATE POLICY membership_permissions_select ON public.membership_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.farm_memberships m
      WHERE m.id = membership_permissions.membership_id
        AND (
          m.user_id = auth.uid()
          OR public.is_farm_member(m.farm_id)
          OR public.is_platform_admin()
        )
    )
  );

-- invitations (metadata only; token_hash is never granted)
REVOKE ALL ON public.invitations FROM anon, authenticated;
GRANT SELECT (id, farm_id, email, role, status, expires_at, created_by, created_at, accepted_by, accepted_at)
  ON public.invitations TO authenticated;

DROP POLICY IF EXISTS invitations_select ON public.invitations;
CREATE POLICY invitations_select ON public.invitations FOR SELECT
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'members.manage'));

-- audit_log (read only; rows are written by secured functions)
REVOKE ALL ON public.audit_log FROM anon, authenticated;
GRANT SELECT ON public.audit_log TO authenticated;

DROP POLICY IF EXISTS audit_log_select ON public.audit_log;
CREATE POLICY audit_log_select ON public.audit_log FOR SELECT
  TO authenticated
  USING (
    public.is_platform_admin()
    OR (farm_id IS NOT NULL AND public.has_farm_permission(farm_id, 'audit.view'))
  );
