import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { asRecords, asString, type Row } from '@/lib/parse';
import { FARM_ROLES, type FarmRole } from './farms';

export const PERMISSIONS = ['farm.manage', 'members.manage', 'audit.view'] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type InvitationRole = 'admin' | 'employee';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export type FarmMember = {
  membershipId: string;
  userId: string;
  role: FarmRole;
  joinedAt: string;
  fullName: string | null;
  phone: string | null;
  permissions: Partial<Record<Permission, boolean>>;
};

export type Invitation = {
  id: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
};

const INVITATION_ROLES: readonly string[] = ['admin', 'employee'];
const INVITATION_STATUSES: readonly string[] = ['pending', 'accepted', 'revoked', 'expired'];

export async function fetchMyRole(farmId: string, userId: string): Promise<FarmRole | null> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('farm_memberships')
    .select('role')
    .eq('farm_id', farmId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  const role = data && typeof data === 'object' ? asString((data as Row).role) : null;
  return role && FARM_ROLES.includes(role) ? (role as FarmRole) : null;
}

export async function fetchFarmMembers(farmId: string): Promise<FarmMember[]> {
  const supabase = createSupabaseBrowserClient();

  const { data: membershipData, error: membershipError } = await supabase
    .from('farm_memberships')
    .select('id, user_id, role, joined_at')
    .eq('farm_id', farmId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true });
  if (membershipError) throw membershipError;

  const memberships = asRecords(membershipData).flatMap((row) => {
    const membershipId = asString(row.id);
    const userId = asString(row.user_id);
    const role = asString(row.role);
    const joinedAt = asString(row.joined_at);
    if (!membershipId || !userId || !role || !joinedAt || !FARM_ROLES.includes(role)) return [];
    return [{ membershipId, userId, role: role as FarmRole, joinedAt }];
  });
  if (memberships.length === 0) return [];

  const userIds = memberships.map((m) => m.userId);
  const membershipIds = memberships.map((m) => m.membershipId);

  const [profilesResult, permissionsResult] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone').in('id', userIds),
    supabase.from('membership_permissions').select('membership_id, permission, granted').in('membership_id', membershipIds),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (permissionsResult.error) throw permissionsResult.error;

  const profiles = new Map(
    asRecords(profilesResult.data).map((row) => [asString(row.id), row] as const),
  );
  const permissionsByMembership = new Map<string, Partial<Record<Permission, boolean>>>();
  for (const row of asRecords(permissionsResult.data)) {
    const membershipId = asString(row.membership_id);
    const permission = asString(row.permission);
    if (!membershipId || !permission || !(PERMISSIONS as readonly string[]).includes(permission)) continue;
    const current = permissionsByMembership.get(membershipId) ?? {};
    current[permission as Permission] = row.granted === true;
    permissionsByMembership.set(membershipId, current);
  }

  return memberships.map((m) => {
    const profile = profiles.get(m.userId);
    return {
      ...m,
      fullName: profile ? asString(profile.full_name) : null,
      phone: profile ? asString(profile.phone) : null,
      permissions: permissionsByMembership.get(m.membershipId) ?? {},
    };
  });
}

export async function fetchInvitations(farmId: string): Promise<Invitation[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('invitations')
    .select('id, email, role, status, expires_at, created_at')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return asRecords(data).flatMap((row) => {
    const id = asString(row.id);
    const email = asString(row.email);
    const role = asString(row.role);
    const status = asString(row.status);
    const expiresAt = asString(row.expires_at);
    const createdAt = asString(row.created_at);
    if (!id || !email || !role || !status || !expiresAt || !createdAt) return [];
    if (!INVITATION_ROLES.includes(role) || !INVITATION_STATUSES.includes(status)) return [];
    return [{ id, email, role: role as InvitationRole, status: status as InvitationStatus, expiresAt, createdAt }];
  });
}

export async function createInvitation(farmId: string, email: string, role: InvitationRole): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient().rpc('create_invitation', {
    p_farm_id: farmId,
    p_email: email,
    p_role: role,
  });
  if (error) throw error;
  if (typeof data !== 'string') throw new Error('Unexpected response from create_invitation');
  return data;
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc('revoke_invitation', {
    p_invitation_id: invitationId,
  });
  if (error) throw error;
}

export async function acceptInvitation(token: string): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient().rpc('accept_invitation', { p_token: token });
  if (error) throw error;
  if (typeof data !== 'string') throw new Error('Unexpected response from accept_invitation');
  return data;
}

export async function setMemberRole(membershipId: string, role: InvitationRole): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc('set_membership_role', {
    p_membership_id: membershipId,
    p_role: role,
  });
  if (error) throw error;
}

export async function setMemberPermission(membershipId: string, permission: Permission, granted: boolean): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc('set_membership_permission', {
    p_membership_id: membershipId,
    p_permission: permission,
    p_granted: granted,
  });
  if (error) throw error;
}

export async function removeMember(membershipId: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc('remove_membership', {
    p_membership_id: membershipId,
  });
  if (error) throw error;
}
