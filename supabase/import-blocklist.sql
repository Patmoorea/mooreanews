-- Articles auto-importés supprimés par l'admin : ne plus les recréer (veille RSS/FB/IA).
-- Supabase → SQL Editor → Run

create table if not exists public.import_blocklist (
  slug            text primary key,
  source_id       text,
  external_id     text,
  title           text,
  blocked_at      timestamptz not null default now()
);

create index if not exists import_blocklist_blocked_at_idx
  on public.import_blocklist (blocked_at desc);

alter table public.import_blocklist enable row level security;

drop policy if exists "import_blocklist_service_only" on public.import_blocklist;
create policy "import_blocklist_service_only" on public.import_blocklist
  for all using (false) with check (false);
