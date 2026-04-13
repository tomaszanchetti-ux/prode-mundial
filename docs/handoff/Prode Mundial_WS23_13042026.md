# Prode Mundial_WS23_13042026

## Resumen de cierre

Sesion enfocada en cerrar operativamente `Epic 4` y preparar la apertura de `Epic 5`.

Resultado principal:

- `Epic 4` queda validada manualmente y sin bloqueos abiertos
- `typecheck` global OK
- `test` global OK
- `Epic 5` queda confirmada como siguiente bloque natural del backlog

---

# 1. Trabajo ejecutado

## 1.1 Cierre operativo de Epic 4

Se toma como validado el flujo completo ya abierto en codigo:

1. crear liga
2. compartir codigo o invite link
3. abrir invitacion publica
4. autenticarse con retorno correcto
5. unirse por token
6. entrar al detalle de liga
7. navegar a `Posiciones` con la liga preseleccionada

Criterio de cierre aplicado:

- no abrir features nuevas
- no mezclar polish general sin evidencia
- no reabrir la epica si no hay bug o regresion concreta

## 1.2 Verificacion automatizada

Se ejecuto:

- `./pnpm typecheck`
- `./pnpm test`

Resultado:

- `typecheck` global OK
- `test` global OK

Senales relevantes:

- los tests de API ya cubren:
  - preview publica de invitacion
  - join por codigo
  - join por token
  - proteccion ante `ALREADY_LEAGUE_MEMBER`
- los tests de web ya cubren:
  - render base de `Ligas`
  - estado de exito de create
  - lectura de `Posiciones`

## 1.3 Preparacion de Epic 5

Quedo reconfirmado el siguiente marco binding para arranque:

- endpoints objetivo:
  - `GET /api/v1/macro-picks`
  - `PUT /api/v1/macro-picks`
  - `POST /api/v1/macro-picks/adjustment`
- estados UX/API:
  - `not_started`
  - `draft_editable`
  - `submitted_editable`
  - `locked_original`
  - `adjustment_available`
  - `adjusted_locked`
  - `fully_scored`
- reglas criticas:
  - lock exacto al kickoff del torneo
  - ajuste solo una vez
  - ajuste solo si hubo picks iniciales
  - ajuste cambia solo finalistas y campeon
  - campeon debe pertenecer a finalistas
  - finalistas no pueden repetirse

Orden recomendado para la siguiente sesion:

1. `packages/shared`
2. `apps/api` dominio + persistencia
3. `apps/api` rutas/controladores
4. `apps/web` pantalla y flujo de `macro-picks`
5. tests utiles por capa

---

# 2. Punto exacto para retomar

El siguiente paso recomendado es abrir branch dedicada de `Epic 5` y empezar por contratos shared del dominio `macro-picks`.

Frontera recomendada:

- no mezclar todavia `Epic 5` con scoring macro completo
- no tocar standings por impacto macro en este corte
- dejar `Epic 6` para el bloque posterior
