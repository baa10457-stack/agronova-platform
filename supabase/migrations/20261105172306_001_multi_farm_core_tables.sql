/*
# Multi-farm core tables

1. New tables
- profiles: one row per user account (id = the user's auth identifier, full name, phone, avatar URL, creation date).
- platform_admins: super administrators of the whole platform. Rows are added only by the database operator, never by the application.
- farms: one row per agricultural operation (name, address, location, phone, email, description, owner, status, creation date).
- farm_memberships: links a user to a farm with a role (owner, admin, employee) and a status (active, suspended).
- membership_permissions: fine-grained permissions granted to a membership (used mainly for employees).
- invitations: pending invitations to join a farm. Only a SHA-256 hash of the invitation token is stored.
- audit_log: history of sensitive actions per farm.

2. Modified tables
- None. No existing table is altered.

3. Security
- Row level security is enabled on every new table.
- Policies and privileges are added in a later migration, so until then the tables are locked down.

4. Important notes
- Foreign keys to the authentication schema only reference it; the authentication schema itself is not changed.
- Farms and memberships use RESTRICT on delete so that deleting a farm cannot silently remove its data.
- A partial unique index guarantees a single owner per farm.
- No sample or fictitious data is inserted.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text CHECK (full_name IS NULL OR char_length(full_name) BETWEEN 1 AND 120),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 30),
  avatar_url text CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 2048),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  address text CHECK (address IS NULL OR char_length(address) <= 300),
  location text CHECK (location IS NULL OR char_length(location) <= 200),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 30),
  email text CHECK (email IS NULL OR char_length(email) <= 254),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS farms_owner_id_idx ON public.farms (owner_id);

CREATE TABLE IF NOT EXISTS public.farm_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'employee')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT farm_memberships_farm_user_key UNIQUE (farm_id, user_id)
);

CREATE INDEX IF NOT EXISTS farm_memberships_user_id_idx ON public.farm_memberships (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS farm_memberships_one_owner_idx
  ON public.farm_memberships (farm_id) WHERE role = 'owner';

CREATE TABLE IF NOT EXISTS public.membership_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES public.farm_memberships(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('farm.manage', 'members.manage', 'audit.view')),
  granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT membership_permissions_membership_permission_key UNIQUE (membership_id, permission)
);

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE RESTRICT,
  email text NOT NULL CHECK (email = lower(email) AND char_length(email) BETWEEN 3 AND 254),
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  CONSTRAINT invitations_accepted_consistency CHECK ((status = 'accepted') = (accepted_at IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS invitations_one_pending_per_email_idx
  ON public.invitations (farm_id, email) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES public.farms(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 100),
  description text CHECK (description IS NULL OR char_length(description) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_farm_created_idx ON public.audit_log (farm_id, created_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
