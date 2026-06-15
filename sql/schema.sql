-- ===== TAK2AI Database Schema =====
-- Run this in your Supabase SQL editor

-- 0. EXTENSIONS
create extension if not exists "pgcrypto";

-- ===== USERS =====
-- (handled by Supabase Auth built-in auth.users table)
-- We extend with a public profiles table

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  company_name text,
  phone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ===== LEADS =====

create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  company text,
  requirement text,
  message text,
  category text,
  source text default 'website',
  status text default 'new',
  created_at timestamptz default now()
);

alter table public.leads enable row level security;

create policy "Anyone can insert leads"
  on public.leads for insert
  with check (true);

create policy "Admin can view leads"
  on public.leads for select
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admin can update leads"
  on public.leads for update
  using (auth.jwt() ->> 'role' = 'admin');

-- ===== CHAT SESSIONS =====

create table if not exists public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text default 'New Chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.chat_sessions enable row level security;

create policy "Users can view own sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

-- ===== CHAT MESSAGES =====

create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

create policy "Users can view own messages"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert own messages"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );

-- ===== VOICE CAMPAIGNS =====

create table if not exists public.voice_campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  campaign_name text not null,
  status text default 'draft',
  leads_count int default 0,
  calls_made int default 0,
  calls_answered int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.voice_campaigns enable row level security;

create policy "Users can view own campaigns"
  on public.voice_campaigns for select
  using (auth.uid() = user_id);

create policy "Users can insert own campaigns"
  on public.voice_campaigns for insert
  with check (auth.uid() = user_id);

create policy "Users can update own campaigns"
  on public.voice_campaigns for update
  using (auth.uid() = user_id);

-- ===== CAMPAIGN LEADS =====

create table if not exists public.campaign_leads (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references public.voice_campaigns(id) on delete cascade,
  name text,
  phone text not null,
  status text default 'pending',
  called_at timestamptz,
  duration_seconds int,
  created_at timestamptz default now()
);

alter table public.campaign_leads enable row level security;

create policy "Users can view own campaign leads"
  on public.campaign_leads for select
  using (
    exists (
      select 1 from public.voice_campaigns
      where voice_campaigns.id = campaign_leads.campaign_id
      and voice_campaigns.user_id = auth.uid()
    )
  );

create policy "Users can insert own campaign leads"
  on public.campaign_leads for insert
  with check (
    exists (
      select 1 from public.voice_campaigns
      where voice_campaigns.id = campaign_leads.campaign_id
      and voice_campaigns.user_id = auth.uid()
    )
  );

-- ===== WHATSAPP BOTS =====

create table if not exists public.whatsapp_bots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  bot_name text not null,
  status text default 'active',
  faqs jsonb default '[]',
  conversations_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.whatsapp_bots enable row level security;

create policy "Users can view own bots"
  on public.whatsapp_bots for select
  using (auth.uid() = user_id);

create policy "Users can insert own bots"
  on public.whatsapp_bots for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bots"
  on public.whatsapp_bots for update
  using (auth.uid() = user_id);

-- ===== VIDEOS =====

create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  script text,
  video_url text,
  thumbnail_url text,
  status text default 'processing',
  duration_seconds int,
  created_at timestamptz default now()
);

alter table public.videos enable row level security;

create policy "Users can view own videos"
  on public.videos for select
  using (auth.uid() = user_id);

create policy "Users can insert own videos"
  on public.videos for insert
  with check (auth.uid() = user_id);

-- ===== USAGE TRACKING =====

create table if not exists public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  service text not null,
  action text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.usage enable row level security;

create policy "Users can view own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "System can insert usage"
  on public.usage for insert
  with check (auth.uid() = user_id);

-- ===== API KEYS =====

create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text,
  key_value text not null unique,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

alter table public.api_keys enable row level security;

create policy "Users can view own API keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert own API keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own API keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);

-- ===== INDEXES =====

create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_chat_sessions_user on public.chat_sessions(user_id);
create index if not exists idx_chat_messages_session on public.chat_messages(session_id);
create index if not exists idx_voice_campaigns_user on public.voice_campaigns(user_id);
create index if not exists idx_whatsapp_bots_user on public.whatsapp_bots(user_id);
create index if not exists idx_videos_user on public.videos(user_id);
create index if not exists idx_usage_user on public.usage(user_id);

-- ===== STORAGE BUCKETS =====

-- Run these in Supabase Storage UI or SQL:
-- insert into storage.buckets (id, name, public) values ('videos', 'videos', true);
-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
