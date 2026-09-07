-- Documents uploadés pour alimenter l'IA
create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  content text,
  file_type text,
  created_at timestamptz not null default now()
);

-- Recommandations benchmark rejetées (ne plus afficher pour ce projet)
create table if not exists benchmark_rejected (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  competitor_name text not null,
  competitor_url text,
  created_at timestamptz not null default now()
);

-- Historique Ask AI
create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);
