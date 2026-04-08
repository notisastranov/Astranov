alter table public.vendor_profiles
  add column if not exists summary text,
  add column if not exists capability text,
  add column if not exists action_label text,
  add column if not exists armed_label text,
  add column if not exists preview_video_url text,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists metrics jsonb not null default '[]'::jsonb,
  add column if not exists signal_altitude numeric(6,3) not null default 0.16,
  add column if not exists signal_zoom numeric(6,3) not null default 1;

alter table public.market_offerings
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists preview_video_url text;

alter table public.vendor_profiles enable row level security;
alter table public.market_offerings enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.wallet_transactions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vendor_profiles'
      and policyname = 'vendor_profiles_public_read'
  ) then
    create policy vendor_profiles_public_read
      on public.vendor_profiles
      for select
      using (status = 'live');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'market_offerings'
      and policyname = 'market_offerings_public_read'
  ) then
    create policy market_offerings_public_read
      on public.market_offerings
      for select
      using (active = true);
  end if;
end;
$$;

create or replace function public.slugify_text(p_value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p_value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.public_signal_feed(p_include_demo boolean default true)
returns table(
  id text,
  signal_kind text,
  title text,
  summary text,
  capability text,
  action_label text,
  armed_label text,
  region_label text,
  latitude numeric,
  longitude numeric,
  signal_altitude numeric,
  signal_zoom numeric,
  preview_video_url text,
  tags text[],
  metrics jsonb,
  products text[],
  catalog jsonb,
  accepts_priority boolean,
  capacity_per_hour numeric,
  live_capacity_per_hour numeric,
  is_demo boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with offering_rollup as (
    select
      mo.vendor_id,
      array_remove(array_agg(mo.title order by mo.title), null) as products,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', mo.slug,
            'title', mo.title,
            'price', mo.price_eur,
            'priceEur', mo.price_eur,
            'weightKg', mo.weight_kg,
            'volumeLiters', mo.volume_liters,
            'temperatureState', mo.temperature_state,
            'capacityPerHour', mo.capacity_per_hour,
            'priority', mo.instant_priority,
            'offeringType', mo.offering_type,
            'previewVideo', mo.preview_video_url,
            'tags', mo.tags
          )
          order by mo.title
        ) filter (where mo.id is not null),
        '[]'::jsonb
      ) as catalog,
      max(mo.preview_video_url) filter (where mo.preview_video_url is not null) as preview_video_url
    from public.market_offerings mo
    where mo.active = true
      and (p_include_demo or not mo.is_demo)
    group by mo.vendor_id
  )
  select
    vp.slug as id,
    vp.signal_kind,
    vp.display_name as title,
    coalesce(vp.summary, vp.display_name || ' live signal') as summary,
    coalesce(
      vp.capability,
      case
        when vp.signal_kind = 'presence' then 'dispatch trace'
        when exists (
          select 1
          from public.market_offerings mo
          where mo.vendor_id = vp.id
            and mo.active = true
            and mo.offering_type = 'video'
        ) then 'video listing'
        when exists (
          select 1
          from public.market_offerings mo
          where mo.vendor_id = vp.id
            and mo.active = true
            and mo.offering_type = 'service'
        ) then 'service listing'
        else 'product order'
      end
    ) as capability,
    coalesce(vp.action_label, case when vp.signal_kind = 'presence' then 'Track Signal' else 'Open Signal' end) as action_label,
    coalesce(vp.armed_label, case when vp.signal_kind = 'presence' then 'Signal Locked' else 'Signal Active' end) as armed_label,
    vp.region_label,
    vp.latitude,
    vp.longitude,
    vp.signal_altitude,
    vp.signal_zoom,
    coalesce(vp.preview_video_url, offering_rollup.preview_video_url) as preview_video_url,
    coalesce(vp.tags, '{}'::text[]) as tags,
    case
      when jsonb_typeof(vp.metrics) = 'array' then vp.metrics
      else jsonb_build_array(
        jsonb_build_object('label', 'radius', 'value', trim(to_char(coalesce(vp.service_radius_km, 0), 'FM999999990.00')) || ' km'),
        jsonb_build_object('label', 'capacity', 'value', trim(to_char(coalesce(vp.live_capacity_per_hour, vp.capacity_per_hour, 0), 'FM999999990.00')) || '/h'),
        jsonb_build_object('label', 'state', 'value', vp.status)
      )
    end as metrics,
    coalesce(offering_rollup.products, '{}'::text[]) as products,
    coalesce(offering_rollup.catalog, '[]'::jsonb) as catalog,
    vp.accepts_priority,
    vp.capacity_per_hour,
    vp.live_capacity_per_hour,
    vp.is_demo
  from public.vendor_profiles vp
  left join offering_rollup on offering_rollup.vendor_id = vp.id
  where vp.status = 'live'
    and (p_include_demo or not vp.is_demo)
  order by vp.is_demo desc, vp.display_name asc;
