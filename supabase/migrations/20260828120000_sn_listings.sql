-- Public SpaceNet listings (shops, drops, driver bases, posts). Meant to be seen.
create table if not exists public.sn_listings (
  id text primary key,
  kind text not null,
  lat double precision,
  lng double precision,
  body jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists sn_listings_kind_updated on public.sn_listings (kind, updated_at desc);
create index if not exists sn_listings_geo on public.sn_listings (lat, lng);

alter table public.sn_listings enable row level security;

drop policy if exists sn_listings_read on public.sn_listings;
create policy sn_listings_read on public.sn_listings for select using (true);

drop policy if exists sn_listings_insert on public.sn_listings;
create policy sn_listings_insert on public.sn_listings for insert with check (true);

drop policy if exists sn_listings_update on public.sn_listings;
create policy sn_listings_update on public.sn_listings for update using (true);
