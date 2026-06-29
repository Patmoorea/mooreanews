-- Limitation de débit formulaires publics (anti-spam)
create table if not exists public.form_rate_limits (
  id text primary key,
  hits int not null default 1,
  reset_at timestamptz not null default now()
);

create index if not exists form_rate_limits_reset_at_idx
  on public.form_rate_limits (reset_at);

alter table public.form_rate_limits enable row level security;

-- Accès service role uniquement (API serveur)
drop policy if exists "form_rate_limits_service" on public.form_rate_limits;
