alter table public.trades
  add constraint trades_user_external_key unique (user_id, external_id);
