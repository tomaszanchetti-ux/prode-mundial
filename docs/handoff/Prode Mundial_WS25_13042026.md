# Prode Mundial_WS25_13042026

## Resumen de cierre

Sesion enfocada en abrir la capa web real de `Epic 5`.

Resultado principal:

- `Macro Picks` ya existe como pantalla protegida funcional en web
- la web ya consume los endpoints reales del dominio macro
- `typecheck` global OK
- `test` global OK

---

# 1. Trabajo ejecutado

## 1.1 Ruteo y cliente API

Se agrego soporte web para el modulo macro:

- nueva ruta protegida:
  - `/macro-picks`
- `APP_ROUTES` ya expone:
  - `macroPicks`
- `apps/web/src/lib/api/client.ts` ya consume:
  - `getMacroPicks`
  - `saveMacroPicks`
  - `confirmMacroAdjustment`

## 1.2 Pantalla Macro Picks

Se abrio `MacroPicksScreen` con estados reales del backend:

- `not_started`
- `draft_editable`
- `submitted_editable`
- `locked_original`
- `adjustment_available`
- `adjusted_locked`

Comportamiento visible que ya funciona:

- carga inicial del modulo
- progreso de completitud
- ventanas y deadlines visibles
- picks por grupos `A-L`
- seleccion de finalistas
- seleccion de campeon
- guardado draft / save inicial
- lectura readonly cuando el modulo ya esta bloqueado
- flujo de ajuste disponible con confirmacion
- lectura final del ajuste confirmado

## 1.3 Navegacion

`Tu Mundial` ya suma CTA directa:

- `Abrir Macro Picks`

Esto deja el modulo descubrible sin tocar todavia la bottom nav.

## 1.4 Testing

Se agrego cobertura UI nueva:

- render de draft editable
- render de estado bloqueado
- render de ajuste disponible

Tambien se revalidaron:

- tests web existentes
- tests API existentes
- contratos shared ya abiertos en la sesion anterior

---

# 2. Validaciones ejecutadas

Se ejecuto:

- `./pnpm --filter @prode/web typecheck`
- `./pnpm --filter @prode/web test`
- `./pnpm typecheck`
- `./pnpm test`

Resultado:

- `typecheck` web OK
- `test` web OK
- `typecheck` global OK
- `test` global OK

---

# 3. Punto exacto para retomar

El siguiente paso recomendado es una pasada final de polish UX sobre `Macro Picks`.

Foco recomendado:

1. validaciones client-side mas especificas
2. microcopy de errores por regla
3. evaluar entrada adicional desde `home`
4. decidir si `Epic 5` ya queda cerrable o si falta una iteracion visual corta

Frontera recomendada:

- no abrir todavia scoring macro
- no conectar todavia impacto sobre standings
- mantener `Epic 6` para el bloque posterior
