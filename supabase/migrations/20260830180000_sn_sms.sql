create table if not exists public.sn_sms (
  phone text primary key,
  status text not null default 'in',
  updated_at timestamptz not null default now()
);
alter table public.sn_sms enable row level security;
