alter table public.sn_sms add column if not exists code_hash text;
alter table public.sn_sms add column if not exists code_expires timestamptz;
alter table public.sn_sms add column if not exists last_sent_at timestamptz;
alter table public.sn_sms add column if not exists attempts int not null default 0;
alter table public.sn_sms add column if not exists verified_at timestamptz;
