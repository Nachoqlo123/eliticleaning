-- =============================================================
-- Elite Cleaning – Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- =============================================================

-- 1. Users profile table (linked to Supabase Auth)
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'client',
  created_at timestamptz not null default now()
);

-- 2. Orders table
create table if not exists public.orders (
  id                 bigint generated always as identity primary key,
  user_id            uuid not null references public.users(id) on delete cascade,
  items              jsonb not null default '[]',
  subtotal           numeric not null default 0,
  discount_giftcard  numeric not null default 0,
  total_paid         numeric not null default 0,
  payment_method     text not null default 'webpay',
  payment_ref        text,
  status             text not null default 'Pagado',
  kind               text not null default 'product',
  created_at         timestamptz not null default now()
);

-- 3. Enable Row Level Security
alter table public.users  enable row level security;
alter table public.orders enable row level security;

-- 4. RLS Policies for users table
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- 5. RLS Policies for orders table
create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Admin can read all orders (optional, for admin dashboard)
-- Uncomment after setting role = 'admin' for your admin user in the users table:
-- create policy "Admin can read all orders"
--   on public.orders for select
--   using (
--     exists (select 1 from public.users where id = auth.uid() and role = 'admin')
--   );
