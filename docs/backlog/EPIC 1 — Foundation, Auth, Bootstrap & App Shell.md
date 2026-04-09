# **EPIC 1 — Foundation, Auth, Bootstrap & App Shell**

Porque antes de fixtures, predicciones, ligas y scoring, el sistema necesita una base sólida de:

* monorepo y apps  
* configuración compartida  
* autenticación  
* app shell pública y autenticada  
* guards de sesión  
* contrato base con backend  
* bootstrap inicial del producto

Esto está totalmente alineado con la estructura de repo definida, el stack oficial y el alcance MVP.

---

# **Prode Mundial — EPIC 1**

## **Foundation, Auth, Bootstrap & App Shell**

---

## **1\. Propósito de la épica**

Esta épica construye la base mínima pero correcta para que el resto del MVP pueda desarrollarse sin deuda estructural.

Su objetivo es dejar implementado:

* monorepo operativo  
* apps base (`web`, `api`, `jobs`, `admin`) aunque algunas queden skeleton-only  
* configuración compartida  
* autenticación con Firebase Auth  
* login con Google y magic link  
* persistencia de sesión  
* bootstrap público del producto  
* layout y navegación principal  
* rutas públicas y protegidas  
* creación/lectura inicial del perfil de usuario  
* contratos base de API  
* manejo base de errores, loading y estados de sesión

---

## **2\. Objetivos funcionales de la épica**

Al finalizar esta épica, el sistema debe permitir que un usuario:

1. entre a la landing pública  
2. vea branding y propuesta de valor básica  
3. acceda a login / registro  
4. autenticarse con Google o magic link, tal como fue definido para el MVP  
5. crear su perfil mínimo si es primera vez  
6. entrar al área autenticada  
7. navegar el app shell principal:  
   * Inicio  
   * Partidos  
   * Rankings  
   * Ligas  
   * Perfil  
8. cerrar sesión correctamente

Además, el sistema debe permitir:

* servir `GET /api/v1/public/bootstrap`  
* validar tokens Firebase en backend  
* exponer endpoint de perfil autenticado base  
* dejar preparado el patrón de guards, repositorios y shared contracts que usarán todas las épicas posteriores

---

## **3\. Qué entra en esta épica**

### **Incluido**

* monorepo base  
* configuración de tooling  
* setup de Next.js web  
* setup de API Node/TypeScript  
* setup de jobs skeleton  
* setup de admin skeleton  
* `packages/shared`, `packages/config`, `packages/ui`, `packages/testing`  
* Firebase Auth client \+ server validation  
* Google sign-in  
* magic link sign-in  
* sesión persistida  
* guard de rutas protegidas  
* landing pública  
* login screen  
* protected app shell  
* perfil mínimo  
* endpoint bootstrap público  
* endpoint me/profile autenticado  
* manejo base de errores

### **No incluido**

* fixtures reales  
* predicción de partidos  
* macro picks  
* ligas funcionales  
* rankings funcionales  
* scoring  
* jobs productivos  
* ads reales  
* admin funcional completo

---

## **4\. Resultado esperado visible**

Al cerrar Epic 1, un reviewer debe poder probar este flujo de punta a punta:

### **Flujo demo**

1. abrir app  
2. ver landing pública  
3. ir a login  
4. autenticarse con Google o magic link  
5. completar nombre visible si falta  
6. entrar a `/home`  
7. navegar tabs principales  
8. ver perfil básico  
9. cerrar sesión  
10. volver a quedar fuera del área protegida

Ese flujo ya deja viva la columna vertebral del producto.

---

# **5\. Dependencias documentales**

Esta épica debe obedecer estrictamente:

* el canon del MVP y su foco en simplicidad, mobile-first y backend como source of truth  
* la estructura oficial de monorepo y separación por apps/packages  
* las decisiones técnicas oficiales: Next.js, Cloud Run, Firestore, Firebase Auth, pnpm y TypeScript  
* los contratos API públicos y autenticados base  
* las pantallas y navegación definidas para área pública y autenticada

---

# **6\. Definición de Done de la épica**

La épica se considera terminada solo si:

* el repo corre localmente  
* web compila  
* api compila  
* packages shared compilan  
* auth funciona con Google  
* auth funciona con magic link  
* backend valida bearer token Firebase  
* usuarios nuevos generan documento `users/{userId}`  
* usuarios existentes reutilizan su documento  
* rutas protegidas redirigen correctamente  
* rutas públicas siguen accesibles sin login  
* bottom nav autenticada existe  
* landing pública consume bootstrap real desde API  
* perfil básico es legible y editable en lo mínimo  
* hay tests base pasando  
* hay seeds/config mínima para desarrollo  
* CI básica corre lint \+ typecheck \+ test

---

# **7\. Cards de la épica**

Voy a bajarla en cards ejecutables. Cada card tiene objetivo, alcance, tareas y criterio de aceptación.

---

# **CARD 1 — Monorepo Foundation & Tooling**

## **Objetivo**

Crear la base estructural oficial del repositorio.

## **Alcance**

* inicializar monorepo con `pnpm`  
* configurar workspaces  
* configurar `turbo`  
* crear apps:  
  * `apps/web`  
  * `apps/api`  
  * `apps/jobs`  
  * `apps/admin`  
* crear packages:  
  * `packages/shared`  
  * `packages/config`  
  * `packages/ui`  
  * `packages/testing`  
* agregar config raíz:  
  * `package.json`  
  * `pnpm-workspace.yaml`  
  * `turbo.json`  
  * `tsconfig.base.json`  
  * `.env.example`  
  * `README.md`

## **Tasks**

### **Task 1.1**

Inicializar repo monorepo con `pnpm`.

### **Task 1.2**

Agregar `turbo` y scripts raíz:

* `dev`  
* `build`  
* `lint`  
* `typecheck`  
* `test`

### **Task 1.3**

Crear estructura de carpetas según documento oficial.

### **Task 1.4**

Configurar TypeScript base compartido.

### **Task 1.5**

Configurar ESLint/Prettier base o equivalente simple.

### **Task 1.6**

Agregar `README.md` con instrucciones locales mínimas.

### **Task 1.7**

Agregar `.env.example` con todas las variables necesarias placeholders.

## **Acceptance Criteria**

* el repo instala con `pnpm install`  
* `pnpm dev` arranca al menos web \+ api  
* `pnpm build` no falla  
* `pnpm typecheck` no falla  
* la estructura del repo coincide con la convención oficial

---

# **CARD 2 — Shared Contracts, Config & Base Domain Package**

## **Objetivo**

Crear la base compartida de tipos, constantes y contratos.

## **Alcance**

* `packages/shared`  
* tipos públicos iniciales  
* schemas de validación iniciales  
* enums base  
* contratos bootstrap y profile

## **Tasks**

### **Task 2.1**

Crear `packages/shared/src/types`.

### **Task 2.2**

Definir tipos base:

* `ApiSuccess<T>`  
* `ApiError`  
* `UserProfile`  
* `PublicBootstrap`  
* `AuthProvider`  
* `AppRoute`

### **Task 2.3**

Definir enums:

* auth providers  
* public/protected route groups  
* standard error codes base

### **Task 2.4**

Definir schemas de validación para:

* bootstrap response  
* profile response  
* profile update payload

### **Task 2.5**

Definir constantes:

* app name  
* tabs principales  
* route paths  
* feature flags MVP vacíos o mínimos

## **Acceptance Criteria**

* frontend y backend importan tipos desde `packages/shared`  
* no hay duplicación de tipos públicos entre apps  
* los contratos base reflejan el envelope definido en API spec

---

# **CARD 3 — Web App Base Setup**

## **Objetivo**

Levantar la aplicación Next.js con arquitectura inicial consistente.

## **Alcance**

* setup `apps/web`  
* app router  
* rutas públicas  
* rutas protegidas  
* layout general  
* providers principales

## **Tasks**

### **Task 3.1**

Inicializar Next.js \+ TypeScript.

### **Task 3.2**

Crear estructura base:

* `src/app`  
* `src/domains`  
* `src/components`  
* `src/lib`

