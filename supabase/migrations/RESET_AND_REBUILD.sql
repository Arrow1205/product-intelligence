-- ============================================================
-- RESET COMPLET + NOUVEAU SCHÉMA — Product Design AI V0
-- Exécuter dans Supabase SQL Editor en une seule fois
-- ============================================================

-- 1. SUPPRESSION DE TOUTES LES TABLES EXISTANTES
-- ============================================================

drop table if exists public.test_responses         cascade;
drop table if exists public.test_participants      cascade;
drop table if exists public.test_blocks            cascade;
drop table if exists public.user_tests             cascade;
drop table if exists public.benchmark_rejected     cascade;
drop table if exists public.benchmark_entries      cascade;
drop table if exists public.ai_conversations       cascade;
drop table if exists public.project_documents      cascade;
drop table if exists public.roadmap_items          cascade;
drop table if exists public.insights               cascade;
drop table if exists public.pain_points            cascade;
drop table if exists public.personas               cascade;
drop table if exists public.projects               cascade;

-- Nouvelles tables si elles existent déjà
drop table if exists public.activity_log           cascade;
drop table if exists public.evidence_links         cascade;
drop table if exists public.ai_recommendations     cascade;
drop table if exists public.ai_analyses            cascade;
drop table if exists public.asset_chunks           cascade;
drop table if exists public.asset_extractions      cascade;
drop table if exists public.assets                 cascade;
drop table if exists public.folders                cascade;
drop table if exists public.need_expressions       cascade;
drop table if exists public.products               cascade;


-- 2. TRIGGER updated_at générique
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- 3. NOUVELLES TABLES
-- ============================================================

-- products
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  slug        text,
  short_description text,
  product_type text,
  stage       text,
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index products_user_id_idx on public.products(user_id);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();


-- need_expressions
create table public.need_expressions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  product_id          uuid not null references public.products(id) on delete cascade,
  title               text not null,
  body                text not null,
  context             text,
  business_objectives text,
  known_users         text,
  constraints         text,
  open_questions      text,
  tags                text[] not null default '{}',
  status              text not null default 'active',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index need_expressions_product_user_idx on public.need_expressions(product_id, user_id);

create trigger need_expressions_updated_at
  before update on public.need_expressions
  for each row execute function public.set_updated_at();


-- ai_analyses
create table public.ai_analyses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  analysis_type   text not null,
  source_type     text,
  source_id       uuid,
  status          text not null default 'processing',
  model           text,
  prompt_version  text,
  input_snapshot  jsonb,
  result          jsonb,
  error_message   text,
  usage           jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index ai_analyses_product_type_idx on public.ai_analyses(product_id, analysis_type, created_at desc);

create trigger ai_analyses_updated_at
  before update on public.ai_analyses
  for each row execute function public.set_updated_at();


-- folders
create table public.folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  parent_id   uuid references public.folders(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index folders_product_parent_idx on public.folders(product_id, parent_id);

create trigger folders_updated_at
  before update on public.folders
  for each row execute function public.set_updated_at();


-- assets
create table public.assets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  product_id        uuid not null references public.products(id) on delete cascade,
  folder_id         uuid references public.folders(id) on delete set null,
  original_name     text not null,
  storage_path      text not null,
  mime_type         text,
  extension         text,
  size_bytes        bigint,
  checksum          text,
  processing_status text not null default 'uploaded',
  preview_status    text,
  ai_readable       boolean not null default false,
  metadata          jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index assets_product_folder_idx on public.assets(product_id, folder_id);

create trigger assets_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();


-- asset_extractions
create table public.asset_extractions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  product_id        uuid not null references public.products(id) on delete cascade,
  asset_id          uuid not null references public.assets(id) on delete cascade,
  extraction_type   text not null,
  text_content      text,
  structured_content jsonb,
  model             text,
  status            text not null default 'processing',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger asset_extractions_updated_at
  before update on public.asset_extractions
  for each row execute function public.set_updated_at();


-- asset_chunks
create table public.asset_chunks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  asset_id        uuid not null references public.assets(id) on delete cascade,
  extraction_id   uuid references public.asset_extractions(id) on delete cascade,
  chunk_index     integer not null,
  content         text not null,
  metadata        jsonb not null default '{}',
  fts             tsvector generated always as (to_tsvector('french', content)) stored,
  created_at      timestamptz not null default now()
);
create index asset_chunks_product_asset_idx on public.asset_chunks(product_id, asset_id);
create index asset_chunks_fts_idx on public.asset_chunks using gin(fts);