$$;

create or replace function public.market_snapshot(p_include_demo boolean default true)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'vendorsLive',
    (
      select count(*)
      from public.vendor_profiles vp
      where vp.status = 'live'
        and (p_include_demo or not vp.is_demo)
    ),
    'offeringsLive',
    (
      select count(*)
      from public.market_offerings mo
      where mo.active = true
        and (p_include_demo or not mo.is_demo)
    ),
    'ordersActive',
    (
      select count(*)
      from public.orders o
      where o.status in ('pending', 'accepted', 'dispatching', 'in_transit')
        and (p_include_demo or not o.is_demo)
    ),
    'transactions30d',
    (
      select count(*)
      from public.wallet_transactions wt
      left join public.orders o on o.id = wt.order_id
      where wt.created_at >= now() - interval '30 days'
        and (p_include_demo or wt.order_id is null or not coalesce(o.is_demo, false))
    ),
    'ownerFee30d',
    (
      select round(coalesce(sum(wt.owner_fee_eur), 0), 2)
      from public.wallet_transactions wt
      left join public.orders o on o.id = wt.order_id
      where wt.created_at >= now() - interval '30 days'
        and (p_include_demo or wt.order_id is null or not coalesce(o.is_demo, false))
    ),
    'lastSync',
    now()
  );
$$;

