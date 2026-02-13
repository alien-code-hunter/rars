-- Fix function search paths for security

-- Fix generate_reference_number
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  ref_num TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq_num 
  FROM public.applications 
  WHERE reference_number LIKE 'RARS-' || year_part || '-%';
  ref_num := 'RARS-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN ref_num;
END;
$$;

-- Fix update_updated_at
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

-- Fix set_reference_number
CREATE OR REPLACE FUNCTION public.set_reference_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := public.generate_reference_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix audit_logs policy to be more restrictive
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert their own audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- Fix access_logs policy to be more restrictive
DROP POLICY IF EXISTS "Anyone can create access logs" ON public.access_logs;
CREATE POLICY "Users can create access logs with their own id"
ON public.access_logs FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());