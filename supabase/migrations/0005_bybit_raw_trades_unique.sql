alter table public.bybit_raw_trades
  add constraint bybit_raw_trades_user_exec_key unique (user_id, exec_id);
