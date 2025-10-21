# Checklist de validación manual

1. **Onboarding**
   - Inicia sesión con email y contraseña (revisa confirmación desde Supabase).
   - Completa el formulario de “Mi Plan” y verifica que se cree una nueva versión.
2. **Dashboard**
   - Comprueba que el resumen muestre Fase/Nivel y límites actualizados.
   - Invoca `POST /api/semaforo` con data sintética y revisa el banner en dashboard.
3. **Trades**
   - Ejecuta `docs/sql/seed_dashboard_samples.sql` (tras reemplazar `:user_id`) o sincroniza fills reales.
   - En la vista “Trades” pulsa “Recalcular métricas” y confirma que las tablas abiertos/cerrados reflejen los nuevos datos.
4. **Bitácora emocional**
   - Captura un registro en `/bitacora`; confirma que el formulario se guarde y aparezca en el historial.
5. **Ascenso**
   - Tras recalcular, valida que los indicadores de XP, racha y badges se actualicen según los trades cargados.
   - Si superas las condiciones (cumplimiento ≥ 85% y 10 TPs o 10 días verdes), verifica que el plan suba de nivel; fuerza 4 SL ≥ 1R en 48 h para comprobar la bajada automática.
6. **Reportes**
   - Con varios trades cerrados en la semana, revisa el reporte y la recomendación de fase.
7. **RLS**
   - Ejecuta consultas autenticadas con dos usuarios distintos y valida aislamiento de datos.
