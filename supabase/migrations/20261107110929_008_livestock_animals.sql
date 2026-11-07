/*
# Livestock register (cheptel)

1. New table
- `livestock_animals`: one row per animal registered in a farm.
  - `farm_id`: the farm the animal belongs to (required).
  - `tag_number`: identification tag, unique within a farm.
  - `name`, `breed`, `birth_date`, `notes`: optional descriptive data.
  - `sex`: `female` or `male`.
  - `status`: `active`, `sold` or `deceased`. Defaults to `active`.
  - `created_by`, `created_at`, `updated_at`: audit fields.

2. Security
- Row level security is enabled.
- Members of an active farm can read its animals; super administrators can read all of them.
- Creating, editing and deleting an animal requires the farm.manage permission, which owners and administrators hold by default.
- Clients cannot write `farm_id` or `created_by` on existing rows; the owner is filled automatically on insert.

3. Modified tables
- None.

4. Important notes
- Each policy is dropped first if it already exists, so this migration can be re-run safely.
- Deleting a farm deletes its animals.
*/

CREATE TABLE IF NOT EXISTS public.livestock_animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  tag_number text NOT NULL CHECK (char_length(tag_number) BETWEEN 1 AND 40),
  name text CHECK (name IS NULL OR char_length(name) <= 80),
  sex text NOT NULL CHECK (sex IN ('female', 'male')),
  breed text CHECK (breed IS NULL OR char_length(breed) <= 80),
  birth_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deceased')),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT livestock_animals_tag_per_farm UNIQUE (farm_id, tag_number)
);

CREATE INDEX IF NOT EXISTS livestock_animals_farm_id_idx ON public.livestock_animals (farm_id);

ALTER TABLE public.livestock_animals ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.livestock_animals FROM anon, authenticated;
GRANT SELECT ON public.livestock_animals TO authenticated;
GRANT INSERT (farm_id, tag_number, name, sex, breed, birth_date, status, notes) ON public.livestock_animals TO authenticated;
GRANT UPDATE (tag_number, name, sex, breed, birth_date, status, notes, updated_at) ON public.livestock_animals TO authenticated;
GRANT DELETE ON public.livestock_animals TO authenticated;

DROP POLICY IF EXISTS livestock_animals_select ON public.livestock_animals;
CREATE POLICY livestock_animals_select ON public.livestock_animals FOR SELECT
  TO authenticated
  USING (public.is_farm_member(farm_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS livestock_animals_insert ON public.livestock_animals;
CREATE POLICY livestock_animals_insert ON public.livestock_animals FOR INSERT
  TO authenticated
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS livestock_animals_update ON public.livestock_animals;
CREATE POLICY livestock_animals_update ON public.livestock_animals FOR UPDATE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'))
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS livestock_animals_delete ON public.livestock_animals;
CREATE POLICY livestock_animals_delete ON public.livestock_animals FOR DELETE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'));
