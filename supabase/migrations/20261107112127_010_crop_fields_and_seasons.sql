/*
# Crop planning: fields and crop seasons

1. New tables
- `crop_fields`: the plots of land of a farm.
  - `name`, `area_hectares` (greater than 0), `location`, `soil_type`, `notes`.
- `crop_seasons`: one crop grown on a field during a season.
  - `field_id`: the field concerned. Deleting a field deletes its seasons.
  - `crop_name`, `variety`, `sowing_date`, `expected_harvest_date`, `harvest_date`.
  - `actual_yield_tons`: harvested quantity, filled in after harvest.
  - `status`: `planned`, `growing` or `harvested`.
  - `created_at`, `updated_at` on both tables.

2. Security
- Row level security is enabled on both tables.
- Members of a farm can read its fields and seasons; super administrators can read all of them.
- Creating, editing and deleting requires the farm.manage permission, which owners and administrators hold by default.

3. Modified tables
- None.

4. Important notes
- A harvest date cannot be earlier than the sowing date.
- Each policy is dropped first if it already exists, so this migration can be re-run safely.
*/

CREATE TABLE IF NOT EXISTS public.crop_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  area_hectares numeric(10,2) NOT NULL CHECK (area_hectares > 0 AND area_hectares <= 100000),
  location text CHECK (location IS NULL OR char_length(location) <= 120),
  soil_type text CHECK (soil_type IS NULL OR char_length(soil_type) <= 80),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crop_fields_farm_id_idx ON public.crop_fields (farm_id);

CREATE TABLE IF NOT EXISTS public.crop_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.crop_fields(id) ON DELETE CASCADE,
  crop_name text NOT NULL CHECK (char_length(crop_name) BETWEEN 1 AND 80),
  variety text CHECK (variety IS NULL OR char_length(variety) <= 80),
  sowing_date date,
  expected_harvest_date date,
  harvest_date date,
  actual_yield_tons numeric(10,2) CHECK (actual_yield_tons IS NULL OR actual_yield_tons >= 0),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'growing', 'harvested')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crop_seasons_harvest_after_sowing CHECK (
    harvest_date IS NULL OR sowing_date IS NULL OR harvest_date >= sowing_date
  )
);

CREATE INDEX IF NOT EXISTS crop_seasons_farm_id_idx ON public.crop_seasons (farm_id);
CREATE INDEX IF NOT EXISTS crop_seasons_field_id_idx ON public.crop_seasons (field_id);

ALTER TABLE public.crop_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_seasons ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.crop_fields FROM anon, authenticated;
GRANT SELECT ON public.crop_fields TO authenticated;
GRANT INSERT (farm_id, name, area_hectares, location, soil_type, notes) ON public.crop_fields TO authenticated;
GRANT UPDATE (name, area_hectares, location, soil_type, notes, updated_at) ON public.crop_fields TO authenticated;
GRANT DELETE ON public.crop_fields TO authenticated;

REVOKE ALL ON public.crop_seasons FROM anon, authenticated;
GRANT SELECT ON public.crop_seasons TO authenticated;
GRANT INSERT (farm_id, field_id, crop_name, variety, sowing_date, expected_harvest_date, harvest_date, actual_yield_tons, status) ON public.crop_seasons TO authenticated;
GRANT UPDATE (field_id, crop_name, variety, sowing_date, expected_harvest_date, harvest_date, actual_yield_tons, status, updated_at) ON public.crop_seasons TO authenticated;
GRANT DELETE ON public.crop_seasons TO authenticated;

DROP POLICY IF EXISTS crop_fields_select ON public.crop_fields;
CREATE POLICY crop_fields_select ON public.crop_fields FOR SELECT
  TO authenticated
  USING (public.is_farm_member(farm_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS crop_fields_insert ON public.crop_fields;
CREATE POLICY crop_fields_insert ON public.crop_fields FOR INSERT
  TO authenticated
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS crop_fields_update ON public.crop_fields;
CREATE POLICY crop_fields_update ON public.crop_fields FOR UPDATE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'))
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS crop_fields_delete ON public.crop_fields;
CREATE POLICY crop_fields_delete ON public.crop_fields FOR DELETE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS crop_seasons_select ON public.crop_seasons;
CREATE POLICY crop_seasons_select ON public.crop_seasons FOR SELECT
  TO authenticated
  USING (public.is_farm_member(farm_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS crop_seasons_insert ON public.crop_seasons;
CREATE POLICY crop_seasons_insert ON public.crop_seasons FOR INSERT
  TO authenticated
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS crop_seasons_update ON public.crop_seasons;
CREATE POLICY crop_seasons_update ON public.crop_seasons FOR UPDATE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'))
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS crop_seasons_delete ON public.crop_seasons;
CREATE POLICY crop_seasons_delete ON public.crop_seasons FOR DELETE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'));
