/*
# Crop fields: satellite location

1. Modified tables
- `crop_fields`
  - `latitude` (numeric, between -90 and 90): north-south position of the parcel.
  - `longitude` (numeric, between -180 and 180): east-west position of the parcel.
  - Both are optional, but they must be filled in together so a parcel is either located or not.

2. Security
- No policy changes. Writing the two new columns requires the farm.manage permission, like the other field columns.
- Column grants are extended so the application can read and write the two new columns.

3. Important notes
- Existing parcels keep working; they simply have no location until one is set on the map.
- Statements are idempotent: columns and constraints are only added when missing.
*/

ALTER TABLE public.crop_fields ADD COLUMN IF NOT EXISTS latitude numeric(9,6);
ALTER TABLE public.crop_fields ADD COLUMN IF NOT EXISTS longitude numeric(9,6);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crop_fields_location_range'
  ) THEN
    ALTER TABLE public.crop_fields ADD CONSTRAINT crop_fields_location_range CHECK (
      (latitude IS NULL AND longitude IS NULL)
      OR (
        latitude BETWEEN -90 AND 90
        AND longitude BETWEEN -180 AND 180
      )
    );
  END IF;
END $$;

GRANT INSERT (latitude, longitude) ON public.crop_fields TO authenticated;
GRANT UPDATE (latitude, longitude) ON public.crop_fields TO authenticated;
