-- Inscriptions passagers covoiturage (MooreaNews)
create table if not exists public.carpool_signups (
  id              uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  name            text not null,
  phone           text not null,
  message         text,
  created_at      timestamptz not null default now()
);

create index if not exists carpool_signups_announcement_idx
  on public.carpool_signups (announcement_id);

create unique index if not exists carpool_signups_announcement_phone_idx
  on public.carpool_signups (announcement_id, phone);

alter table public.carpool_signups enable row level security;
