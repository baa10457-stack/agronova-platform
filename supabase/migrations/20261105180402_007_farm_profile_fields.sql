/*
# Farm profile fields for farm creation

1. Modified tables
- farms: new columns farm_type (kind of operation), responsible_name (person in charge), city, region.
  Existing rows receive farm_type 'mixed' and NULL for the other new columns. No data is removed.

2. Modified functions
- create_farm: replaced by a version that accepts the new fields. The previous signature is removed so that only one version exists.
  It stores city and region, and keeps the combined location text filled for existing screens.

3. Security
- Same rules as before: the owner is always the signed-in user, EXECUTE is granted to authenticated only.

4. Important notes
- No sample data is inserted.
*/

ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS farm_type text NOT NULL DEFAULT 'mixed';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'farms_farm_type_check') THEN
    ALTER TABLE public.farms ADD CONSTRAINT farms_farm_type_check
      CHECK (farm_type IN ('cattle', 'small_ruminants', 'poultry', 'pig', 'mixed', 'other'));
  END IF;
END $$;

ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS responsible_name text
  CHECK (responsible_name IS NULL OR char_length(responsible_name) BETWEEN 2 AND 120);
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS city text
  CHECK (city IS NULL OR char_length(city) <= 120);
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS region text
  CHECK (region IS NULL OR char_length(region) <= 120);

DROP FUNCTION IF EXISTS public.create_farm(text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_farm(
  p_name text,
  p_farm_type text,
  p_responsible_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_region text,
  p_email text,
  p_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_farm_id uuid;
  v_city text := nullif(btrim(p_city), '');
  v_region text := nullif(btrim(p_region), '');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_farm_type NOT IN ('cattle', 'small_ruminants', 'poultry', 'pig', 'mixed', 'other') THEN
    RAISE EXCEPTION 'Invalid farm type' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.farms (
    name, farm_type, responsible_name, phone, address, city, region, location, email, description, owner_id
  )
  VALUES (
    btrim(p_name),
    p_farm_type,
    nullif(btrim(p_responsible_name), ''),
    nullif(btrim(p_phone), ''),
    nullif(btrim(p_address), ''),
    v_city,
    v_region,
    nullif(concat_ws(', ', v_city, v_region), ''),
    nullif(lower(btrim(p_email)), ''),
    nullif(btrim(p_description), ''),
    v_uid
  )
  RETURNING id INTO v_farm_id;

  INSERT INTO public.farm_memberships (farm_id, user_id, role, status)
  VALUES (v_farm_id, v_uid, 'owner', 'active');

  INSERT INTO public.audit_log (farm_id, user_id, action, description)
  VALUES (v_farm_id, v_uid, 'farm.created', 'Farm created');

  RETURN v_farm_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_farm(text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_farm(text, text, text, text, text, text, text, text, text) TO authenticated;

GRANT UPDATE (farm_type, responsible_name, city, region) ON public.farms TO authenticated;
GRANT SELECT (farm_type, responsible_name, city, region) ON public.farms TO authenticated;
