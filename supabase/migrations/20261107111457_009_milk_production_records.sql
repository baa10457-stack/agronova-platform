/*
# Milk production records

1. New table
- `milk_production_records`: one row per cow per day.
  - `farm_id`: the farm the record belongs to.
  - `animal_id`: the cow concerned. Set to null if the animal is later removed from the register, so the history is kept.
  - `animal_tag`: copy of the animal's tag at the time of recording, so the history stays readable after removal.
  - `record_date`: day of the milking.
  - `liters`: total milk collected that day, between 0 and 100 liters.
  - `notes`: optional comment.
  - `created_at`, `updated_at`: audit fields.

2. Security
- Row level security is enabled.
- Members of a farm can read its milk records; super administrators can read all of them.
- Creating, editing and deleting records requires the farm.manage permission, which owners and administrators hold by default.

3. Modified tables
- `livestock_animals`: none. Only a relationship is added from the new table to it.

4. Important notes
- One record per animal per day is enforced.
- Deleting an animal from the register does not delete its milk history.
- Each policy is dropped first if it already exists, so this migration can be re-run safely.
*/

CREATE TABLE IF NOT EXISTS public.milk_production_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  animal_id uuid REFERENCES public.livestock_animals(id) ON DELETE SET NULL,
  animal_tag text NOT NULL CHECK (char_length(animal_tag) BETWEEN 1 AND 40),
  record_date date NOT NULL,
  liters numeric(6,2) NOT NULL CHECK (liters >= 0 AND liters <= 100),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT milk_records_one_per_animal_per_day UNIQUE (animal_id, record_date)
);

CREATE INDEX IF NOT EXISTS milk_production_records_farm_date_idx ON public.milk_production_records (farm_id, record_date);

ALTER TABLE public.milk_production_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.milk_production_records FROM anon, authenticated;
GRANT SELECT ON public.milk_production_records TO authenticated;
GRANT INSERT (farm_id, animal_id, animal_tag, record_date, liters, notes) ON public.milk_production_records TO authenticated;
GRANT UPDATE (animal_id, animal_tag, record_date, liters, notes, updated_at) ON public.milk_production_records TO authenticated;
GRANT DELETE ON public.milk_production_records TO authenticated;

DROP POLICY IF EXISTS milk_production_records_select ON public.milk_production_records;
CREATE POLICY milk_production_records_select ON public.milk_production_records FOR SELECT
  TO authenticated
  USING (public.is_farm_member(farm_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS milk_production_records_insert ON public.milk_production_records;
CREATE POLICY milk_production_records_insert ON public.milk_production_records FOR INSERT
  TO authenticated
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS milk_production_records_update ON public.milk_production_records;
CREATE POLICY milk_production_records_update ON public.milk_production_records FOR UPDATE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'))
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS milk_production_records_delete ON public.milk_production_records;
CREATE POLICY milk_production_records_delete ON public.milk_production_records FOR DELETE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'));
