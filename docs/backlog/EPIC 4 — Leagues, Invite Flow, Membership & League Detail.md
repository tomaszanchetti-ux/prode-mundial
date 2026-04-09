# **EPIC 4 — Leagues, Invite Flow, Membership & League Detail**

---

# **1\. Propósito de la épica**

Esta épica construye el **núcleo social real** del MVP.

Su objetivo es dejar implementado, de punta a punta:

* creación de ligas  
* listado de ligas del usuario  
* join por código  
* join por invite token/link  
* resolución pública de invitación  
* persistencia correcta de memberships  
* detalle de liga  
* acceso al ranking de la liga desde el detalle  
* reglas de ownership mínimas  
* restricciones de liga activa/inactiva  
* UX clara para crear, compartir y unirse

Esta épica **no redefine standings** ni scoring; asume que ya existen o quedan listos desde la épica previa correspondiente.  
Su foco es dejar viva la capa social del MVP, que en el canon vive exclusivamente dentro de ligas.

---

# **2\. Objetivos funcionales de la épica**

Al finalizar esta épica, el sistema debe permitir que un usuario autenticado:

1. entre a la tab **Ligas**  
2. vea el listado de sus ligas  
3. cree una nueva liga con nombre simple  
4. reciba inmediatamente:  
   * `inviteCode`  
   * `inviteLink`  
   * límite de miembros  
5. comparta esa liga con terceros  
6. se una a una liga existente:  
   * por código  
   * por link/token  
7. vea el detalle de una liga  
8. vea en ese detalle:  
   * nombre  
   * cantidad de miembros  
   * límite de miembros  
   * si está activa  
   * invite code/link  
   * su standing resumido (`myStanding`)  
9. navegue desde el detalle al ranking completo de esa liga  
10. no pueda unirse dos veces a la misma liga  
11. no pueda unirse a una liga archivada/inactiva

Además, el sistema debe permitir:

* servir `GET /api/v1/leagues`  
* servir `POST /api/v1/leagues`  
* servir `POST /api/v1/leagues/join`  
* servir `GET /api/v1/leagues/:leagueId`  
* servir `GET /api/v1/public/leagues/invite/:inviteToken`  
* persistir `leagues/{leagueId}` con invite code/token únicos  
* persistir `leagueMembers/{membershipId}` con unicidad lógica `(leagueId, userId)`

---

# **3\. Qué entra en esta épica**

## **Incluido**

* pantalla “Mis ligas”  
* empty state de ligas  
* create league flow  
* join league flow por código  
* landing pública de invitación por token  
* resolución del invite link  
* join flow autenticado desde link público  
* detalle de liga  
* acceso al standings screen desde la liga  
* persistencia de:  
  * `leagues`  
  * `leagueMembers`  
* generación de:  
  * `inviteCode`  
  * `inviteToken`  
  * `inviteLink`  
* validación de:  
  * nombre de liga  
  * unicidad de membership  
  * liga activa/inactiva  
  * token/código válido  
* owner inicial automático al crear liga  
* members count derivado/servido  
* errores UX claros:  
  * invite inválido  
  * ya eres miembro  
  * liga inactiva  
  * código inexistente

## **No incluido**

* expulsar miembros  
* transferir ownership  
* editar nombre de liga  
* regenerar invite code/token  
* moderación  
* roles avanzados  
* chat de liga  
* activity feed social  
* notificaciones  
* archivado admin full UI  
* global ranking

Todo eso queda fuera del MVP o fuera del alcance de esta épica. El canon solo exige creación libre, join por link/código y competencia dentro de ligas.

---

# **4\. Resultado esperado visible**

Al cerrar Epic 4, un reviewer debe poder probar este flujo de punta a punta:

### **Flujo demo A — Crear liga**

1. abrir app autenticado  
2. entrar a `/leagues`  
3. ver empty state o listado  
4. tocar `Crear liga`  
5. ingresar nombre  
6. confirmar creación  
7. ver éxito con:  
   * nombre de liga  
   * invite code  
   * invite link  
8. volver al listado y ver la nueva liga

### **Flujo demo B — Join por código**

1. abrir app autenticado con otro usuario  
2. entrar a `/leagues/join`  
3. ingresar `inviteCode`  
4. confirmar join  
5. recibir respuesta exitosa  
6. ver la liga en “Mis ligas”