-- tests
create table public.tests (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  product_id            uuid not null references public.products(id) on delete cascade,
  title                 text not null,
  test_type             text not null default 'usability',
  objective             text,
  context               text,
  target_description    text,
  recruitment_criteria  text,
  prototype_url         text,
  intro_text            text,
  closing_text          text,
  estimated_minutes     integer,
  status                text not null default 'draft',
  public_token          text unique,
  published_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index tests_product_status_idx on public.tests(product_id, status);

create trigger tests_updated_at
  before update on public.tests
  for each row execute function public.set_updated_at();


-- test_blocks
create table public.test_blocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  test_id     uuid not null references public.tests(id) on delete cascade,
  block_type  text not null,
  position    integer not null default 0,
  config      jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index test_blocks_test_position_idx on public.test_blocks(test_id, position);

create trigger test_blocks_updated_at
  before update on public.test_blocks
  for each row execute function public.set_updated_at();


-- test_participants
create table public.test_participants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products(id) on delete cascade,
  test_id          uuid not null references public.tests(id) on delete cascade,
  participant_code text not null,
  name             text,
  email            text,
  metadata         jsonb not null default '{}',
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  created_at       timestamptz not null default now()
);
create index test_participants_test_idx on public.test_participants(test_id);


-- test_responses
create table public.test_responses (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  test_id         uuid not null references public.tests(id) on delete cascade,
  participant_id  uuid not null references public.test_participants(id) on delete cascade,
  block_id        uuid not null references public.test_blocks(id) on delete cascade,
  answer          jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index test_responses_test_participant_idx on public.test_responses(test_id, participant_id);

create trigger test_responses_updated_at
  before update on public.test_responses
  for each row execute function public.set_updated_at();


-- pain_points
create table public.pain_points (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  product_id          uuid not null references public.products(id) on delete cascade,
  title               text not null,
  description         text,
  status              text not null default 'candidate',
  severity            text not null default 'medium',
  confidence          text not null default 'low',
  source              text not null default 'manual',
  origin_analysis_id  uuid references public.ai_analyses(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index pain_points_product_status_idx on public.pain_points(product_id, status);

create trigger pain_points_updated_at
  before update on public.pain_points
  for each row execute function public.set_updated_at();


-- insights
create table public.insights (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  product_id          uuid not null references public.products(id) on delete cascade,
  statement           text not null,
  observation         text,
  implication         text,
  status              text not null default 'candidate',
  confidence          text not null default 'low',
  source              text not null default 'manual',
  origin_analysis_id  uuid references public.ai_analyses(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index insights_product_status_idx on public.insights(product_id, status);

create trigger insights_updated_at
  before update on public.insights
  for each row execute function public.set_updated_at();


-- ai_recommendations
create table public.ai_recommendations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  product_id          uuid not null references public.products(id) on delete cascade,
  title               text not null,
  rationale           text,
  priority            text not null default 'medium',
  confidence          text not null default 'low',
  action_type         text,
  status              text not null default 'active',
  origin_analysis_id  uuid references public.ai_analyses(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger ai_recommendations_updated_at
  before update on public.ai_recommendations
  for each row execute function public.set_updated_at();


-- evidence_links
create table public.evidence_links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  source_type text not null,
  source_id   uuid not null,
  target_type text not null,
  target_id   uuid not null,
  quote       text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index evidence_links_target_idx on public.evidence_links(product_id, target_type, target_id);


-- activity_log
create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index activity_log_product_idx on public.activity_log(product_id, created_at desc);


-- 4. ROW LEVEL SECURITY
-- ============================================================

-- products
alter table public.products enable row level security;
create policy "products_select" on public.products for select to authenticated using (user_id = auth.uid());
create policy "products_insert" on public.products for insert to authenticated with check (user_id = auth.uid());
create policy "products_update" on public.products for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "products_delete" on public.products for delete to authenticated using (user_id = auth.uid());

-- need_expressions
alter table public.need_expressions enable row level security;
create policy "need_expressions_select" on public.need_expressions for select to authenticated using (user_id = auth.uid());
create policy "need_expressions_insert" on public.need_expressions for insert to authenticated with check (user_id = auth.uid());
create policy "need_expressions_update" on public.need_expressions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "need_expressions_delete" on public.need_expressions for delete to authenticated using (user_id = auth.uid());

-- ai_analyses
alter table public.ai_analyses enable row level security;
create policy "ai_analyses_select" on public.ai_analyses for select to authenticated using (user_id = auth.uid());
create policy "ai_analyses_insert" on public.ai_analyses for insert to authenticated with check (user_id = auth.uid());
create policy "ai_analyses_update" on public.ai_analyses for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ai_analyses_delete" on public.ai_analyses for delete to authenticated using (user_id = auth.uid());

-- folders
alter table public.folders enable row level security;
create policy "folders_select" on public.folders for select to authenticated using (user_id = auth.uid());
create policy "folders_insert" on public.folders for insert to authenticated with check (user_id = auth.uid());
create policy "folders_update" on public.folders for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "folders_delete" on public.folders for delete to authenticated using (user_id = auth.uid());

-- assets
alter table public.assets enable row level security;
create policy "assets_select" on public.assets for select to authenticated using (user_id = auth.uid());
create policy "assets_insert" on public.assets for insert to authenticated with check (user_id = auth.uid());
create policy "assets_update" on public.assets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "assets_delete" on public.assets for delete to authenticated using (user_id = auth.uid());

-- asset_extractions
alter table public.asset_extractions enable row level security;
create policy "asset_extractions_select" on public.asset_extractions for select to authenticated using (user_id = auth.uid());
create policy "asset_extractions_insert" on public.asset_extractions for insert to authenticated with check (user_id = auth.uid());
create policy "asset_extractions_update" on public.asset_extractions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "asset_extractions_delete" on public.asset_extractions for delete to authenticated using (user_id = auth.uid());

-- asset_chunks
alter table public.asset_chunks enable row level security;
create policy "asset_chunks_select" on public.asset_chunks for select to authenticated using (user_id = auth.uid());
create policy "asset_chunks_insert" on public.asset_chunks for insert to authenticated with check (user_id = auth.uid());
create policy "asset_chunks_delete" on public.asset_chunks for delete to authenticated using (user_id = auth.uid());

-- tests (lecture anonyme via public_token gérée par API route serveur)
alter table public.tests enable row level security;
create policy "tests_select" on public.tests for select to authenticated using (user_id = auth.uid());
create policy "tests_insert" on public.tests for insert to authenticated with check (user_id = auth.uid());
create policy "tests_update" on public.tests for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tests_delete" on public.tests for delete to authenticated using (user_id = auth.uid());

-- test_blocks
alter table public.test_blocks enable row level security;
create policy "test_blocks_select" on public.test_blocks for select to authenticated using (user_id = auth.uid());
create policy "test_blocks_insert" on public.test_blocks for insert to authenticated with check (user_id = auth.uid());
create policy "test_blocks_update" on public.test_blocks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "test_blocks_delete" on public.test_blocks for delete to authenticated using (user_id = auth.uid());

-- test_participants — accès via service role uniquement depuis API Route
alter table public.test_participants enable row level security;
create policy "test_participants_select_owner" on public.test_participants for select to authenticated
  using (exists (select 1 from public.tests t where t.id = test_id and t.user_id = auth.uid()));
create policy "test_participants_delete_owner" on public.test_participants for delete to authenticated
  using (exists (select 1 from public.tests t where t.id = test_id and t.user_id = auth.uid()));

-- test_responses — accès via service role uniquement depuis API Route
alter table public.test_responses enable row level security;
create policy "test_responses_select_owner" on public.test_responses for select to authenticated
  using (exists (select 1 from public.tests t where t.id = test_id and t.user_id = auth.uid()));
create policy "test_responses_delete_owner" on public.test_responses for delete to authenticated
  using (exists (select 1 from public.tests t where t.id = test_id and t.user_id = auth.uid()));

-- pain_points
alter table public.pain_points enable row level security;
create policy "pain_points_select" on public.pain_points for select to authenticated using (user_id = auth.uid());
create policy "pain_points_insert" on public.pain_points for insert to authenticated with check (user_id = auth.uid());
create policy "pain_points_update" on public.pain_points for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pain_points_delete" on public.pain_points for delete to authenticated using (user_id = auth.uid());

-- insights
alter table public.insights enable row level security;
create policy "insights_select" on public.insights for select to authenticated using (user_id = auth.uid());
create policy "insights_insert" on public.insights for insert to authenticated with check (user_id = auth.uid());
create policy "insights_update" on public.insights for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "insights_delete" on public.insights for delete to authenticated using (user_id = auth.uid());

-- ai_recommendations
alter table public.ai_recommendations enable row level security;
create policy "ai_recommendations_select" on public.ai_recommendations for select to authenticated using (user_id = auth.uid());
create policy "ai_recommendations_insert" on public.ai_recommendations for insert to authenticated with check (user_id = auth.uid());
create policy "ai_recommendations_update" on public.ai_recommendations for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ai_recommendations_delete" on public.ai_recommendations for delete to authenticated using (user_id = auth.uid());

-- evidence_links
alter table public.evidence_links enable row level security;
create policy "evidence_links_select" on public.evidence_links for select to authenticated using (user_id = auth.uid());
create policy "evidence_links_insert" on public.evidence_links for insert to authenticated with check (user_id = auth.uid());
create policy "evidence_links_delete" on public.evidence_links for delete to authenticated using (user_id = auth.uid());

-- activity_log
alter table public.activity_log enable row level security;
create policy "activity_log_select" on public.activity_log for select to authenticated using (user_id = auth.uid());
create policy "activity_log_insert" on public.activity_log for insert to authenticated with check (user_id = auth.uid());


-- 5. STORAGE BUCKET (à créer dans le dashboard Supabase Storage)
-- ============================================================
-- Créer manuellement dans Supabase > Storage :
--   Bucket name: product-files
--   Private: true (désactiver "Public bucket")
-- Puis ajouter cette policy Storage :
--
-- insert into storage.policies (name, bucket_id, operation, definition)
-- values
--   ('owner_read', 'product-files', 'SELECT', '(auth.uid()::text = (storage.foldername(name))[1])'),
--   ('owner_write', 'product-files', 'INSERT', '(auth.uid()::text = (storage.foldername(name))[1])'),
--   ('owner_delete', 'product-files', 'DELETE', '(auth.uid()::text = (storage.foldername(name))[1])');
