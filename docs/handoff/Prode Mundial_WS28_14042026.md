# Prode Mundial_WS28_14042026

## Resumen de cierre

Sesion enfocada en abrir y dejar bien encaminada `Epic 6`.

Resultado principal:

- queda implementada la base real de `macro scoring`
- `macroPoints` ya impacta aggregates de usuario y standings
- queda listo el batch por torneo y el rebuild full idempotente
- se suma una fuente oficial minima de resultados macro
- `apps/jobs` ya puede ejecutar `score-macro`

---

# 1. Trabajo ejecutado

## 1.1 Base shared de macro scoring

Se agregaron contratos y schemas nuevos para:

- `MacroScoringBreakdown`
- `MacroScoringLog`
- `MacroTournamentResults`

Tambien se canonizaron reglas compartidas de scoring macro:

- grupos por slot:
  - exacto `+10`
  - clasificado correcto en posicion invertida `+5`
- finalistas:
  - original `+10` por acierto
  - ajustado `+5` por acierto
- campeon:
  - original `+25`
  - ajustado `+12`

## 1.2 Backend de scoring macro

Se implemento en `apps/api`:

- engine puro de scoring macro
- persistencia de `macroScoringLogs`
- persistencia de `macroResults/{tournamentId}` como fuente oficial minima
- scoring por usuario
- batch de scoring por torneo
- rebuild full idempotente

El rebuild de usuario ahora recompone:

- `users.macroPoints`
- `users.totalPoints = matchPoints + macroPoints`

y luego refresca standings afectadas.

## 1.3 Operacion local/dev

Se agregaron scripts nuevos en `@prode/api`:

- `upsert:macro-results`
- `score:macro`
- `rebuild:macro`

Esto permite:

- cargar resultados oficiales macro desde JSON
- correr scoring masivo por torneo
- reconstruir logs y aggregates desde cero

## 1.4 Job real

`apps/jobs` ya soporta:

- `JOB_NAME=score-macro`

con `TOURNAMENT_ID` como variable requerida.

La implementacion reutiliza la logica cerrada en `apps/api` para evitar duplicacion.

---

# 2. Validaciones ejecutadas

Se ejecuto:

- `corepack pnpm --filter @prode/shared build`
- `corepack pnpm --filter @prode/api typecheck`
- `corepack pnpm --filter @prode/api test`
- `corepack pnpm --filter @prode/jobs typecheck`
- `corepack pnpm --filter @prode/jobs test`

Resultado:

- `shared` build OK
- `api` typecheck OK
- `api` test OK
- `jobs` typecheck OK
- `jobs` test OK

---

# 3. Punto exacto para retomar

`Epic 6` queda abierta pero ya no en fase de foundation.

Siguiente bloque recomendado:

1. sumar operacion admin minima para disparar `score-macro`
2. evaluar endpoint admin para upsert de `macroResults`
3. decidir si `points`, `home` o standings necesitan exponer breakdown macro adicional
4. dejar la frontera clara con `Epic 8`, que luego deberia endurecer trazabilidad, payloads admin y reruns con `force`

Frontera recomendada:

- no reabrir `Epic 5`
- no meter UI nueva grande antes de cerrar la capa operativa minima
- mantener el siguiente slice acotado a operacion/admin y read models