### **Flujo demo C — Join por link**

1. abrir invite link público  
2. ver landing pública con:  
   * nombre  
   * cantidad de miembros  
   * estado de la liga  
3. autenticarse si hace falta  
4. confirmar join  
5. entrar al detalle de la liga ya unido

### **Flujo demo D — Protección de reglas**

1. intentar unirse dos veces  
2. recibir `ALREADY_LEAGUE_MEMBER`  
3. intentar usar token inválido  
4. recibir `INVITE_INVALID`  
5. intentar unirse a liga inactiva  
6. recibir `LEAGUE_INACTIVE`

---

# **5\. Dependencias documentales**

Esta épica debe obedecer estrictamente:

* el canon del MVP:  
  * múltiples ligas por usuario  
  * creación libre  
  * join por link o código  
  * ranking completo dentro de cada liga  
  * sin roles avanzados de producto en MVP  
* la API spec:  
  * `GET /api/v1/leagues`  
  * `POST /api/v1/leagues`  
  * `POST /api/v1/leagues/join`  
  * `GET /api/v1/leagues/:leagueId`  
  * `GET /api/v1/leagues/:leagueId/standings`  
  * `GET /api/v1/public/leagues/invite/:inviteToken`  
* el data model:  
  * `leagues`  
  * `leagueMembers`  
  * `leagueStandings`  
  * unicidad `(leagueId, userId)` en membership  
  * owner/member como roles de persistencia mínimos  
* la estructura del repo:  
  * contratos compartidos en `packages/shared`  
  * dominio `leagues` desacoplado entre routes/controllers/use-cases/repositories/mappers/schemas

---

# **6\. Definición de Done de la épica**

La épica se considera terminada solo si:

* existe endpoint autenticado `GET /api/v1/leagues`  
* existe endpoint autenticado `POST /api/v1/leagues`  
* existe endpoint autenticado `POST /api/v1/leagues/join`  
* existe endpoint autenticado `GET /api/v1/leagues/:leagueId`  
* existe endpoint público `GET /api/v1/public/leagues/invite/:inviteToken`  
* crear una liga:  
  * crea documento en `leagues`  
  * crea membership owner en `leagueMembers`  
* el sistema genera `inviteCode` único  
* el sistema genera `inviteToken` único  
* `inviteLink` se deriva y persiste o compone consistentemente  
* un usuario no puede tener dos memberships en la misma liga  
* el detalle de liga devuelve `myStanding`  
* el listado de ligas devuelve posición y puntos del usuario cuando existan  
* la UI soporta:  
  * empty  
  * loading  
  * error  
  * create success  
  * join success  
  * invite invalid  
  * already member  
* existen tests unitarios de dominio  
* existen tests de integración API  
* existen tests UI mínimos  
* CI pasa con lint \+ typecheck \+ test

---

# **7\. Cards de la épica**

---

## **CARD 1 — Shared Domain Contracts for Leagues & Memberships**

### **Objetivo**

Crear en `packages/shared` los tipos, enums, schemas y errores públicos del dominio leagues.

### **Alcance**

* tipos públicos para:  
  * `LeagueSummary`  
  * `LeagueDetail`  
  * `LeagueInvitePreview`  
  * `LeagueStandingMini`  
  * `JoinLeagueRequest`  
  * `CreateLeagueRequest`  
* errores públicos:  
  * `LEAGUE_NOT_FOUND`  
  * `LEAGUE_INACTIVE`  
  * `ALREADY_LEAGUE_MEMBER`  
  * `INVITE_INVALID`  
  * `INVITE_EXPIRED`  
  * `VALIDATION_ERROR`

### **Tareas**

#### **Task 1.1**

Definir `LeagueSummary` alineado con `GET /api/v1/leagues`:

type LeagueSummary \= {  
  leagueId: string  
  name: string  
  memberLimit: number  
  membersCount: number  
  position: number | null  
  userPoints: number  
  isActive: boolean  
  inviteCode: string  
  inviteLink: string  
}

#### **Task 1.2**

Definir `LeagueStandingMini` para `myStanding`:

type LeagueStandingMini \= {  
  position: number | null  
  totalPoints: number  
  exactHits: number  
  correctSigns: number  
  macroPoints: number  
}

#### **Task 1.3**

Definir `LeagueDetail` alineado con API:

type LeagueDetail \= {  
  leagueId: string  
  name: string  
  memberLimit: number  
  ownerUserId: string  
  isActive: boolean  
  membersCount: number  
  inviteCode: string  
  inviteLink: string  
  myStanding: LeagueStandingMini | null  
}

#### **Task 1.4**

Definir `LeagueInvitePreview` alineado con endpoint público:

type LeagueInvitePreview \= {  
  leagueId: string  
  name: string  
  memberLimit: number  
  membersCount: number  
  isActive: boolean  
  canJoin: boolean  
  isAuthenticated: boolean  
  isAlreadyMember: boolean  
}

#### **Task 1.5**

Definir `CreateLeagueRequest` y schema:

type CreateLeagueRequest \= {  
  name: string  
}

Validaciones:

* requerido  
* trim obligatorio  
* min/max length  
* no permitir nombre vacío post-trim

#### **Task 1.6**

Definir `JoinLeagueRequest` con unión exclusiva:

type JoinLeagueRequest \=  
  | { inviteCode: string }  
  | { inviteToken: string }

Validaciones:

* debe venir exactamente uno  
* no ambos  
* no ninguno

### **Acceptance Criteria**

* frontend y backend importan los mismos contratos  
* todos los payloads leagues quedan tipados desde shared  
* errores públicos quedan alineados con la API spec

---

## **CARD 2 — League Persistence Model & Repository Layer**

### **Objetivo**

Implementar la capa persistente de `leagues` y `leagueMembers` respetando el data model canónico.

### **Alcance**

* repositorio `leaguesRepository`  
* repositorio `leagueMembersRepository`  
* helpers de unicidad de invite code/token  
* queries por owner, membership, token y code

### **Tareas**

#### **Task 2.1**

Crear `leaguesRepository` con métodos mínimos:

* `createLeague(input)`  
* `getLeagueById(leagueId)`  
* `getLeagueByInviteCode(inviteCode)`  
* `getLeagueByInviteToken(inviteToken)`  
* `listLeaguesByUser(userId)`

#### **Task 2.2**

Crear `leagueMembersRepository` con métodos mínimos:

* `createMembership(input)`  
* `getMembershipByLeagueAndUser(leagueId, userId)`  
* `listMembershipsByUser(userId)`  
* `countMembersByLeague(leagueId)`

#### **Task 2.3**

Respetar shape canónico de `leagues`:

* `leagueId`  
* `name`  
* `ownerUserId`  
* `inviteCode`  
* `inviteToken`  
* `inviteLink`  
* `isActive`  
* `archivedAt`  
* `createdAt`  
* `updatedAt`

#### **Task 2.4**

Respetar shape canónico de `leagueMembers`:

* `membershipId`  
* `leagueId`  
* `userId`  
* `role`  
* `joinedAt`

#### **Task 2.5**

Implementar constraint lógica única `(leagueId, userId)`.

No depender solo de validación client-side.

### **Acceptance Criteria**

* se puede crear una liga con owner membership  
* no se puede duplicar membership  
* se puede resolver liga por token o code  
* la capa HTTP no contiene lógica de persistencia

---

## **CARD 3 — Invite Code & Invite Token Generation Rules**

### **Objetivo**

Definir e implementar la generación robusta de `inviteCode`, `inviteToken` e `inviteLink`.

### **Alcance**

* generator puro  
* retry simple por colisión  
* formato consistente  
* sin sobre-ingeniería

### **Tareas**

#### **Task 3.1**

Definir formato de `inviteCode`.

Recomendación MVP:

* uppercase  
* legible  
* 6 a 8 caracteres  
* sin caracteres ambiguos (`0/O`, `1/I`) si se quiere mejorar UX

Ejemplo:

* `MADRID26` es ejemplo de API, pero no debe asumirse formato semántico fijo.

#### **Task 3.2**

Definir `inviteToken` como string opaca no adivinable.

Recomendación:

* 16 a 24 chars  
* URL-safe

#### **Task 3.3**

Construir `inviteLink` desde config pública de app:

${PUBLIC\_APP\_URL}/join/${inviteToken}

#### **Task 3.4**

Implementar retry con límite pequeño ante colisión:

* code collision  
* token collision

#### **Task 3.5**

Registrar tests:

* formato válido  
* token URL-safe  
* colisión reintentable

### **Acceptance Criteria**

