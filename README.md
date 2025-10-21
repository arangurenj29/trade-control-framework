# Trade Control Framework – MVP

Aplicación web para operacionalizar disciplina de trading con planes versionables, motor de reglas, semáforo diario y gamificación.

## Stack
- Next.js 14 (App Router, server actions)
- TypeScript + TailwindCSS (tokens tipo shadcn)
- Supabase (Postgres + Auth + RLS)
- React Query para caché cliente
- OpenAI API para semáforo global (prompt determinista)

## Requisitos previos
- Node.js >= 18.18
- Cuenta Supabase (project, anon key, service role opcional)
- Clave OpenAI (o usar fallback manual)

## Configuración
1. Copia `.env.example` a `.env.local` y asigna tus claves. Recuerda duplicar la URL/anon key en las variables `NEXT_PUBLIC_…` para que el cliente pueda inicializar Supabase. Activa `DEBUG_LOGS`/`NEXT_PUBLIC_DEBUG_LOGS` cuando quieras ver eventos en la terminal.
2. Ejecuta migraciones en Supabase con el contenido de `supabase/migrations/0001_initial.sql`.
3. Instala dependencias:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

Supabase usa RLS, por lo que crea al menos un usuario vía panel o `auth.signInWithOtp`. La tabla `profiles` se asocia a `auth.users`.

## Jobs y semáforo
- Endpoint `POST /api/semaforo` recibe indicadores y persiste el estado diario.
- Ruta `/api/semaforo/cron` dispara una actualización con payload base; en Vercel se agenda cada 12 h vía `vercel.json`.
- Prompt determinista en `src/lib/services/semaforo.ts`.
- Si OpenAI falla o no hay API key, se guarda estado `Indeterminado` y se loguea en `audit_logs`.

## Estructura destacada
- `src/app/(dashboard)/*`: rutas autenticadas (dashboard, plan, trades, ascenso, bitácora, reportes).
- `src/lib/actions/*`: server actions para plan y trades.
- `src/lib/services/*`: consultas y agregados para UI/Jobs.
- `supabase/migrations`: esquema, índices y políticas RLS.

## Tests
Se usa Vitest. Ejecuta `npm test`. Incluye prueba de prompt determinista como ejemplo.

## Próximos pasos sugeridos
- Añadir edge function programada (Vercel Cron) que consuma `/api/semaforo` a las 09:30 America/New_York.
- Ampliar cobertura de pruebas (validaciones, reglas de ascenso/descenso).
- Conectar canal de notificaciones para fallos del semáforo (`admin_notifications`).

## Autenticación
- Login por email/contraseña. Habilita el proveedor Email en Supabase.
- El botón "¿Olvidaste tu contraseña?" dispara `resetPasswordForEmail` y redirige a `/reset-password`, donde el usuario ingresa la nueva contraseña.
- Supabase responde "éxito" aunque el correo exista; la UI detecta ese caso y muestra un mensaje para iniciar sesión o restablecer.

## Logging opcional
- Se añadió `/api/debug-log` y utilidades en `src/lib/logger.ts`.
- Activa `DEBUG_LOGS=true` y `NEXT_PUBLIC_DEBUG_LOGS=true` para ver eventos en la consola del servidor y en DevTools. Mantén ambos en `false` en producción.

## Seguridad
- Formularios y acciones validan entrada con Zod/TypeScript antes de persistir.
- Supabase aplica RLS por `user_id` y las server actions nunca exponen claves sensibles.
- Sigue las buenas prácticas OWASP: mantén las variables secretas fuera del cliente, usa HTTPS en producción y rota credenciales periódicamente.
- Si migras desde versiones previas, añade las políticas de inserción/actualización sobre `metrics_daily` (ver `supabase/migrations/0001_initial.sql`).
- Aplica también la política de inserción sobre `gamification_state` si ya tenías la base creada previamente.

## Trades automatizados
- La aplicación lee las operaciones desde la tabla `trades` (puedes sembrar datos con `docs/sql/seed_dashboard_samples.sql`).
- El botón “Recalcular métricas” en `/trades` ejecuta las acciones de recomputo (`recomputeMetricsFromTrades` + `recomputeAscensoFromTrades`) y refresca Dashboard/Ascenso/Reportes.
- Tras recalcular, `evaluatePlanProgress` aplica automáticamente las reglas de ascenso/descenso:
  * Promoción: cumplimiento ≥ 85% y (10 días verdes consecutivos o 10 TPs en la última semana).
  * Democión: 4 SL ≥ 1R en las últimas 48 h.
  * Los cambios actualizan `user_plans` y registran un log en `audit_logs`.

## Bitácora emocional
- `/bitacora` permite registrar diariamente tu estado mental (antes/después, confianza, energía, claridad), emoción dominante, reflexión y gratitud.
- Los registros se almacenan en `emotional_logs`; el historial te ayuda a detectar patrones que impactan en la operativa.
