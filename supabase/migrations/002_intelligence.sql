create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  age int,
  job text,
  goals text,
  frustrations text,
  behaviors text,
  quote text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pain_points (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  severity text not null default 'medium',
  frequency text not null default 'occasional',
  status text not null default 'identified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'observation',
  confidence text not null default 'low',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roadmap_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'manual',
  status text not null default 'backlog',
  brass_benefit int,
  brass_revenue int,
  brass_alignment int,
  brass_speed int,
  brass_saturation int,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_tests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  test_type text not null default 'interview',
  status text not null default 'planned',
  objectives text,
  notes text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists benchmark_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  url text,
  ai_analysis jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists personas_updated_at on personas;
create trigger personas_updated_at before update on personas for each row execute procedure set_updated_at();
drop trigger if exists pain_points_updated_at on pain_points;
create trigger pain_points_updated_at before update on pain_points for each row execute procedure set_updated_at();
drop trigger if exists insights_updated_at on insights;
create trigger insights_updated_at before update on insights for each row execute procedure set_updated_at();
drop trigger if exists roadmap_items_updated_at on roadmap_items;
create trigger roadmap_items_updated_at before update on roadmap_items for each row execute procedure set_updated_at();
drop trigger if exists user_tests_updated_at on user_tests;
create trigger user_tests_updated_at before update on user_tests for each row execute procedure set_updated_at();
drop trigger if exists benchmark_entries_updated_at on benchmark_entries;
create trigger benchmark_entries_updated_at before update on benchmark_entries for each row execute procedure set_updated_at();
