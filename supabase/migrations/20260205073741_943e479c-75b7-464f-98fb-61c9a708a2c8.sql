-- Make reference_number have a default value so it's not required on insert
-- The trigger will still generate it, but this allows insert without providing it
ALTER TABLE public.applications 
ALTER COLUMN reference_number SET DEFAULT '';