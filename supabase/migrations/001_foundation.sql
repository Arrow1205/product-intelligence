-- ============================================================
-- Migration 001 — Phase 1 Foundation
-- ============================================================

-- Projects
create table if not exists projects (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default '00000000-0000-0000-0000-000000000001',
  name                  text not null,
  url                   text,
  product_type          text,
  business_model        text,
  description           text,
  main_objective        text,
  assumed_target_users  text,
  north_star_metric     jsonb,
  status                text not null default 'active',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- KPIs
create table if not exists project_kpis (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  name        text not null,
  description text,
  unit        text,
  direction   text not null default 'up',
  tier        text not null default 'primary',
  target      numeric,
  baseline    numeric,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Project Objectives
create table if not exists project_objectives (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  name        text not null,
  type        text,
  target      text,
  priority    text not null default 'medium',
  start_date  date,
  end_date    date,
  constraints text,
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Data Source Integrations
create table if not exists project_integrations (
  id                      uuid primary key default gen_random_uuid(),
  project_id              uuid not null references projects(id) on delete cascade,
  provider                text not null,
  connection_name         text not null,
  status                  text not null default 'pending',
  auth_type               text,
  external_property_id    text,
  external_property_name  text,
  credentials_vault_key   text,
  capabilities            jsonb not null default '[]',
  settings                jsonb not null default '{}',
  sync_frequency          text not null default 'manual',
  last_sync_at            timestamptz,
  last_success_at         timestamptz,
  last_error              text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Sync runs
create table if not exists integration_syncs (
  id                  uuid primary key default gen_random_uuid(),
  integration_id      uuid not null references project_integrations(id) on delete cascade,
  project_id          uuid not null references projects(id) on delete cascade,
  status              text not null default 'pending',
  period_start        date,
  period_end          date,
  started_at          timestamptz,
  completed_at        timestamptz,
  records_processed   int,
  records_upserted    int,
  records_skipped     int,
  errors              jsonb not null default '[]',
  metadata            jsonb not null default '{}'
);

-- Evidence (core truth store — extended in future phases)
create table if not exists evidence (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  type          text not null default 'observed',
  source_type   text,
  source_ref    uuid,
  title         text not null,
  content       text,
  raw_data      jsonb,
  confidence    numeric check (confidence between 0 and 1),
  sample_size   int,
  collected_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Indexes ──
create index if not exists idx_projects_user_id         on projects(user_id);
create index if not exists idx_project_kpis_project     on project_kpis(project_id);
create index if not exists idx_project_objectives_proj  on project_objectives(project_id);
create index if not exists idx_project_integrations_proj on project_integrations(project_id);
create index if not exists idx_integration_syncs_integ  on integration_syncs(integration_id);
create index if not exists idx_integration_syncs_proj   on integration_syncs(project_id);
create index if not exists idx_evidence_project         on evidence(project_id);
create index if not exists idx_evidence_type            on evidence(type);

-- ── Updated_at trigger ──
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

create or replace trigger trg_project_objectives_updated_at
  before update on project_objectives
  for each row execute function set_updated_at();

create or replace trigger trg_project_integrations_updated_at
  before update on project_integrations
  for each row execute function set_updated_at();

create or replace trigger trg_evidence_updated_at
  before update on evidence
  for each row execute function set_updated_at();
