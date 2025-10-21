-- Seed de operaciones históricas (solo trades) para pruebas visuales
-- Sustituye :user_id por el UUID del usuario en auth.users/profiles.
-- Ejecuta en el editor SQL de Supabase o vía psql en tu instancia.

begin;

-- Limpieza opcional (descomenta si deseas reiniciar los trades)
-- delete from public.trades where user_id = ':user_id';

insert into public.trades (
  user_id,
  symbol,
  side,
  type,
  exchange,
  entry,
  sl,
  leverage,
  size_nominal,
  risk_monetario,
  risk_en_r,
  open_time,
  close_time,
  pnl_monetario,
  pnl_r,
  cumplimiento_flags,
  status
) values
-- Semana 1
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','BTC-PERP','long','perp','Bybit',42000,41400,3,15000,225,0.75, now() - interval '14 days', now() - interval '14 days' + interval '3 hours', 320, 1.4,'{}','closed'),
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','ETH-PERP','long','perp','Bybit',2400,2340,2.5,9000,135,0.9, now() - interval '13 days', now() - interval '13 days' + interval '2 hours', 190,0.9,'{}','closed'),
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','SOL-PERP','long','perp','Bybit',160,152,2,5000,75,-0.9, now() - interval '12 days', now() - interval '12 days' + interval '1.5 hours',-170,-1.1,'{"sl_break"}','closed'),

-- Semana 2
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','BTC-PERP','short','perp','Bybit',43500,44100,3,13000,195,-0.9, now() - interval '10 days', now() - interval '10 days' + interval '4 hours',-210,-0.95,'{"no_plan"}','closed'),
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','ETH-PERP','long','perp','Bybit',2500,2430,2.5,8000,120,0.8, now() - interval '9 days', now() - interval '9 days' + interval '2.5 hours',160,0.8,'{}','closed'),
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','XRP-PERP','long','perp','Bybit',0.55,0.52,2,6000,90,0.7, now() - interval '8 days', now() - interval '8 days' + interval '3 hours',140,0.7,'{}','closed'),

-- Semana 3
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','BTC-PERP','long','perp','Bybit',42800,42000,3,14000,210,0.8, now() - interval '6 days', now() - interval '6 days' + interval '2 hours',180,0.9,'{}','closed'),
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','ETH-PERP','short','perp','Bybit',2450,2510,2.5,8500,128,-0.85, now() - interval '5 days', now() - interval '5 days' + interval '1.5 hours',-190,-0.95,'{"no_plan"}','closed'),
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','MATIC-PERP','long','perp','Bybit',0.80,0.77,1.8,4000,60,0.6, now() - interval '4 days', now() - interval '4 days' + interval '1 hour',90,0.6,'{}','closed'),

-- Semana actual (incluye trade abierto)
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','BTC-PERP','long','perp','Bybit',43200,42400,3,16000,240,1.0, now() - interval '2 days', now() - interval '2 days' + interval '4 hours',260,1.2,'{}','closed'),
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','ETH-PERP','long','perp','Bybit',2550,2470,2.5,9500,143,0.95, now() - interval '1 days', now() - interval '1 days' + interval '2 hours',210,1.0,'{}','closed'),
('0aa3f2bb-19ba-4113-a335-6a10044fb74a','BTC-PERP','long','perp','Bybit',43800,42900,3,15000,225,0.8, now() - interval '12 hours', null, null, null,'{}','open');

commit;

-- Instrucciones:
-- 1) Reemplaza :user_id por el UUID real (con comillas).
-- 2) (Opcional) Descomenta la limpieza si deseas borrar trades previos.
-- 3) Ejecuta el script para poblar operaciones en Bybit.
-- 4) Usa el UI (por ejemplo, cerrar trades) para que métricas y Ascenso se recalculen a partir de estos datos reales.
