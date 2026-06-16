-- Anti-doublon canal Telegram @MooreaNews (un slug = un seul post canal).
create table if not exists public.telegram_channel_posts (
  slug text primary key,
  posted_at timestamptz not null default now()
);

create index if not exists telegram_channel_posts_posted_at_idx
  on public.telegram_channel_posts (posted_at desc);

alter table public.telegram_channel_posts enable row level security;

drop policy if exists "telegram_channel_posts_service_only" on public.telegram_channel_posts;
create policy "telegram_channel_posts_service_only" on public.telegram_channel_posts
  for all using (false) with check (false);
