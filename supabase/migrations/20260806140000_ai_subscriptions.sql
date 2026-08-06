-- Astranov AI subscriptions + transcripts (markup 3×)
-- api_budget_eur = price_eur / 3  (user pays 3× real Grok cost)

create table if not exists public.ai_subscriptions (
  profile_id uuid not null references auth.users(id) on delete cascade,
  period text not null, -- YYYY-MM UTC
  active boolean not null default true,
  tier_id text,
  price_eur numeric(12,2) not null default 0,
  api_budget_eur numeric(12,4) not null default 0,
  api_spent_eur numeric(12,4) not null default 0,
  payment_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, period)
);

create index if not exists ai_subscriptions_active_idx
  on public.ai_subscriptions (active, period);

create table if not exists public.ai_transcripts (
  id bigserial primary key,
  profile_id uuid,
  user_email text,
  is_owner boolean default false,
  query text,
  response text,
  via text,
  paid boolean default false,
  api_eur numeric(12,6) default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_transcripts_created_idx
  on public.ai_transcripts (created_at desc);

comment on table public.ai_subscriptions is
  'Monthly AI plans. Markup 3x: €3 sub → €1 real xAI budget. Owner unlimited via is_owner.';
