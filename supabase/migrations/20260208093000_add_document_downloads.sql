-- Document download history
CREATE TABLE IF NOT EXISTS public.document_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT DEFAULT 'DOWNLOAD',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_downloads_doc ON public.document_downloads(document_id, created_at DESC);

ALTER TABLE public.document_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view downloads for own applications"
ON public.document_downloads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.applications a ON a.id = d.application_id
    WHERE d.id = document_id AND a.applicant_id = auth.uid()
  )
  OR public.is_staff(auth.uid())
);

CREATE POLICY "Users can log downloads"
ON public.document_downloads FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