* `inviteCode` único  
* `inviteToken` único  
* `inviteLink` consistente en todos los entornos

---

## **CARD 4 — POST /api/v1/leagues**

### **Objetivo**

Implementar el endpoint autenticado de creación de liga.

### **Alcance**

* auth obligatoria  
* validación payload  
* creación transaccional mínima lógica:  
  * league  
  * owner membership

### **Tareas**

#### **Task 4.1**

Crear route/controller `POST /api/v1/leagues`.

#### **Task 4.2**

Validar request:

* `name` requerido  
* trim  
* longitud mínima/máxima

#### **Task 4.3**

Implementar use-case `create-league`:

Flujo:

1. validar usuario autenticado  
2. normalizar nombre  
3. derivar `memberLimit = 20`  
4. generar inviteCode  
5. generar inviteToken  
6. derivar inviteLink  
7. crear `leagues/{leagueId}`  
8. crear `leagueMembers/{membershipId}` con role `owner`  
9. devolver contrato API

#### **Task 4.4**

Response exacta alineada con spec:

{  
  "ok": true,  
  "data": {  
    "leagueId": "lg\_123",  
    "name": "Liga Oficina Madrid",  
    "memberLimit": 20,  
    "ownerUserId": "usr\_1",  
    "inviteCode": "MADRID26",  
    "inviteLink": "https://app.prode.com/join/abc123",  
    "isActive": true,  
    "createdAt": "2026-06-10T10:00:00Z"  
  }  
}

### **Acceptance Criteria**

* liga creada correctamente  
* owner membership creado automáticamente  
* response envelope correcto  
* errores tipados y claros

---

## **CARD 5 — GET /api/v1/leagues**

### **Objetivo**

Implementar el listado de ligas del usuario.

### **Alcance**

* listar memberships del usuario  
* enriquecer con datos de liga  
* incorporar posición y puntos si el standings read model ya existe

### **Tareas**

#### **Task 5.1**

Crear route/controller `GET /api/v1/leagues`.

#### **Task 5.2**

Implementar use-case `list-my-leagues`:

Flujo:

1. obtener memberships por `userId`  
2. obtener ligas relacionadas  
3. obtener row de standings por liga y usuario si existe  
4. mapear a `LeagueSummary`

#### **Task 5.3**

Devolver:

* `leagueId`  
* `name`  
* `membersCount`  
* `position`  
* `userPoints`  
* `isActive`  
* `inviteCode`  
* `inviteLink`

#### **Task 5.4**

Definir comportamiento cuando standings aún no existe:

* `position = null`  
* `userPoints = 0` o agregado real si ya existe en user/standing  
* no fallar el endpoint

### **Acceptance Criteria**

* usuario ve todas sus ligas  
* el endpoint no exige cálculos client-side  
* soporta ligas sin standings inicial aún

---

## **CARD 6 — GET /api/v1/public/leagues/invite/:inviteToken**

### **Objetivo**

Resolver la landing pública del invite link.

### **Alcance**

* endpoint público  
* sin auth obligatoria  
* aware de usuario autenticado si el token viene con sesión

### **Tareas**

#### **Task 6.1**

Crear route/controller público.

#### **Task 6.2**

Resolver liga por `inviteToken`.

#### **Task 6.3**

Mapear respuesta:

* `leagueId`  
* `name`  
* `membersCount`  
* `isActive`  
* `canJoin`  
* `isAuthenticated`  
* `isAlreadyMember`

#### **Task 6.4**

Reglas:

* si token no existe → `INVITE_INVALID`  
* si liga inactiva → `LEAGUE_INACTIVE`  
* si usuario autenticado ya pertenece:  
  * `isAlreadyMember = true`  
  * `canJoin = false`  
* si usuario no autenticado:  
  * `isAuthenticated = false`

### **Acceptance Criteria**

* el link público se puede abrir sin login  
* la pantalla puede decidir correctamente si debe:  
  * pedir login  
  * ofrecer join  
  * mostrar ya eres miembro  
  * mostrar invite inválido

---

## **CARD 7 — POST /api/v1/leagues/join**

### **Objetivo**

Implementar el join flow por código o por token.

### **Alcance**

* auth obligatoria  
* resolución por código/token  
* create membership  
* prevención de duplicados

### **Tareas**

#### **Task 7.1**

Crear route/controller `POST /api/v1/leagues/join`.

#### **Task 7.2**