### **Task 3.3**

Crear layouts:

* public layout  
* auth layout  
* protected layout

### **Task 3.4**

Crear providers mínimos:

* auth provider  
* query/data provider si aplica  
* toast provider  
* app config provider

### **Task 3.5**

Configurar cliente API base.

### **Task 3.6**

Configurar manejo centralizado de:

* loading  
* error boundary simple  
* not found

## **Acceptance Criteria**

* la app renderiza rutas públicas y protegidas  
* la organización respeta dominio antes que capa dentro de web

---

# **CARD 4 — API Base Setup**

## **Objetivo**

Levantar la API base sobre Cloud Run-ready Node \+ TypeScript.

## **Alcance**

* estructura API  
* healthcheck  
* versionado `/api/v1`  
* middleware base  
* auth middleware  
* manejo de errores  
* serialización estándar

## **Tasks**

### **Task 4.1**

Inicializar `apps/api` con TypeScript.

### **Task 4.2**

Crear estructura:

* routes  
* controllers  
* services  
* repositories  
* middleware  
* mappers

### **Task 4.3**

Implementar `GET /health`.

### **Task 4.4**

Implementar envelope estándar:

* `{ ok: true, data }`  
* `{ ok: false, error }`

### **Task 4.5**

Implementar middleware auth para validar Firebase ID token.

### **Task 4.6**

Agregar helper de errores estándar:

* `UNAUTHENTICATED`  
* `FORBIDDEN`  
* `VALIDATION_ERROR`  
* `INTERNAL_ERROR`

## **Acceptance Criteria**

* la API responde healthcheck  
* la API expone `/api/v1`  
* los errores salen con formato estándar del contrato público

---

# **CARD 5 — Firebase Auth Integration**

## **Objetivo**

Implementar autenticación oficial del MVP de punta a punta.

## **Alcance**

* Firebase project config  
* login con Google  
* login con magic link  
* persistencia de sesión  
* logout

## **Tasks**

### **Task 5.1**

Configurar Firebase client SDK en web.

### **Task 5.2**

Configurar Firebase Admin/server validation en API.

### **Task 5.3**

Implementar login con Google.

### **Task 5.4**

Implementar flow de magic link por email.

### **Task 5.5**

Implementar recuperación de sesión al reload.

### **Task 5.6**

Implementar logout limpio.

### **Task 5.7**

Implementar manejo de errores de auth:

* popup cancelado  
* email inválido  
* link expirado  
* token inválido

## **Acceptance Criteria**

* usuario puede entrar con Google  
* usuario puede entrar con magic link  
* la sesión persiste tras refresh  
* logout invalida acceso a rutas protegidas  
* el método de auth coincide con el MVP oficial

---

# **CARD 6 — User Profile Bootstrap**

## **Objetivo**

Garantizar que cada usuario autenticado tenga documento de perfil mínimo.

## **Alcance**

* colección `users`  
* creación automática on-first-login  
* lectura perfil actual  
* update mínimo

## **Tasks**

### **Task 6.1**

Crear repositorio `users`.

### **Task 6.2**

Implementar regla:

* si usuario autenticado no existe en DB → crear documento base

### **Task 6.3**

Persistir campos mínimos:

* `userId`  
* `displayName`  
* `email`  
* `country`  
* `photoUrl`  
* `totalPoints`  
* `macroPoints`  
* `exactHits`  
* `correctSigns`  
* `profileCompleted`  
* `createdAt`  
* `updatedAt`

### **Task 6.4**

Implementar `GET /api/v1/me/profile`.

### **Task 6.5**

Implementar `PATCH /api/v1/me/profile`.

### **Task 6.6**

Validar nombre visible requerido para experiencia posterior.

## **Acceptance Criteria**

* primer login crea perfil  
* logins siguientes no duplican usuario  
* perfil responde con shape consistente al data model canónico

---

# **CARD 7 — Public Bootstrap API \+ Landing Wiring**

## **Objetivo**

Conectar landing pública con backend real.

## **Alcance**

* endpoint público bootstrap  
* landing consumiendo bootstrap  
* reglas públicas base

