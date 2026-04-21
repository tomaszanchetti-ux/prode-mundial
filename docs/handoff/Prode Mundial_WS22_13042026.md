# Prode Mundial_WS22_13042026

## Resumen de cierre

Sesion enfocada en abrir el segundo slice vertical real de `Epic 4`.

Resultado principal:

- ya existe resolucion publica de invitacion por token
- ya existe join autenticado desde invite link
- ya existe detail page protegida de liga
- la navegacion entre `Ligas`, `Detalle` y `Posiciones` ya funciona como flujo real

---

# 1. Trabajo ejecutado

## 1.1 Shared + API

Se extendio el dominio de ligas para soportar invitaciones publicas:

- `JoinLeagueInput` ahora acepta:
  - `inviteCode`
  - `inviteToken`
- se agrego `LeagueInvitePreview`
- se abrio:
  - `GET /api/v1/public/leagues/invite/:inviteToken`

Comportamiento real:

- preview publica resuelve:
  - nombre de liga
  - cantidad de miembros
  - limite
  - estado activo
- join por token reutiliza el mismo endpoint autenticado de join

## 1.2 Web

Se abrieron dos pantallas nuevas:

- landing publica:
  - `/leagues/join?token=...`
- detalle protegido:
  - `/leagues/[leagueId]`

Flujo visible que ya funciona:

1. abrir invite link
2. ver preview publica
3. si no hay sesion:
   - ir a login con retorno al invite
4. si hay sesion:
   - confirmar join
5. entrar al detalle de la liga
6. ir a posiciones con esa liga ya seleccionada

## 1.3 Navegacion

`Ligas` ya suma:

- CTA `Ver detalle` por card
- acceso al detalle desde el estado de exito luego de crear/join

`Posiciones` ya acepta `leagueId` por query string para abrir directamente la tabla correcta.

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

La parte funcional central de `Epic 4` ya esta viva.

Siguiente paso recomendado:

1. hacer QA manual completa de:
   - create
   - share
   - open invite
   - login
   - join
   - detail
   - rankings
2. corregir bugs o fricciones reales que aparezcan
3. decidir si `Epic 4` se considera cerrable o si necesita una pasada final de polish navegacional
