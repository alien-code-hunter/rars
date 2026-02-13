-- Approval letter signatures
CREATE TABLE IF NOT EXISTS public.approval_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_signatures_token ON public.approval_signatures(token);

ALTER TABLE public.approval_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage approval signatures"
ON public.approval_signatures FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));
