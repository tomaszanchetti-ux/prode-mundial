# Prode Mundial_WS29_14042026

## Resumen de cierre

Sesion enfocada en cerrar formalmente `Epic 6`.

Resultado principal:

- `Epic 6` queda cerrada a nivel MVP
- el read model de puntos ya refleja el impacto macro de forma mas completa
- `macro picks` ya puede resolver estado `fully_scored`
- `apps/jobs` ya soporta tambien el rebuild formal de macro scoring

---

# 1. Trabajo ejecutado

## 1.1 Cierre de read models de puntos

Se completo `GET /api/v1/points` para que exponga una salida mas alineada al canon de la epica:

- `totalPoints`
- `macroPoints`
- `matchPoints`
- `totals`
- `byStage`
- `recentMatches` enriquecido con:
  - resumen de pick del usuario
  - resumen de resultado oficial

La logica ahora recompone el resumen usando:

- perfil de usuario
- predicciones puntuadas
- partidos
- `macroScoringLogs`

## 1.2 Estado post scoring en macro picks

Se ajusto `MacroPicksService` para que:

- consulte logs reales de macro scoring
- devuelva `fully_scored` cuando el usuario ya tenga scoring persistido para el torneo

Esto cierra el hueco entre estados compartidos existentes y estado realmente devuelto por API.

## 1.3 Job faltante de rebuild macro

Se agrego en `apps/jobs`:

- `JOB_NAME=rebuild-macro`

con `TOURNAMENT_ID` como variable requerida.

Esto deja cerrada la capa operativa prevista por la epica para:

- `score-macro`
- `rebuild-macro`

sin duplicar logica respecto de `apps/api`.

## 1.4 Ajuste visible en web

Se actualizo la pantalla de `rankings` para reflejar mejor el cierre de la epica:

- split visible `match / macro`
- puntos por fase
- ultimos puntos con comparacion:
  - pick del usuario
  - resultado oficial

Esto deja mas claro el impacto competitivo real del scoring macro sin introducir una UI nueva grande fuera de alcance.

---

# 2. Validaciones ejecutadas

Se ejecuto:

- `corepack pnpm --filter @prode/shared build`
- `corepack pnpm --filter @prode/api test`
- `corepack pnpm --filter @prode/jobs test`
- `corepack pnpm --filter @prode/web test`
- `corepack pnpm --filter @prode/api typecheck`
- `corepack pnpm --filter @prode/jobs typecheck`
- `corepack pnpm --filter @prode/web typecheck`

Resultado:

- todo OK

---

# 3. Criterio de cierre alcanzado

`Epic 6 — Macro Scoring, Rebuilds & Standings Impact` queda cerrada porque:

- macro scoring ejecuta correctamente
- scoring permanece idempotente
- `macroScoringLogs` quedan persistidos
- `users.macroPoints` y `users.totalPoints` quedan consistentes
- standings ya reflejan impacto macro
- jobs de scoring y rebuild quedan disponibles
- tests criticos quedan verdes
- endpoints/read models ya reflejan datos de forma consistente

---

# 4. Punto exacto para retomar

Siguiente bloque recomendado:

1. abrir `Epic 8`
2. construir la capa admin minima para operacion real
3. empezar por:
   - triggers manuales seguros
   - lectura operativa de partidos
   - ingesta/correccion de resultados

Frontera recomendada:

- no reabrir `Epic 6`
- no abrir panel admin rico
- mantener `Epic 8` en un slice API-first, chico y operativo
