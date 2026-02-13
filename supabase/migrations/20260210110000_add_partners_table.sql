-- Research partners directory
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('ADMIN_OFFICER', 'REVIEWER', 'EXECUTIVE_DIRECTOR', 'SYSTEM_ADMIN')
  )
$$;

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_partners_name_country
ON public.partners(name, country);

CREATE INDEX IF NOT EXISTS idx_partners_active
ON public.partners(is_active);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trigger_update_partners_timestamp
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Public can view partners"
ON public.partners FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Staff can manage partners"
ON public.partners FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));
