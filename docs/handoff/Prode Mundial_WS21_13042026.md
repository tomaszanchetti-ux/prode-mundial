# Prode Mundial_WS21_13042026

## Resumen de cierre

Sesion enfocada en abrir el primer slice vertical real de `Epic 4`.

Resultado principal:

- la capa social de ligas dejo de ser read-only
- ya existe create league real en backend y web
- ya existe join por codigo real en backend y web
- ya existe detail API minimo para una liga
- el listado de `Ligas` quedo conectado a esos flows reales sin romper la base visual V3

---

# 1. Trabajo ejecutado

## 1.1 Shared domain

Se extendio `packages/shared` con el contrato base de `Epic 4` slice 1:

- `CreateLeagueInput`
- `JoinLeagueInput`
- `LeagueMembershipRole`
- `LeagueDetail`
- schemas Zod equivalentes
- `ApiErrorCode` ampliado con `INVITE_EXPIRED`

## 1.2 API

Se abrio el dominio real de ligas en `apps/api` con:

- `POST /api/v1/leagues`
- `POST /api/v1/leagues/join`
- `GET /api/v1/leagues/:leagueId`

Reglas aplicadas:

- crear liga genera:
  - `leagueId`
  - `inviteCode`
  - `inviteToken`
  - `inviteLink`
- crear liga crea membership owner inicial
- join por codigo:
  - normaliza invite code
  - evita membresia duplicada
  - valida liga activa
  - valida capacidad
- luego de create/join:
  - se reconstruyen standings de la liga
  - se sincroniza `leaguesCount` del usuario

## 1.3 Web

La pantalla `Ligas` ya no queda bloqueada por la frontera previa de V3.

Quedo habilitado:

- CTA real `Crear liga`
- CTA real `Unirme con codigo`
- formularios inline
- estado de error accionable
- estado de exito con:
  - nombre de la liga
  - codigo
  - invite link
  - rol del usuario
- listado de ligas actualizado manteniendo el look & feel deportivo de V3

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

El siguiente slice natural de `Epic 4` es:

1. `GET /api/v1/public/leagues/invite/:inviteToken`
2. landing publica de invitacion
3. join autenticado desde link/token
4. detalle de liga real en UI
5. navegacion desde detalle a standings

Frontera recomendada:

- no mezclar todavia este avance con ownership avanzado, editar liga o regenerar codigos
- mantener este corte como `slice 1` cerrado y usable
