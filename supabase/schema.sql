-- =====================================================================
-- MooreaNews — schéma Supabase complet (Phase 2)
-- =====================================================================
-- À exécuter UNE FOIS sur la base Supabase via SQL Editor.
-- Idempotent : peut être ré-exécuté sans casser la base.
-- =====================================================================

-- Extensions nécessaires
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1) Profiles (extension de auth.users)
-- =====================================================================
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  avatar_url      text,
  role            text not null default 'user' check (role in ('user','editor','admin')),
  bio             text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 2) Articles
-- =====================================================================
create table if not exists public.articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text not null,
  body            text not null,
  category        text not null,
  tags            text[] default '{}',
  cover_url       text,
  author          text,
  author_id       uuid references public.profiles(id) on delete set null,
  featured        boolean not null default false,
  published       boolean not null default true,
  published_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists articles_published_idx on public.articles (published, published_at desc);
create index if not exists articles_category_idx on public.articles (category);
create index if not exists articles_featured_idx on public.articles (featured);

-- =====================================================================
-- 3) Events
-- =====================================================================
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null,
  category        text not null,
  date            date not null,
  end_date        date,
  start_time      time,
  end_time        time,
  location        text not null,
  district        text,
  organizer       text,
  price           text,
  contact         text,
  url             text,
  cover_url       text,
  published       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists events_date_idx on public.events (date);
create index if not exists events_published_idx on public.events (published, date);

-- =====================================================================
-- 4) Announcements (annonces)
-- =====================================================================
create table if not exists public.announcements (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  body            text not null,
  category        text not null,
  district        text,
  price           text,
  contact         text,
  author          text,
  cover_url       text,
  published       boolean not null default true,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists announcements_created_idx on public.announcements (created_at desc);
create index if not exists announcements_published_idx on public.announcements (published);

-- =====================================================================
-- 5) Restaurants
-- =====================================================================
create table if not exists public.restaurants (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text not null,
  cuisine         text[] not null default '{}',
  district        text not null,
  address         text not null,
  phone           text,
  hours           text,
  price_range     text,
  lat             double precision,
  lon             double precision,
  cover_url       text,
  url             text,
  published       boolean not null default true,
  featured        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =====================================================================
-- 6) Activities
-- =====================================================================
create table if not exists public.activities (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text not null,
  category        text not null,
  district        text,
  address         text,
  phone           text,
  price           text,
  duration        text,
  lat             double precision,
  lon             double precision,
  cover_url       text,
  url             text,
  published       boolean not null default true,
  featured        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =====================================================================
-- 7) Infos pratiques
-- =====================================================================
create table if not exists public.info_pratiques (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null,
  category        text not null,
  address         text,
  phone           text,
  hours           text,
  emergency       boolean not null default false,
  url             text,
  published       boolean not null default true,
  display_order   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =====================================================================
-- 8) Submissions (soumissions communautaires en attente de modération)
-- =====================================================================
create table if not exists public.submissions (
  id              uuid primary key default gen_random_uuid(),
  type            text not null check (type in ('event','annonce','service','signalement','suggestion')),
  district        text,
  title           text not null,
  description     text not null,
  date            date,
  start_time      time,
  location        text,
  cover_url       text,
  user_name       text not null,
  user_email      text not null,
  user_phone      text,
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at     timestamptz,
  reviewed_by     uuid references public.profiles(id) on delete set null,
  admin_notes     text,
  created_at      timestamptz not null default now()
);

create index if not exists submissions_status_idx on public.submissions (status, created_at desc);

-- =====================================================================
-- 9bis) External articles (Phase 3 — agrégation RSS)
-- =====================================================================
create table if not exists public.external_articles (
  id              uuid primary key default gen_random_uuid(),
  source_id       text not null,
  source_name     text not null,
  external_id     text not null,
  url             text not null,
  title           text not null,
  excerpt         text,
  image_url       text,
  author          text,
  published_at    timestamptz not null,
  fetched_at      timestamptz not null default now(),
  hidden          boolean not null default false,
  promoted        boolean not null default false,
  unique (source_id, external_id)
);

create index if not exists external_articles_published_idx
  on public.external_articles (published_at desc);
create index if not exists external_articles_source_idx
  on public.external_articles (source_id, published_at desc);
create index if not exists external_articles_hidden_idx
  on public.external_articles (hidden);

-- =====================================================================
-- 9) Newsletter subscribers
-- =====================================================================
create table if not exists public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  confirmed       boolean not null default false,
  confirmation_token text unique,
  source          text,
  created_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz
);

create index if not exists newsletter_confirmed_idx on public.newsletter_subscribers (confirmed);

-- =====================================================================
-- updated_at automatique
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','articles','events','announcements','restaurants',
    'activities','info_pratiques'
  ]) loop
    execute format('drop trigger if exists set_updated_at_%I on public.%I', t, t);
    execute format('create trigger set_updated_at_%I before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles                enable row level security;
alter table public.articles                enable row level security;
alter table public.events                  enable row level security;
alter table public.announcements           enable row level security;
alter table public.restaurants             enable row level security;
alter table public.activities              enable row level security;
alter table public.info_pratiques          enable row level security;
alter table public.submissions             enable row level security;
alter table public.newsletter_subscribers  enable row level security;
alter table public.external_articles       enable row level security;

-- Helper : est-on admin ou editor ? (DOIT être créé AVANT les policies RLS)
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','editor')
  );
$$;

-- External articles : lecture publique (non cachés), écriture admin uniquement
drop policy if exists "external_public_read" on public.external_articles;
create policy "external_public_read" on public.external_articles for select
  using (hidden = false);

drop policy if exists "external_admin_all" on public.external_articles;
create policy "external_admin_all" on public.external_articles for all
  using (public.is_admin()) with check (public.is_admin());

-- Profiles
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- Lecture publique pour le contenu publié
do $$
declare t text;
begin
  for t in select unnest(array[
    'articles','events','announcements','restaurants',
    'activities','info_pratiques'
  ]) loop
    execute format('drop policy if exists "%I_public_read" on public.%I', t, t);
    execute format('create policy "%I_public_read" on public.%I for select using (published = true)', t, t);

    execute format('drop policy if exists "%I_admin_all" on public.%I', t, t);
    execute format('create policy "%I_admin_all" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end$$;

-- Submissions : tout le monde peut insérer (anonymes), seul admin peut lire/modifier
drop policy if exists "submissions_anyone_insert" on public.submissions;
create policy "submissions_anyone_insert" on public.submissions for insert
  with check (true);

drop policy if exists "submissions_admin_all" on public.submissions;
create policy "submissions_admin_all" on public.submissions for all
  using (public.is_admin()) with check (public.is_admin());

-- Newsletter : insertion publique, gestion admin uniquement
drop policy if exists "newsletter_anyone_insert" on public.newsletter_subscribers;
create policy "newsletter_anyone_insert" on public.newsletter_subscribers for insert
  with check (true);

drop policy if exists "newsletter_admin_all" on public.newsletter_subscribers;
create policy "newsletter_admin_all" on public.newsletter_subscribers for all
  using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Promouvoir un utilisateur en admin (à exécuter manuellement)
-- =====================================================================
-- update public.profiles set role='admin' where email='votre.email@example.com';