Validar payload exclusivo:

* `inviteCode`  
* o `inviteToken`

#### **Task 7.3**

Implementar use-case `join-league`:

Flujo:

1. validar usuario autenticado  
2. resolver liga por code o token  
3. verificar que exista  
4. verificar que esté activa  
5. verificar que el usuario no sea ya miembro  
6. verificar que haya cupo  
7. crear membership con role `member`  
8. devolver:  
   * `leagueId`  
   * `name`  
   * `memberLimit`  
   * `joined: true`  
   * `membersCount`

#### **Task 7.4**

Errores obligatorios:

* `LEAGUE_NOT_FOUND`  
* `LEAGUE_INACTIVE`  
* `LEAGUE_CAPACITY_REACHED`  
* `ALREADY_LEAGUE_MEMBER`  
* `INVITE_INVALID`

### **Acceptance Criteria**

* se puede unir por código  
* se puede unir por token  
* no se puede duplicar join  
* no se puede superar `memberLimit`  
* membership se persiste correctamente

---

## **CARD 8 — GET /api/v1/leagues/:leagueId**

### **Objetivo**

Implementar el detalle de liga autenticado.

### **Alcance**

* auth obligatoria  
* acceso solo si el usuario es miembro  
* summary de liga \+ `myStanding`

### **Tareas**

#### **Task 8.1**

Crear route/controller `GET /api/v1/leagues/:leagueId`.

#### **Task 8.2**

Implementar use-case `get-league-detail`:

Flujo:

1. validar auth  
2. resolver liga por `leagueId`  
3. validar existencia  
4. validar membership del usuario  
5. obtener membersCount  
6. obtener row de standing del usuario si existe  
7. mapear response

#### **Task 8.3**

Response exacta alineada con spec:

{  
  "ok": true,  
  "data": {  
    "leagueId": "lg\_123",  
    "name": "Liga Oficina Madrid",  
    "memberLimit": 20,  
    "ownerUserId": "usr\_1",  
    "isActive": true,  
    "membersCount": 12,  
    "inviteCode": "MADRID26",  
    "inviteLink": "https://app.prode.com/join/abc123",  
    "myStanding": {  
      "position": 2,  
      "totalPoints": 74,  
      "exactHits": 8,  
      "correctSigns": 6,  
      "macroPoints": 30  
    }  
  }  
}

#### **Task 8.4**

Regla de acceso:

* si no existe membership → `FORBIDDEN` o `LEAGUE_NOT_FOUND` según política de seguridad elegida  
* mantener consistencia en toda API

### **Acceptance Criteria**

* solo miembros ven detalle de liga  
* `myStanding` aparece correctamente  
* el detalle sirve como pantalla principal de una liga

---

## **CARD 9 — League Detail UI**

### **Objetivo**

Construir la pantalla de detalle de liga mobile-first.

### **Alcance**

* header de liga  
* bloque de mi posición  
* bloque compartir invite  
* CTA a standings completos

### **Tareas**

#### **Task 9.1**

Crear `league-detail-screen.tsx`.

#### **Task 9.2**

Renderizar:

* nombre de liga  
* `membersCount`  
* badge activo/inactivo si aplica  
* mi posición  
* mis puntos  
* mis exact hits  
* mis correct signs  
* mis macro points

#### **Task 9.3**

Renderizar bloque compartir:

* mostrar `inviteCode`  
* mostrar `inviteLink`  
* CTA `Copiar código`  
* CTA `Copiar link`

#### **Task 9.4**

Agregar CTA principal:

* `Ver ranking`

#### **Task 9.5**

Estados:

* loading  
* error  
* forbidden/no member  
* league inactive  
* data ready

### **Acceptance Criteria**

* el usuario entiende en segundos:  
  * dónde está parado  
  * cómo invitar gente  
  * cómo ver el ranking completo

---

## **CARD 10 — My Leagues Screen UI**

### **Objetivo**

Construir la pantalla “Mis ligas”.

### **Alcance**

* listado  
* empty state  
* CTA crear  
* CTA unirse  
* cards reutilizables

### **Tareas**

#### **Task 10.1**

Crear `my-leagues-screen.tsx`.

#### **Task 10.2**

Renderizar card por liga con:

* nombre  
* cantidad de miembros  
* posición del usuario  
* puntos del usuario  
* estado activo/inactivo

