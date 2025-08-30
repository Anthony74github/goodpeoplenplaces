create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  username text,
  "from" text,
  greeting text,
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text default '',
  country text,
  text text,
  photo_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

create policy "profiles_read" on public.profiles for select using ( true );
create policy "posts_read" on public.posts for select using ( true );

create policy "profiles_write_own" on public.profiles for insert with check ( auth.uid() = id );
create policy "profiles_update_own" on public.profiles for update using ( auth.uid() = id );

create policy "posts_insert_own" on public.posts for insert with check ( auth.uid() = user_id );
create policy "posts_update_own" on public.posts for update using ( auth.uid() = user_id );
create policy "posts_delete_own" on public.posts for delete using ( auth.uid() = user_id );

-- Storage: create bucket 'trip-photos'. Set public read; allow authenticated uploads.
