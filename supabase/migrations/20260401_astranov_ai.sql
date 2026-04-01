create extension if not exists pgcrypto;

create table if not exists public.ai_request_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lane text not null check (lane in ('owner', 'public', 'unknown')),
  provider text,
  model text,
  ip text,
  ok boolean not null default true,
  status_code integer,
  prompt_chars integer,
  response_chars integer,
  elapsed_ms integer,
  error_text text
);

create index if not exists ai_request_logs_created_at_idx on public.ai_request_logs (created_at desc);
create index if not exists ai_request_logs_lane_idx on public.ai_request_logs (lane, created_at desc);
create index if not exists ai_request_logs_provider_idx on public.ai_request_logs (provider, created_at desc);

alter table public.ai_request_logs enable row level security;

-- No read/write policies for anon or authenticated.
-- Edge Functions using the service_role key bypass RLS safely server-side.

create table if not exists public.ai_rate_limits (
  bucket_key text primary key,
  bucket_start timestamptz not null,
  hit_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists ai_rate_limits_updated_at_idx on public.ai_rate_limits (updated_at);

alter table public.ai_rate_limits enable row level security;

create or replace function public.bump_ai_rate_limit(
  p_bucket_key text,
  p_window_seconds integer,
  p_limit integer
)
returns table(allowed boolean, current_count integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.ai_rate_limits%rowtype;
  v_reset timestamptz;
begin
  if p_window_seconds < 1 then
    raise exception 'p_window_seconds must be >= 1';
  end if;

  insert into public.ai_rate_limits(bucket_key, bucket_start, hit_count, updated_at)
  values (p_bucket_key, v_now, 1, v_now)
  on conflict (bucket_key) do nothing;

  select * into v_row
  from public.ai_rate_limits
  where bucket_key = p_bucket_key
  for update;

  if v_row.bucket_start <= v_now - make_interval(secs => p_window_seconds) then
    update public.ai_rate_limits
      set bucket_start = v_now,
          hit_count = 1,
          updated_at = v_now
    where bucket_key = p_bucket_key
    returning * into v_row;
  else
    update public.ai_rate_limits
      set hit_count = v_row.hit_count + 1,
          updated_at = v_now
    where bucket_key = p_bucket_key
    returning * into v_row;
  end if;

  v_reset := v_row.bucket_start + make_interval(secs => p_window_seconds);

  return query
  select (v_row.hit_count <= p_limit), v_row.hit_count, v_reset;
end;
$$;

revoke all on table public.ai_request_logs from anon, authenticated;
revoke all on table public.ai_rate_limits from anon, authenticated;
revoke all on function public.bump_ai_rate_limit(text, integer, integer) from anon, authenticated;

create or replace function public.cleanup_ai_rate_limits(p_max_age_minutes integer default 120)
returns integer
language sql
security definer
set search_path = public
as $$
  with deleted as (
    delete from public.ai_rate_limits
    where updated_at < now() - make_interval(mins => p_max_age_minutes)
    returning 1
  )
  select count(*)::integer from deleted;
$$;
