alter table public.bybit_pnl_history
  add constraint bybit_pnl_history_user_order_closed_key unique (user_id, order_id, closed_at);
