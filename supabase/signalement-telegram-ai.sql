-- Signalements citoyens : Telegram + métadonnées + sessions bot
-- Supabase → SQL Editor → Run

alter table public.submissions
  add column if not exists signalement_category text,
  add column if not exists source_channel text default 'web';

create table if not exists public.telegram_signalement_sessions (
  chat_id         text primary key,
  step            text not null default 'idle',
  category_id     text,
  description     text,
  location        text,
  district        text,
  cover_url       text,
  photo_file_id   text,
  contact         text,
  updated_at      timestamptz not null default now()
);

create index if not exists telegram_signalement_sessions_updated_idx
  on public.telegram_signalement_sessions (updated_at desc);

alter table public.telegram_signalement_sessions enable row level security;

drop policy if exists "telegram_sessions_service_only" on public.telegram_signalement_sessions;
create policy "telegram_sessions_service_only" on public.telegram_signalement_sessions
  for all using (false) with check (false);
