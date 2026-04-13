# Prode Mundial_WS24_13042026

## Resumen de cierre

Sesion enfocada en abrir el primer slice tecnico real de `Epic 5`.

Resultado principal:

- `Epic 4` queda cerrada operativamente y ya no bloquea el roadmap inmediato
- `Epic 5` ya tiene dominio shared y API funcional inicial
- `typecheck` global OK
- `test` global OK

---

# 1. Trabajo ejecutado

## 1.1 Shared domain

Se agrego la base contractual de `macro-picks` en `packages/shared`:

- grupos oficiales `A-L`
- estados:
  - `not_started`
  - `draft_editable`
  - `submitted_editable`
  - `locked_original`
  - `adjustment_available`
  - `adjusted_locked`
  - `fully_scored`
- penalty model del ajuste:
  - `finalistPoints = 5`
  - `championPoints = 12`
- contratos y schemas para:
  - `MacroPicksResponse`
  - `SaveMacroPicksInput`
  - `SaveMacroPicksResponse`
  - `ConfirmMacroAdjustmentInput`
  - `ConfirmMacroAdjustmentResponse`

Tambien se ampliaron los errores publicos de API para cubrir reglas macro:

- `INVALID_GROUP_PICK_DUPLICATE`
- `INVALID_FINALISTS_DUPLICATE`
- `INVALID_CHAMPION_NOT_IN_FINALISTS`
- `MACRO_PICKS_LOCKED`
- `ADJUSTMENT_NOT_AVAILABLE`
- `ADJUSTMENT_ALREADY_USED`

## 1.2 API

Se abrio el dominio inicial de `macro-picks` en `apps/api` con:

- repositorio Firestore para `macroPredictions/{userId}`
- servicio para:
  - derivar deadlines
  - calcular completion
  - resolver estado del modulo
  - guardar picks iniciales
  - confirmar ajuste
- controladores HTTP nuevos:
  - `GET /api/v1/macro-picks`
  - `PUT /api/v1/macro-picks`
  - `POST /api/v1/macro-picks/adjustment`

Reglas efectivamente aplicadas en este corte:

- lock inicial al kickoff del primer partido
- ajuste disponible solo si hubo picks iniciales enviados
- ajuste solo dentro de ventana previa al primer knockout
- finalistas duplicados bloqueados
- campeon fuera de finalistas bloqueado
- completion derivada server-side

## 1.3 Testing

Se agrego cobertura nueva en API:

- tests de servicio:
  - estado `not_started`
  - guardado draft
  - rechazo por finalistas duplicados
  - confirmacion de ajuste
- tests HTTP:
  - `GET /api/v1/macro-picks`
  - `PUT /api/v1/macro-picks`
  - `POST /api/v1/macro-picks/adjustment`

---

# 2. Validaciones ejecutadas

Se ejecuto:

- `./pnpm typecheck`
- `./pnpm test`

Resultado:

- `typecheck` global OK
- `test` global OK

---

# 3. Punto exacto para retomar

El siguiente slice natural de `Epic 5` es abrir la capa web real de `macro-picks`.

Orden recomendado:

1. pantalla protegida de `macro-picks`
2. estado editable con progreso y deadline
3. estado bloqueado / adjustment available
4. flujo de confirmacion de ajuste
5. tests UI minimos

Frontera recomendada:

- no abrir todavia scoring macro
- no impactar standings en este corte
- dejar `Epic 6` para el bloque siguiente
