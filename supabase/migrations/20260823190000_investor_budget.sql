-- Investor deck payload. Public read. Write only Notis (owner email).
CREATE TABLE IF NOT EXISTS public.investor_budget (
  id text PRIMARY KEY DEFAULT 'deck-v1',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.investor_budget ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY investor_budget_public_read ON public.investor_budget
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT SELECT ON public.investor_budget TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.investor_budget_save(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'login_required';
  END IF;
  v_email := lower(coalesce(auth.jwt()->>'email', ''));
  IF v_email <> 'notisastranov@gmail.com' THEN
    RAISE EXCEPTION 'owner_only';
  END IF;
  INSERT INTO public.investor_budget (id, payload, updated_at, updated_by)
  VALUES ('deck-v1', p_payload, now(), auth.uid())
  ON CONFLICT (id) DO UPDATE
    SET payload = excluded.payload,
        updated_at = now(),
        updated_by = auth.uid();
  RETURN p_payload;
END;
$$;

GRANT EXECUTE ON FUNCTION public.investor_budget_save(jsonb) TO authenticated;
