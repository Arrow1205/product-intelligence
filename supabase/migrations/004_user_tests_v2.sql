-- Extend user_tests with form builder and AI analysis
ALTER TABLE user_tests
  ADD COLUMN IF NOT EXISTS form_fields jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS persona_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS synthetic_personas jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS ai_analysis jsonb;

-- Test responses
CREATE TABLE IF NOT EXISTS test_responses (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references user_tests(id) on delete cascade,
  persona_name text not null,
  persona_type text not null default 'real',
  persona_id uuid references personas(id) on delete set null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
