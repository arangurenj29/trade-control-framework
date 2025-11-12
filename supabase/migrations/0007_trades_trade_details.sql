alter table public.trades
  add column if not exists quantity numeric(18,8),
  add column if not exists exit_price numeric(18,8),
  add column if not exists close_volume numeric(18,8);

comment on column public.trades.quantity is 'Contracts/size associated to the trade';
comment on column public.trades.exit_price is 'Average exit price when the trade is closed';
comment on column public.trades.close_volume is 'Notional value at close time (quantity * exit price)';
