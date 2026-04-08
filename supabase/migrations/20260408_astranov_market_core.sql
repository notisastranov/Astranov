create extension if not exists pgcrypto;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  demo_mode boolean not null default true,
  owner_fee_rate numeric(5,4) not null default 0.03 check (owner_fee_rate >= 0 and owner_fee_rate <= 1),
  currency_code text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  slug text not null unique,
  display_name text not null,
  signal_kind text not null default 'anchor' check (signal_kind in ('anchor', 'presence', 'cloud')),
  region_label text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  service_radius_km numeric(8,2) not null default 5,
  capacity_per_hour numeric(10,2) not null default 0,
  live_capacity_per_hour numeric(10,2) not null default 0,
  accepts_priority boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'live', 'paused')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_offerings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_profiles(id) on delete cascade,
  slug text not null unique,
  offering_type text not null check (offering_type in ('product', 'service', 'video')),
  title text not null,
  description text,
  price_eur numeric(12,2) not null default 0,
  temperature_state text not null default 'ambient' check (temperature_state in ('ambient', 'cold', 'hot', 'frozen')),
  weight_kg numeric(10,2) not null default 0,
  volume_liters numeric(10,2) not null default 0,
  capacity_per_hour numeric(10,2) not null default 0,
  instant_priority boolean not null default false,
  active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid references auth.users(id) on delete set null,
  vendor_id uuid not null references public.vendor_profiles(id) on delete restrict,
  offering_id uuid references public.market_offerings(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dispatching', 'in_transit', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz,
  distance_km numeric(10,2) not null default 0,
  weather_code text not null default 'clear',
  item_subtotal_eur numeric(12,2) not null default 0,
  delivery_base_eur numeric(12,2) not null default 0,
  night_surcharge_eur numeric(12,2) not null default 0,
  weather_surcharge_eur numeric(12,2) not null default 0,
  load_surcharge_eur numeric(12,2) not null default 0,
  priority_surcharge_eur numeric(12,2) not null default 0,
  owner_fee_eur numeric(12,2) not null default 0,
  total_eur numeric(12,2) not null default 0,
  driver_payout_eur numeric(12,2) not null default 0,
  weight_kg numeric(10,2) not null default 0,
  volume_liters numeric(10,2) not null default 0,
  is_priority boolean not null default false,
  is_demo boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_kind text not null,
  event_text text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  direction text not null check (direction in ('credit', 'debit')),
  transaction_kind text not null check (transaction_kind in ('top_up', 'purchase', 'driver_payout', 'refund', 'owner_fee')),
  payment_provider text,
  provider_reference text,
  gross_eur numeric(12,2) not null default 0,
  owner_fee_eur numeric(12,2) not null default 0,
  net_eur numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists vendor_profiles_owner_idx on public.vendor_profiles(owner_user_id);
create index if not exists vendor_profiles_demo_idx on public.vendor_profiles(is_demo, status);
create index if not exists market_offerings_vendor_idx on public.market_offerings(vendor_id, active);
create index if not exists market_offerings_demo_idx on public.market_offerings(is_demo, active);
create index if not exists orders_vendor_status_idx on public.orders(vendor_id, status, requested_at desc);
create index if not exists orders_customer_status_idx on public.orders(customer_user_id, status, requested_at desc);
create index if not exists order_events_order_idx on public.order_events(order_id, created_at desc);
create index if not exists wallet_transactions_user_idx on public.wallet_transactions(user_id, created_at desc);

create or replace function public.calculate_owner_fee(p_amount numeric)
returns numeric
language sql
immutable
as $$
  select round(greatest(coalesce(p_amount, 0), 0) * 0.03, 2);
$$;

create or replace function public.quote_delivery(
  p_distance_km numeric default 0,
  p_requested_at timestamptz default now(),
  p_weight_kg numeric default 0,
  p_volume_liters numeric default 0,
  p_weather_code text default 'clear',
  p_is_priority boolean default false,
  p_item_subtotal_eur numeric default 0
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_distance numeric := round(greatest(coalesce(p_distance_km, 0), 0), 2);
  v_hour integer := extract(hour from coalesce(p_requested_at, now()));
  v_weight numeric := greatest(coalesce(p_weight_kg, 0), 0);
  v_volume numeric := greatest(coalesce(p_volume_liters, 0), 0);
  v_load_basis numeric := greatest(v_weight, v_volume);
  v_extra_bands integer := ceil(greatest(v_load_basis - 13, 0) / 13.0);
  v_night numeric := case when v_hour >= 21 or v_hour < 9 then 1 else 0 end;
  v_weather numeric := case when lower(coalesce(p_weather_code, 'clear')) in ('bad_weather', 'cold_rain', 'extreme_heat', 'storm', 'snow', 'heavy_rain') then 1 else 0 end;
  v_priority numeric := case when coalesce(p_is_priority, false) then 1 else 0 end;
  v_load numeric := greatest(v_extra_bands, 0);
  v_distance_charge numeric := round(v_distance * 1, 2);
  v_delivery numeric := greatest(3, round(v_distance_charge + v_night + v_weather + v_priority + v_load, 2));
  v_subtotal numeric := round(greatest(coalesce(p_item_subtotal_eur, 0), 0), 2);
  v_service numeric := round(v_subtotal + v_delivery, 2);
  v_owner_fee numeric := public.calculate_owner_fee(v_service);
begin
  return jsonb_build_object(
    'distance_km', v_distance,
    'distance_charge_eur', v_distance_charge,
    'night_surcharge_eur', v_night,
    'weather_surcharge_eur', v_weather,
    'load_surcharge_eur', v_load,
    'priority_surcharge_eur', v_priority,
    'delivery_base_eur', v_delivery,
    'item_subtotal_eur', v_subtotal,
    'service_subtotal_eur', v_service,
    'owner_fee_eur', v_owner_fee,
    'total_eur', round(v_service + v_owner_fee, 2)
  );
end;
$$;

create or replace function public.apply_order_quote_defaults()
returns trigger
language plpgsql
as $$
declare
  v_quote jsonb;
begin
  v_quote := public.quote_delivery(
    new.distance_km,
    coalesce(new.requested_at, now()),
    new.weight_kg,
    new.volume_liters,
    new.weather_code,
    new.is_priority,
    new.item_subtotal_eur
  );

  new.distance_km := coalesce((v_quote ->> 'distance_km')::numeric, new.distance_km);
  new.delivery_base_eur := coalesce((v_quote ->> 'delivery_base_eur')::numeric, new.delivery_base_eur);
  new.night_surcharge_eur := coalesce((v_quote ->> 'night_surcharge_eur')::numeric, new.night_surcharge_eur);
  new.weather_surcharge_eur := coalesce((v_quote ->> 'weather_surcharge_eur')::numeric, new.weather_surcharge_eur);
  new.load_surcharge_eur := coalesce((v_quote ->> 'load_surcharge_eur')::numeric, new.load_surcharge_eur);
  new.priority_surcharge_eur := coalesce((v_quote ->> 'priority_surcharge_eur')::numeric, new.priority_surcharge_eur);
  new.owner_fee_eur := coalesce((v_quote ->> 'owner_fee_eur')::numeric, new.owner_fee_eur);
  new.total_eur := coalesce((v_quote ->> 'total_eur')::numeric, new.total_eur);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists orders_quote_defaults on public.orders;
create trigger orders_quote_defaults
before insert or update on public.orders
for each row
execute function public.apply_order_quote_defaults();

create or replace function public.normalize_wallet_transaction()
returns trigger
language plpgsql
as $$
begin
  new.owner_fee_eur := case
    when new.owner_fee_eur > 0 then round(new.owner_fee_eur, 2)
    else public.calculate_owner_fee(new.gross_eur)
  end;

  new.net_eur := case
    when new.direction = 'credit' then round(new.gross_eur - new.owner_fee_eur, 2)
    else round(new.gross_eur + new.owner_fee_eur, 2)
  end;

  return new;
end;
$$;

drop trigger if exists wallet_transaction_normalize on public.wallet_transactions;
create trigger wallet_transaction_normalize
before insert or update on public.wallet_transactions
for each row
execute function public.normalize_wallet_transaction();

insert into public.vendor_profiles (
  slug,
  display_name,
  signal_kind,
  region_label,
  latitude,
  longitude,
  service_radius_km,
  capacity_per_hour,
  live_capacity_per_hour,
  accepts_priority,
  status,
  is_demo
) values
  ('harbor-fresh-market', 'Harbor Fresh Market', 'anchor', 'Athens Center', 37.979000, 23.728000, 7, 22, 18, true, 'live', true),
  ('marina-kitchen', 'Marina Kitchen', 'anchor', 'Piraeus Waterfront', 37.938000, 23.640000, 6, 30, 22, true, 'live', true),
  ('attica-bread-lab', 'Attica Bread Lab', 'anchor', 'Athens West', 37.989000, 23.706000, 5, 48, 36, true, 'live', true),
  ('night-pharmacy', 'Night Pharmacy', 'anchor', 'Athens North', 38.004000, 23.748000, 8, 120, 94, true, 'live', true)
on conflict (slug) do update
set
  display_name = excluded.display_name,
  region_label = excluded.region_label,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  service_radius_km = excluded.service_radius_km,
  capacity_per_hour = excluded.capacity_per_hour,
  live_capacity_per_hour = excluded.live_capacity_per_hour,
  accepts_priority = excluded.accepts_priority,
  status = excluded.status,
  is_demo = excluded.is_demo,
  updated_at = now();

insert into public.market_offerings (
  vendor_id,
  slug,
  offering_type,
  title,
  description,
  price_eur,
  temperature_state,
  weight_kg,
  volume_liters,
  capacity_per_hour,
  instant_priority,
  active,
  is_demo
)
select vp.id, seed.slug, seed.offering_type, seed.title, seed.description, seed.price_eur, seed.temperature_state, seed.weight_kg, seed.volume_liters, seed.capacity_per_hour, seed.instant_priority, true, true
from (
  values
    ('harbor-fresh-market', 'citrus-box', 'product', 'Citrus Box', 'Fresh city grocery demo basket.', 11.50, 'ambient', 6.00, 9.00, 22.00, false),
    ('harbor-fresh-market', 'feta-pack', 'product', 'Feta Pack', 'Cold-chain demo grocery listing.', 6.40, 'cold', 1.60, 2.00, 40.00, false),
    ('marina-kitchen', 'harbor-pasta', 'product', 'Harbor Pasta', 'Hot-priority prepared meal for fast dispatch.', 13.50, 'hot', 0.80, 2.00, 30.00, true),
    ('attica-bread-lab', 'hot-coffee', 'product', 'Hot Coffee', 'Instant-priority hot beverage.', 3.20, 'hot', 0.30, 1.00, 90.00, true),
    ('night-pharmacy', 'pain-relief', 'product', 'Pain Relief', 'After-hours urgent pharmacy item.', 7.20, 'ambient', 0.12, 0.50, 120.00, false)
) as seed(vendor_slug, slug, offering_type, title, description, price_eur, temperature_state, weight_kg, volume_liters, capacity_per_hour, instant_priority)
join public.vendor_profiles vp on vp.slug = seed.vendor_slug
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  price_eur = excluded.price_eur,
  temperature_state = excluded.temperature_state,
  weight_kg = excluded.weight_kg,
  volume_liters = excluded.volume_liters,
  capacity_per_hour = excluded.capacity_per_hour,
  instant_priority = excluded.instant_priority,
  active = excluded.active,
  is_demo = excluded.is_demo,
  updated_at = now();