create or replace function public.create_public_listing(p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text := coalesce(nullif(trim(p_payload ->> 'title'), ''), 'Listing');
  v_kind text := case
    when lower(coalesce(p_payload ->> 'kind', '')) in ('anchor', 'presence', 'cloud') then lower(p_payload ->> 'kind')
    else 'anchor'
  end;
  v_slug_base text := coalesce(nullif(public.slugify_text(v_title), ''), 'listing');
  v_slug text := v_slug_base || '-' || right(replace(gen_random_uuid()::text, '-', ''), 8);
  v_summary text := coalesce(nullif(trim(p_payload ->> 'summary'), ''), v_title || ' live signal');
  v_capability text := coalesce(nullif(trim(p_payload ->> 'capability'), ''), case when coalesce(p_payload ->> 'mode', '') = 'video' then 'video listing' when coalesce(p_payload ->> 'mode', '') = 'service' then 'service listing' else 'product order' end);
  v_action_label text := coalesce(nullif(trim(p_payload ->> 'actionLabel'), ''), 'Open Signal');
  v_armed_label text := coalesce(nullif(trim(p_payload ->> 'armedLabel'), ''), 'Signal Active');
  v_region text := coalesce(nullif(trim(p_payload ->> 'region'), ''), 'New listing');
  v_lat numeric := coalesce(nullif(p_payload ->> 'lat', '')::numeric, 0);
  v_lng numeric := coalesce(nullif(p_payload ->> 'lng', '')::numeric, 0);
  v_alt numeric := coalesce(nullif(p_payload ->> 'alt', '')::numeric, 0.16);
  v_zoom numeric := coalesce(nullif(p_payload ->> 'zoom', '')::numeric, 1);
  v_preview_video text := nullif(trim(p_payload ->> 'previewVideo'), '');
  v_service_radius numeric := coalesce(nullif(p_payload ->> 'serviceRadiusKm', '')::numeric, 5);
  v_capacity numeric := coalesce(nullif(p_payload ->> 'capacityPerHour', '')::numeric, 24);
  v_live_capacity numeric := coalesce(nullif(p_payload ->> 'liveCapacityPerHour', '')::numeric, v_capacity);
  v_accepts_priority boolean := coalesce(nullif(p_payload ->> 'acceptsPriority', '')::boolean, true);
  v_is_demo boolean := coalesce(nullif(p_payload ->> 'demo', '')::boolean, false);
  v_tags text[] := case
    when jsonb_typeof(p_payload -> 'tags') = 'array' then array(select jsonb_array_elements_text(p_payload -> 'tags'))
    else array[]::text[]
  end;
  v_metrics jsonb := case
    when jsonb_typeof(p_payload -> 'metrics') = 'array' then p_payload -> 'metrics'
    else '[]'::jsonb
  end;
  v_catalog jsonb := case
    when jsonb_typeof(p_payload -> 'catalog') = 'array' then p_payload -> 'catalog'
    else '[]'::jsonb
  end;
  v_vendor_id uuid;
  v_mode text := lower(coalesce(p_payload ->> 'mode', 'shop'));
  v_item jsonb;
  v_result jsonb;
begin
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
    is_demo,
    summary,
    capability,
    action_label,
    armed_label,
    preview_video_url,
    tags,
    metrics,
    signal_altitude,
    signal_zoom
  )
  values (
    v_slug,
    v_title,
    v_kind,
    v_region,
    v_lat,
    v_lng,
    v_service_radius,
    v_capacity,
    v_live_capacity,
    v_accepts_priority,
    'live',
    v_is_demo,
    v_summary,
    v_capability,
    v_action_label,
    v_armed_label,
    v_preview_video,
    v_tags,
    v_metrics,
    v_alt,
    v_zoom
  )
  returning id into v_vendor_id;

  if jsonb_array_length(v_catalog) = 0 then
    v_catalog := jsonb_build_array(
      jsonb_build_object(
        'title',
        case
          when v_mode = 'video' then 'Video Listing'
          when v_mode = 'service' then 'Service Listing'
          else 'Product Listing'
        end,
        'priceEur',
        coalesce(nullif(p_payload ->> 'priceEur', '')::numeric, case when v_mode = 'service' then 18 else 9 end),
        'weightKg',
        coalesce(nullif(p_payload ->> 'weightKg', '')::numeric, 0),
        'volumeLiters',
        coalesce(nullif(p_payload ->> 'volumeLiters', '')::numeric, 0),
        'temperatureState',
        coalesce(nullif(p_payload ->> 'temperatureState', ''), 'ambient'),
        'capacityPerHour',
        v_capacity,
        'priority',
        coalesce(nullif(p_payload ->> 'priority', '')::boolean, false),
        'offeringType',
        case when v_mode = 'video' then 'video' when v_mode = 'service' then 'service' else 'product' end,
        'previewVideo',
        v_preview_video,
        'tags',
        to_jsonb(v_tags)
      )
    );
  end if;

  for v_item in
    select value
    from jsonb_array_elements(v_catalog)
  loop
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
      is_demo,
      tags,
      preview_video_url
    )
    values (
      v_vendor_id,
      v_slug || '-' || coalesce(nullif(public.slugify_text(v_item ->> 'title'), ''), 'item') || '-' || right(replace(gen_random_uuid()::text, '-', ''), 6),
      case
        when lower(coalesce(v_item ->> 'offeringType', '')) in ('product', 'service', 'video') then lower(v_item ->> 'offeringType')
        when v_mode = 'video' then 'video'
        when v_mode = 'service' then 'service'
        else 'product'
      end,
      coalesce(nullif(trim(v_item ->> 'title'), ''), 'Listing item'),
      nullif(trim(v_item ->> 'description'), ''),
      coalesce(nullif(v_item ->> 'priceEur', '')::numeric, nullif(v_item ->> 'price', '')::numeric, 0),
      coalesce(nullif(v_item ->> 'temperatureState', ''), 'ambient'),
      coalesce(nullif(v_item ->> 'weightKg', '')::numeric, 0),
      coalesce(nullif(v_item ->> 'volumeLiters', '')::numeric, 0),
      coalesce(nullif(v_item ->> 'capacityPerHour', '')::numeric, v_capacity),
      coalesce(nullif(v_item ->> 'priority', '')::boolean, false),
      true,
      v_is_demo,
      case
        when jsonb_typeof(v_item -> 'tags') = 'array' then array(select jsonb_array_elements_text(v_item -> 'tags'))
        else array[]::text[]
      end,
      coalesce(nullif(trim(v_item ->> 'previewVideo'), ''), v_preview_video)
    );
  end loop;

  select to_jsonb(feed)
  into v_result
  from public.public_signal_feed(true) as feed
  where feed.id = v_slug
  limit 1;

  return coalesce(v_result, jsonb_build_object('id', v_slug));
end;
$$;

