-- Repository watchlist
CREATE TABLE IF NOT EXISTS public.repository_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_item_id UUID NOT NULL REFERENCES public.repository_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, repository_item_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.repository_watchlist(user_id, created_at DESC);

ALTER TABLE public.repository_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own watchlist"
ON public.repository_watchlist FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can view watchlist"
ON public.repository_watchlist FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));
