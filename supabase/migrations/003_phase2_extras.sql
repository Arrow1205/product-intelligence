-- Documents uploadés
create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  file_url text,
  content text,
  file_type text,
  ai_processed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Benchmark recommendations rejetées
create table if not exists benchmark_rejected (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  competitor_name text not null,
  competitor_url text,
  created_at timestamptz not null default now()
);

-- Ask AI history
create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);