## **Tasks**

### **Task 7.1**

Implementar `GET /api/v1/public/bootstrap`.

### **Task 7.2**

Devolver:

* `productName`  
* `tagline`  
* `features`  
* `authProviders`

según contrato acordado.

### **Task 7.3**

Implementar landing pública:

* hero  
* CTA jugar ahora  
* CTA unirme a una liga  
* mini bloque cómo funciona  
* acceso a reglas y puntos

### **Task 7.4**

Conectar CTA principal a login / auth flow.

## **Acceptance Criteria**

* landing carga sin auth  
* bootstrap viene desde API real  
* la propuesta de valor es consistente con la definición del producto

---

# **CARD 8 — Auth Screens & Session UX**

## **Objetivo**

Construir la experiencia UX de ingreso.

## **Alcance**

* pantalla login  
* pantalla/check de magic link  
* loaders y errores  
* redirects correctos

## **Tasks**

### **Task 8.1**

Diseñar/implementar login screen con:

* Google CTA  
* magic link CTA  
* términos y privacidad

### **Task 8.2**

Implementar formulario de email para magic link.

### **Task 8.3**

Implementar pantalla intermedia:

* “revisa tu email”

### **Task 8.4**

Implementar resolución del magic link al volver a la app.

### **Task 8.5**

Implementar redirect post-login:

* si perfil incompleto → completar perfil  
* si perfil ok → `/home`

### **Task 8.6**

Agregar copy y estados:

* loading  
* error  
* success

## **Acceptance Criteria**

* el flujo de login es claro y mobile-first  
* el usuario entiende qué hacer en cada paso  
* el área pública y auth siguen el sitemap definido

---

# **CARD 9 — Protected App Shell**

## **Objetivo**

Construir el cascarón autenticado del producto.

## **Alcance**

* top bar  
* bottom nav  
* placeholders funcionales para tabs core  
* guards de sesión

## **Tasks**

### **Task 9.1**

Implementar protected layout.

### **Task 9.2**

Implementar bottom nav con tabs:

* Inicio  
* Partidos  
* Rankings  
* Ligas  
* Perfil

según navegación principal acordada.

### **Task 9.3**

Crear pantallas placeholder:

* `/home`  
* `/matches`  
* `/rankings`  
* `/leagues`  
* `/profile`

### **Task 9.4**

Agregar route guards:

* no autenticado → redirect a login  
* autenticado → acceso permitido

### **Task 9.5**

Agregar estado de loading de sesión.

## **Acceptance Criteria**

* navegación principal autenticada existe  
* rutas protegidas no se renderizan sin sesión  
* estructura mobile-first usable desde teléfono

---

# **CARD 10 — Profile Screen MVP**

## **Objetivo**

Construir pantalla mínima de perfil del usuario.

## **Alcance**

* visualización de perfil  
* edición de nombre visible  
* edición de país opcional  
* logout

## **Tasks**

### **Task 10.1**

Renderizar:

* display name  
* email  
* país  
* avatar/foto si existe

### **Task 10.2**

Implementar edición inline o simple de:

* display name  
* country

### **Task 10.3**

Implementar CTA logout.

### **Task 10.4**

Agregar links de soporte:

* reglas y puntos  
* términos  
* privacidad

## **Acceptance Criteria**

* usuario puede ver y editar su perfil básico  
* perfil sigue alcance funcional definido para MVP

---

# **CARD 11 — API/Auth Integration Tests**

## **Objetivo**

Dejar cubierta la base de calidad de la épica.

## **Alcance**

* tests unitarios  
* tests integración mínimos  
* tests contrato base

## **Tasks**

### **Task 11.1**

Unit tests para:

* auth middleware  
* envelope serializer  
* profile mapper

### **Task 11.2**

Integration tests para:

* bootstrap público  
* me/profile autenticado  
* rechazo sin token

### **Task 11.3**

Tests web mínimos para:

* login screen render  
* redirect guard  
* logout

### **Task 11.4**

Agregar fixtures/mocks de auth y user profile.

## **Acceptance Criteria**

* tests críticos de base pasan  
* auth y profile están cubiertos al menos en happy path \+ unauthorized