#### **Task 10.3**

Empty state:

* título claro  
* CTA `Crear liga`  
* CTA secundaria `Unirme a una liga`

#### **Task 10.4**

Orden recomendado:

* ligas activas primero  
* luego inactivas  
* dentro de activas, opción simple:  
  * por creación reciente  
  * o por posición/nombre  
* no sobre-optimizar en MVP

### **Acceptance Criteria**

* la pantalla es usable aun con 0 ligas  
* la pantalla escala bien con varias ligas  
* no requiere lógica extra en cliente

---

## **CARD 11 — Create League Flow UI**

### **Objetivo**

Construir el flujo de creación de liga.

### **Alcance**

* modal o screen dedicada  
* nombre simple  
* confirmación  
* success state con assets de share

### **Tareas**

#### **Task 11.1**

Crear form:

* input `name`  
* validación inline básica  
* submit explícito

#### **Task 11.2**

Estados:

* idle  
* submitting  
* success  
* validation error  
* generic error

#### **Task 11.3**

Success state:

* mostrar `inviteCode`  
* mostrar `inviteLink`  
* mostrar límite  
* CTA `Copiar código`  
* CTA `Copiar link`  
* CTA `Ir a la liga`

#### **Task 11.4**

No introducir settings extras:

* sin avatar de liga  
* sin descripción  
* sin privacy modes  
* sin límite de miembros configurable

### **Acceptance Criteria**

* crear liga toma pocos segundos  
* la UX queda enfocada en compartir de inmediato

---

## **CARD 12 — Join League Flow UI**

### **Objetivo**

Construir el flujo manual de join por código y el flujo desde invite link.

### **Alcance**

* screen o modal de join manual  
* join desde invite preview pública

### **Tareas**

#### **Task 12.1**

Crear `join-league-screen.tsx` con input de código.

#### **Task 12.2**

Estados:

* idle  
* submitting  
* invalid code  
* already member  
* league inactive  
* success

#### **Task 12.3**

Crear `public-invite-preview-screen.tsx`.

Renderizar:

* nombre de liga  
* cantidad de miembros  
* CTA según estado:  
  * `Inicia sesión para unirte`  
  * `Unirme a la liga`  
  * `Ya eres miembro`  
  * `Liga inactiva`

#### **Task 12.4**

Después de join exitoso:

* redirect a `/leagues/:leagueId`

### **Acceptance Criteria**

* se puede entrar a liga tanto por código como por link  
* el usuario nunca queda perdido en el flujo

---

## **CARD 13 — Membership & Access Rules**

### **Objetivo**

Centralizar reglas de acceso y membresía del dominio.

### **Alcance**

* policies reutilizables  
* sin lógica duplicada entre endpoints

### **Tareas**

#### **Task 13.1**

Crear policy/helper:

* `assertLeagueExists`  
* `assertLeagueIsActive`  
* `assertUserIsLeagueMember`  
* `assertUserIsNotLeagueMember`

#### **Task 13.2**

Crear helper:

* `resolveLeagueFromJoinInput`

#### **Task 13.3**

Documentar decisiones:

* liga inactiva no acepta nuevos joins  
* owner inicial es el creador  
* MVP no soporta abandonar liga si deja liga sin owner  
* MVP no soporta transfer ownership

### **Acceptance Criteria**

* reglas de membership no están duplicadas en controllers  
* todos los endpoints leagues reutilizan las mismas policies

---

## **CARD 14 — Tests**

### **Objetivo**

Cubrir el dominio leagues con tests suficientes para evitar bugs de integridad.

### **Alcance**

* unit  
* integration  
* UI smoke tests

### **Tareas**

#### **Task 14.1 — Unit tests**

Cubrir:

* validación de `CreateLeagueRequest`  
* validación de `JoinLeagueRequest`  
* generación de inviteCode  
* generación de inviteToken  
* prevención de duplicate membership

#### **Task 14.2 — Integration tests**

Cubrir:

* `POST /leagues` crea liga \+ owner membership  
* `GET /leagues` lista ligas del usuario  
* `POST /leagues/join` por código funciona  
* `POST /leagues/join` por token funciona  
* join duplicado falla con `ALREADY_LEAGUE_MEMBER`  
* token inválido falla con `INVITE_INVALID`  
* liga inactiva falla con `LEAGUE_INACTIVE`  
* `GET /public/leagues/invite/:token` responde correctamente según contexto  
* `GET /leagues/:leagueId` exige membership

