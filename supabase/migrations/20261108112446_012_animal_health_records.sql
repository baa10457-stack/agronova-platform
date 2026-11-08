/*
# Animal health records

1. New table
- `animal_health_records`: one health event for an animal (vaccination, treatment or checkup).
  - `farm_id`: the farm the record belongs to.
  - `animal_id`: the animal concerned. Set to null if the animal is later removed from the register, so the history is kept.
  - `animal_tag`: copy of the animal's tag at the time of the event.
  - `record_type`: `vaccination`, `treatment` or `checkup`.
  - `record_date`: day of the event.
  - `title`: short description (1 to 120 characters).
  - `product`: medicine or vaccine used, optional.
  - `withdrawal_end_date`: end of the withdrawal period (the time before milk or meat may be sold), optional.
  - `notes`: optional comment.
  - `created_at`, `updated_at`: audit fields.

2. Security
- Row level security is enabled.
- Members of a farm can read its health records; super administrators can read all of them.
- Creating, editing and deleting records requires the farm.manage permission, which owners and administrators hold by default.

3. Modified tables
- None. Only a relationship is added from the new table to the animal register.

4. Important notes
- The withdrawal end date cannot be earlier than the record date.
- Deleting an animal from the register does not delete its health history.
- Each policy is dropped first if it already exists, so this migration can be re-run safely.
*/

CREATE TABLE IF NOT EXISTS public.animal_health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  animal_id uuid REFERENCES public.livestock_animals(id) ON DELETE SET NULL,
  animal_tag text NOT NULL CHECK (char_length(animal_tag) BETWEEN 1 AND 40),
  record_type text NOT NULL CHECK (record_type IN ('vaccination', 'treatment', 'checkup')),
  record_date date NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  product text CHECK (product IS NULL OR char_length(product) <= 120),
  withdrawal_end_date date,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT animal_health_withdrawal_after_record CHECK (
    withdrawal_end_date IS NULL OR withdrawal_end_date >= record_date
  )
);

CREATE INDEX IF NOT EXISTS animal_health_records_farm_date_idx ON public.animal_health_records (farm_id, record_date);
CREATE INDEX IF NOT EXISTS animal_health_records_animal_idx ON public.animal_health_records (animal_id);

ALTER TABLE public.animal_health_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.animal_health_records FROM anon, authenticated;
GRANT SELECT ON public.animal_health_records TO authenticated;
GRANT INSERT (farm_id, animal_id, animal_tag, record_type, record_date, title, product, withdrawal_end_date, notes) ON public.animal_health_records TO authenticated;
GRANT UPDATE (animal_id, animal_tag, record_type, record_date, title, product, withdrawal_end_date, notes, updated_at) ON public.animal_health_records TO authenticated;
GRANT DELETE ON public.animal_health_records TO authenticated;

DROP POLICY IF EXISTS animal_health_records_select ON public.animal_health_records;
CREATE POLICY animal_health_records_select ON public.animal_health_records FOR SELECT
  TO authenticated
  USING (public.is_farm_member(farm_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS animal_health_records_insert ON public.animal_health_records;
CREATE POLICY animal_health_records_insert ON public.animal_health_records FOR INSERT
  TO authenticated
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS animal_health_records_update ON public.animal_health_records;
CREATE POLICY animal_health_records_update ON public.animal_health_records FOR UPDATE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'))
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS animal_health_records_delete ON public.animal_health_records;
CREATE POLICY animal_health_records_delete ON public.animal_health_records FOR DELETE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'));
