CREATE TABLE public.app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.app_state TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_state TO authenticated;
GRANT ALL ON public.app_state TO service_role;

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared app state is readable" ON public.app_state FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Shared app state is insertable" ON public.app_state FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Shared app state is updatable" ON public.app_state FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);