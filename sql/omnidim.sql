-- ===== OMNIDIM INTEGRATION =====
-- Run this in your Supabase SQL editor after schema.sql

-- Webhook tokens map external Omnidim requests to internal users
create table if not exists public.webhook_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  token text not null unique,
  created_at timestamptz default now()
);

alter table public.webhook_tokens enable row level security;

create policy "Users can view own webhook token"
  on public.webhook_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own webhook token"
  on public.webhook_tokens for insert
  with check (auth.uid() = user_id);

-- Omnidim agent call reports
create table if not exists public.omnidim_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  agent_id text,
  agent_name text,
  caller_number text,
  callee_number text,
  duration_seconds int,
  status text,
  transcript text,
  recording_url text,
  summary text,
  raw_payload jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.omnidim_reports enable row level security;

create policy "Users can view own omnidim reports"
  on public.omnidim_reports for select
  using (auth.uid() = user_id);

create policy "System can insert omnidim reports"
  on public.omnidim_reports for insert
  with check (true);

-- Indexes
create index if not exists idx_omnidim_reports_user on public.omnidim_reports(user_id);
create index if not exists idx_omnidim_reports_created on public.omnidim_reports(created_at desc);
create index if not exists idx_webhook_tokens_token on public.webhook_tokens(token);
