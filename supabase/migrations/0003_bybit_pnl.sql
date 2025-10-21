create table public.bybit_pnl_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id text not null,
  symbol text not null,
  side text,
  qty numeric(18,8),
  realised_pnl numeric(14,4),
  fee numeric(14,4),
  avg_entry_price numeric(18,8),
  avg_exit_price numeric(18,8),
  closed_size numeric(18,8),
  leverage numeric(10,4),
  closed_at timestamptz not null,
  raw jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, order_id, closed_at)
);

create table public.account_balance_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null default 'bybit',
  balance numeric(18,8) not null,
  equity numeric(18,8),
  available_balance numeric(18,8),
  captured_at timestamptz not null default now()
);

create index idx_bybit_pnl_user_closed_at on public.bybit_pnl_history(user_id, closed_at);
create index idx_account_balance_user_time on public.account_balance_snapshots(user_id, captured_at desc);

alter table public.bybit_pnl_history enable row level security;
alter table public.account_balance_snapshots enable row level security;

create policy "Users manage their Bybit PnL" on public.bybit_pnl_history
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their balance snapshots" on public.account_balance_snapshots
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
