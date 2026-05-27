-- =====================================================================
-- ÉTAPE 2 sur 2 — Sécurité (RLS) MooreaNews
-- À exécuter APRÈS 01-tables.sql (quand la table profiles existe)
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

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','editor')
  );
$$;

drop policy if exists "external_public_read" on public.external_articles;
create policy "external_public_read" on public.external_articles for select
  using (hidden = false);

drop policy if exists "external_admin_all" on public.external_articles;
create policy "external_admin_all" on public.external_articles for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update
  using (auth.uid() = id or public.is_admin());

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

drop policy if exists "submissions_anyone_insert" on public.submissions;
create policy "submissions_anyone_insert" on public.submissions for insert
  with check (true);

drop policy if exists "submissions_admin_all" on public.submissions;
create policy "submissions_admin_all" on public.submissions for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "newsletter_anyone_insert" on public.newsletter_subscribers;
create policy "newsletter_anyone_insert" on public.newsletter_subscribers for insert
  with check (true);

drop policy if exists "newsletter_admin_all" on public.newsletter_subscribers;
create policy "newsletter_admin_all" on public.newsletter_subscribers for all
  using (public.is_admin()) with check (public.is_admin());
