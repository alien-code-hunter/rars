-- Allow applicants to transition DRAFT/RETURNED applications to SUBMITTED
BEGIN;

DROP POLICY IF EXISTS "Applicants can update draft applications" ON public.applications;

CREATE POLICY "Applicants can update draft applications"
ON public.applications FOR UPDATE
TO authenticated
USING (
  applicant_id = auth.uid() AND status IN ('DRAFT', 'RETURNED')
)
WITH CHECK (
  applicant_id = auth.uid() AND status IN ('DRAFT', 'RETURNED', 'SUBMITTED')
);

COMMIT;
