create table public.bybit_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  api_key_cipher text not null,
  api_secret_cipher text not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  last_synced_at timestamptz,
  last_cursor text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.bybit_raw_trades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  connection_id uuid not null references public.bybit_connections(id) on delete cascade,
  exec_id text not null,
  order_id text,
  payload jsonb not null,
  traded_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, exec_id)
);

alter table public.trades
  add column external_id text;

create unique index if not exists idx_trades_user_external on public.trades(user_id, external_id)
  where external_id is not null;

create index idx_bybit_connections_user on public.bybit_connections(user_id);
create index idx_bybit_raw_trades_user on public.bybit_raw_trades(user_id);

alter table public.bybit_connections enable row level security;
alter table public.bybit_raw_trades enable row level security;

create policy "Users manage their Bybit connection" on public.bybit_connections
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their Bybit trades" on public.bybit_raw_trades
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