#### **Task 14.3 — UI tests**

Cubrir:

* empty state de ligas  
* create league success  
* join league success  
* invite invalid state  
* already member state

### **Acceptance Criteria**

* el dominio leagues queda protegido contra los errores más probables del MVP

---

# **8\. Fases recomendadas de implementación**

## **Fase A — Contratos y persistencia**

1. Card 1 — Shared contracts  
2. Card 2 — Persistence model  
3. Card 3 — Invite generation

## **Fase B — Backend core**

4. Card 4 — POST /leagues  
5. Card 5 — GET /leagues  
6. Card 6 — GET public invite preview  
7. Card 7 — POST /leagues/join  
8. Card 8 — GET /leagues/:leagueId

## **Fase C — Frontend visible**

9. Card 10 — My leagues  
10. Card 11 — Create league  
11. Card 12 — Join league  
12. Card 9 — League detail

## **Fase D — Endurecimiento**

13. Card 13 — Membership policies  
14. Card 14 — Tests

---

# **9\. Riesgos principales de la épica**

## **Riesgo 1**

Generar memberships duplicados por carreras o retries.

### **Mitigación**

Constraint lógica `(leagueId, userId)` \+ validación server-side \+ idempotencia defensiva en repositorio.

## **Riesgo 2**

Que el invite code o token colisione.

### **Mitigación**

Generator con retry simple y chequeo de unicidad previo a persistir.

## **Riesgo 3**

Que el frontend calcule por su cuenta si puede unirse o no.

### **Mitigación**

El backend debe devolver `canJoin`, `isAlreadyMember`, `isAuthenticated` ya interpretados en el invite preview.

## **Riesgo 4**

Exponer detalles de ligas a usuarios no miembros de forma inconsistente.

### **Mitigación**

* preview público solo por token y con payload limitado  
* detalle autenticado de liga solo para miembros

## **Riesgo 5**

Dejar la UX de share poco accionable.

### **Mitigación**

Success state inmediato tras creación con:

* invite code visible  
* invite link visible  
* copy CTA claro

---

# **10\. QA Checklist de la épica**

Antes de cerrar Epic 4, validar:

* `/api/v1/leagues` responde autenticado  
* `/api/v1/leagues` devuelve lista vacía correctamente si no hay ligas  
* `POST /api/v1/leagues` crea liga válida  
* crear liga genera owner membership  
* create flow devuelve invite code y invite link  
* `/api/v1/public/leagues/invite/:inviteToken` responde sin auth  
* invite preview muestra estado correcto si el usuario no está logueado  
* invite preview muestra “ya eres miembro” si corresponde  
* `POST /api/v1/leagues/join` funciona por código  
* `POST /api/v1/leagues/join` funciona por token  
* join duplicado falla con `ALREADY_LEAGUE_MEMBER`  
* token inválido falla con `INVITE_INVALID`  
* liga inactiva falla con `LEAGUE_INACTIVE`  
* `/api/v1/leagues/:leagueId` devuelve `myStanding`  
* detalle de liga solo es visible para miembros  
* copy code/link funciona en web  
* tests mínimos pasan  
* build del monorepo pasa

---

# **11\. Entregables concretos de la épica**

Al terminar la épica deben existir, como mínimo:

## **Backend**

* repositorio de ligas  
* repositorio de memberships  
* generador de invite code/token  
* endpoint `GET /api/v1/leagues`  
* endpoint `POST /api/v1/leagues`  
* endpoint `POST /api/v1/leagues/join`  
* endpoint `GET /api/v1/leagues/:leagueId`  
* endpoint `GET /api/v1/public/leagues/invite/:inviteToken`  
* policies de acceso/membresía

## **Frontend**

* pantalla Mis ligas  
* pantalla Crear liga  
* pantalla Unirme a liga  
* pantalla pública de invite preview  
* pantalla Detalle de liga  
* card reutilizable de liga  
* UX states de create/join/share/error

## **Shared**

* contratos y schemas públicos del dominio leagues  
* catálogo de errores públicos del módulo

## **Testing**

* unit tests dominio  
* integration tests API  
* UI tests mínimos

## **Ops**

* README actualizado para probar creación/join de ligas  
* seeds opcionales de ligas demo si conviene para QA local