create or replace function public.create_public_order(p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor public.vendor_profiles%rowtype;
  v_offering public.market_offerings%rowtype;
  v_distance numeric := coalesce(nullif(p_payload ->> 'distanceKm', '')::numeric, 0);
  v_weather text := coalesce(nullif(trim(p_payload ->> 'weatherCode'), ''), 'clear');
  v_subtotal numeric;
  v_weight numeric;
  v_volume numeric;
  v_priority boolean;
  v_demo boolean;
  v_requested_at timestamptz := coalesce(nullif(p_payload ->> 'requestedAt', '')::timestamptz, now());
  v_payment_provider text := nullif(trim(p_payload ->> 'paymentProvider'), '');
  v_provider_reference text := nullif(trim(p_payload ->> 'providerReference'), '');
  v_order public.orders%rowtype;
  v_quote jsonb;
  v_service_subtotal numeric;
begin
  select *
  into v_vendor
  from public.vendor_profiles
  where slug = coalesce(nullif(trim(p_payload ->> 'vendorSlug'), ''), '')
    and status = 'live'
  limit 1;

  if v_vendor.id is null then
    raise exception 'Vendor not found';
  end if;

  if coalesce(nullif(trim(p_payload ->> 'offeringSlug'), ''), '') <> '' then
    select *
    into v_offering
    from public.market_offerings
    where vendor_id = v_vendor.id
      and slug = trim(p_payload ->> 'offeringSlug')
      and active = true
    limit 1;
  end if;

  v_subtotal := coalesce(nullif(p_payload ->> 'itemSubtotalEur', '')::numeric, v_offering.price_eur, 0);
  v_weight := coalesce(nullif(p_payload ->> 'weightKg', '')::numeric, v_offering.weight_kg, 0);
  v_volume := coalesce(nullif(p_payload ->> 'volumeLiters', '')::numeric, v_offering.volume_liters, 0);
  v_priority := coalesce(nullif(p_payload ->> 'isPriority', '')::boolean, v_offering.instant_priority, false);
  v_demo := coalesce(nullif(p_payload ->> 'isDemo', '')::boolean, v_vendor.is_demo, false);

  insert into public.orders (
    vendor_id,
    offering_id,
    status,
    requested_at,
    distance_km,
    weather_code,
    item_subtotal_eur,
    weight_kg,
    volume_liters,
    is_priority,
    is_demo,
    notes
  )
  values (
    v_vendor.id,
    v_offering.id,
    'pending',
    v_requested_at,
    v_distance,
    v_weather,
    v_subtotal,
    v_weight,
    v_volume,
    v_priority,
    v_demo,
    nullif(trim(p_payload ->> 'notes'), '')
  )
  returning * into v_order;

  insert into public.order_events (
    order_id,
    event_kind,
    event_text,
    payload
  )
  values (
    v_order.id,
    'created',
    coalesce(v_offering.title, v_vendor.display_name) || ' routed into the planetary shell.',
    p_payload
  );

  select public.quote_delivery(
    v_order.distance_km,
    v_order.requested_at,
    v_order.weight_kg,
    v_order.volume_liters,
    v_order.weather_code,
    v_order.is_priority,
    v_order.item_subtotal_eur
  )
  into v_quote;

  v_service_subtotal := coalesce((v_quote ->> 'service_subtotal_eur')::numeric, round(v_order.item_subtotal_eur + v_order.delivery_base_eur, 2));

  insert into public.wallet_transactions (
    order_id,
    direction,
    transaction_kind,
    payment_provider,
    provider_reference,
    gross_eur,
    owner_fee_eur
  )
  values (
    v_order.id,
    'debit',
    'purchase',
    v_payment_provider,
    v_provider_reference,
    v_service_subtotal,
    coalesce((v_quote ->> 'owner_fee_eur')::numeric, v_order.owner_fee_eur)
  );

  return jsonb_build_object(
    'id', v_order.id,
    'signalId', v_vendor.slug,
    'title', v_vendor.display_name,
    'offeringId', v_offering.slug,
    'itemTitle', coalesce(v_offering.title, nullif(trim(p_payload ->> 'itemTitle'), ''), v_vendor.display_name),
    'status', v_order.status,
    'capacityPerHour', coalesce(v_offering.capacity_per_hour, v_vendor.live_capacity_per_hour, v_vendor.capacity_per_hour, 0),
    'priority', v_order.is_priority,
    'demo', v_order.is_demo,
    'quote', jsonb_build_object(
      'distanceKm', coalesce((v_quote ->> 'distance_km')::numeric, v_order.distance_km),
      'distanceCharge', coalesce((v_quote ->> 'distance_charge_eur')::numeric, round(v_order.distance_km * 1, 2)),
      'timeCharge', coalesce((v_quote ->> 'night_surcharge_eur')::numeric, v_order.night_surcharge_eur),
      'weatherCharge', coalesce((v_quote ->> 'weather_surcharge_eur')::numeric, v_order.weather_surcharge_eur),
      'loadCharge', coalesce((v_quote ->> 'load_surcharge_eur')::numeric, v_order.load_surcharge_eur),
      'priorityCharge', coalesce((v_quote ->> 'priority_surcharge_eur')::numeric, v_order.priority_surcharge_eur),
      'deliveryBase', v_order.delivery_base_eur,
      'subtotal', v_order.item_subtotal_eur,
      'serviceSubtotal', v_service_subtotal,
      'ownerFee', v_order.owner_fee_eur,
      'total', v_order.total_eur
    )
  );
end;
$$;

grant execute on function public.public_signal_feed(boolean) to anon, authenticated;
grant execute on function public.market_snapshot(boolean) to anon, authenticated;
grant execute on function public.create_public_listing(jsonb) to anon, authenticated;
grant execute on function public.create_public_order(jsonb) to anon, authenticated;

update public.vendor_profiles
set
  summary = 'Neighborhood grocery anchor with live product stock, delivery windows, and one-tap ordering hooks.',
  capability = 'product order',
  action_label = 'Order Products',
  armed_label = 'Basket Routed',
  tags = array['market', 'products', 'grocery', 'delivery', 'order', 'shop'],
  metrics = jsonb_build_array(
    jsonb_build_object('label', 'stock', 'value', '42 items'),
    jsonb_build_object('label', 'window', 'value', '25 min'),
    jsonb_build_object('label', 'mode', 'value', 'orderable')
  ),
  signal_altitude = 0.16,
  signal_zoom = 1
where slug = 'harbor-fresh-market';

update public.vendor_profiles
set
  summary = 'Dockside dining anchor with table timing, menu slots, and a clean reservation hook.',
  capability = 'table hook',
  action_label = 'Prime Table Hook',
  armed_label = 'Table Hook Live',
  preview_video_url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  tags = array['restaurant', 'table', 'food', 'waterfront', 'menu', 'products'],
  metrics = jsonb_build_array(
    jsonb_build_object('label', 'flow', 'value', '18:40 next slot'),
    jsonb_build_object('label', 'party', 'value', '2-6 covers'),
    jsonb_build_object('label', 'mode', 'value', 'menu hook live')
  ),
  signal_altitude = 0.16,
  signal_zoom = 1
where slug = 'marina-kitchen';

update public.vendor_profiles
set
  summary = 'Neighborhood bakery signal with early-morning ovens, hot-priority products, and short-loop delivery capacity.',
  capability = 'priority bakery',
  action_label = 'Order Bakery',
  armed_label = 'Bakery Routed',
  tags = array['bakery', 'bread', 'coffee', 'priority', 'hot', 'order', 'shop'],
  metrics = jsonb_build_array(
    jsonb_build_object('label', 'oven', 'value', 'hot lane'),
    jsonb_build_object('label', 'window', 'value', '18 min'),
    jsonb_build_object('label', 'mode', 'value', 'priority')
  ),
  signal_altitude = 0.16,
  signal_zoom = 1
where slug = 'attica-bread-lab';

update public.vendor_profiles
set
  summary = 'After-hours pharmacy anchor ready for urgent product routing, late-night surcharges, and instant dispatch.',
  capability = 'urgent order',
  action_label = 'Route Pharmacy',
  armed_label = 'Urgent Route Live',
  tags = array['pharmacy', 'night', 'urgent', 'order', 'delivery', 'shop'],
  metrics = jsonb_build_array(
    jsonb_build_object('label', 'state', 'value', 'late shift'),
    jsonb_build_object('label', 'window', 'value', '14 min'),
    jsonb_build_object('label', 'mode', 'value', 'urgent')
  ),
  signal_altitude = 0.16,
  signal_zoom = 1
where slug = 'night-pharmacy';

update public.market_offerings
set
  tags = array['market', 'grocery', 'ambient'],
  preview_video_url = null
where slug = 'citrus-box';

update public.market_offerings
set
  tags = array['market', 'grocery', 'cold'],
  preview_video_url = null
where slug = 'feta-pack';

update public.market_offerings
set
  tags = array['restaurant', 'meal', 'hot', 'priority'],
  preview_video_url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
where slug = 'harbor-pasta';

update public.market_offerings
set
  tags = array['bakery', 'coffee', 'hot', 'priority'],
  preview_video_url = 'https://www.w3schools.com/html/mov_bbb.mp4'
where slug = 'hot-coffee';

update public.market_offerings
set
  tags = array['pharmacy', 'night', 'urgent'],
  preview_video_url = null
where slug = 'pain-relief';
