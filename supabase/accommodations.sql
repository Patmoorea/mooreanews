-- Hébergements touristiques (admin + premium Stripe)

create table if not exists public.accommodations (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  description         text not null default '',
  type                text not null default 'pension'
    check (type in ('hotel', 'pension', 'fare', 'villa')),
  district            text not null,
  address             text,
  phone               text,
  email               text,
  url                 text,
  price_hint          text,
  availability_status text not null default 'contact'
    check (availability_status in ('available', 'limited', 'contact', 'full')),
  lat                 double precision,
  lon                 double precision,
  cover_url           text,
  merchant_email      text,
  published           boolean not null default true,
  featured            boolean not null default false,
  premium_until       timestamptz,
  display_order       int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists accommodations_published_idx
  on public.accommodations (published, featured desc, display_order);
create index if not exists accommodations_district_idx
  on public.accommodations (district);
create index if not exists accommodations_premium_idx
  on public.accommodations (premium_until desc nulls last);

alter table public.accommodations enable row level security;
drop policy if exists "accommodations_public_read" on public.accommodations;
create policy "accommodations_public_read" on public.accommodations
  for select using (published = true);
drop policy if exists "accommodations_admin_all" on public.accommodations;
create policy "accommodations_admin_all" on public.accommodations
  for all using (public.is_admin()) with check (public.is_admin());

-- commerce_payments : ajouter accommodation_premium
alter table public.commerce_payments drop constraint if exists commerce_payments_kind_check;
alter table public.commerce_payments add constraint commerce_payments_kind_check
  check (kind in ('announcement_boost', 'restaurant_premium', 'accommodation_premium'));

-- trigger updated_at (si fonction set_updated_at existe)
drop trigger if exists set_updated_at_accommodations on public.accommodations;
create trigger set_updated_at_accommodations
  before update on public.accommodations
  for each row execute function public.set_updated_at();