---

# **CARD 12 — Dev Experience, CI & Environment Hardening**

## **Objetivo**

Dejar la épica utilizable por cualquier desarrollador o por Codex sin fricción.

## **Alcance**

* scripts  
* env vars  
* CI base  
* documentación mínima  
* seeds/dev helpers

## **Tasks**

### **Task 12.1**

Agregar validación de env vars en arranque.

### **Task 12.2**

Agregar CI básica:

* install  
* lint  
* typecheck  
* test  
* build

### **Task 12.3**

Agregar script seed/dev para crear usuario fake o dataset básico local si aplica.

### **Task 12.4**

Documentar:

* cómo correr web  
* cómo correr api  
* cómo configurar Firebase  
* cómo probar Google login  
* cómo probar magic link

## **Acceptance Criteria**

* otro developer puede levantar el proyecto siguiendo README  
* CI falla correctamente si rompe typecheck/test/build

---

# **8\. Orden recomendado de implementación**

Para Codex, el orden correcto de ejecución no es el orden visual de cards sino este:

## **Fase A — Base técnica**

1. Card 1 — Monorepo Foundation  
2. Card 2 — Shared Contracts  
3. Card 3 — Web App Base  
4. Card 4 — API Base

## **Fase B — Auth**

5. Card 5 — Firebase Auth Integration  
6. Card 6 — User Profile Bootstrap  
7. Card 8 — Auth Screens & Session UX

## **Fase C — Producto visible**

8. Card 7 — Public Bootstrap \+ Landing  
9. Card 9 — Protected App Shell  
10. Card 10 — Profile Screen MVP

## **Fase D — Calidad y endurecimiento**

11. Card 11 — Tests  
12. Card 12 — CI / Docs / Env hardening

---

# **9\. Riesgos principales de la épica**

## **Riesgo 1**

Magic link agrega complejidad de callback y sesión.

### **Mitigación**

Implementarlo temprano y probarlo antes de avanzar al shell completo.

## **Riesgo 2**

Duplicación de tipos entre frontend/backend.

### **Mitigación**

Forzar shared contracts desde Card 2\.

## **Riesgo 3**

Crear lógica de perfil en frontend sin source of truth server.

### **Mitigación**

El backend crea y sirve el perfil. El frontend solo consume y edita.

## **Riesgo 4**

Desalineación entre rutas UX y estructura técnica.

### **Mitigación**

Tomar sitemap/wireframe brief como fuente de verdad de navegación.

---

# **10\. QA Checklist de la épica**

Antes de cerrar Epic 1, validar:

* landing pública visible sin login  
* login con Google funciona  
* login con magic link funciona  
* usuario nuevo crea perfil  
* usuario existente no duplica perfil  
* ruta protegida redirige si no hay sesión  
* sesión persiste al refresh  
* logout funciona  
* bottom nav autenticada existe  
* `/api/v1/public/bootstrap` responde  
* `/api/v1/me/profile` responde autenticado  
* `PATCH /api/v1/me/profile` persiste cambios  
* errores API salen con envelope estándar  
* tests mínimos pasan  
* build del monorepo pasa

---

# **11\. Entregables concretos de la épica**

Al terminar la épica deben existir, como mínimo:

## **Repo / estructura**

* monorepo configurado  
* apps base creadas  
* packages base creados

## **Backend**

* API base productiva  
* middleware auth  
* bootstrap endpoint  
* profile endpoints

## **Frontend**

* landing pública  
* login flows  
* protected shell  
* profile MVP

## **Infra/ops**

* `.env.example`  
* CI básica  
* README operativo

## **Testing**

* suite mínima de tests base

---

# **12\. Handoff para la Epic 2**

Epic 1 deja listo el terreno para que la siguiente épica sea:

## **EPIC 2 — Fixtures, Match Detail & Match Predictions**

Porque una vez que auth, app shell y profile existen, ya se puede construir:

* listado de partidos  
* detalle de partido  
* predicción editable  
* locking por kickoff  
* estados visuales del match  
* endpoints reales de fixtures y predictions

