# **EPIC 2 — Fixtures, Match Detail & Match Predictions**

Continuamos exactamente en la línea correcta que deja planteada Epic 1: una vez resueltos auth, app shell, profile y contratos base, la siguiente pieza del MVP es el **core jugable partido a partido**: listado de fixtures, detalle de partido, guardado de predicción y locking estricto por kickoff.

---

## **1\. Propósito de la épica**

Esta épica construye el primer módulo verdaderamente jugable del producto.

Su objetivo es dejar implementado, de punta a punta:

* lectura autenticada de fixtures  
* lectura de detalle de partido  
* creación y edición de predicciones match-level  
* reglas de validación para fase de grupos y knockout  
* bloqueo estricto por kickoff  
* estados UX consistentes para partido y predicción  
* persistencia correcta en backend  
* contracts compartidos listos para reutilización en scoring, home y puntos

Esta épica debe dejar al usuario en condiciones de hacer lo más importante del MVP: **predecir partidos rápido, con claridad y sin ambigüedad**, respetando el principio canónico de que el backend resuelve la lógica crítica y el frontend solo consume estados ya interpretables.

---

## **2\. Objetivos funcionales de la épica**

Al finalizar esta épica, el sistema debe permitir que un usuario autenticado:

1. entre a la tab **Partidos**  
2. vea un listado de fixtures con filtros útiles  
3. entienda rápidamente:  
   * qué partido está abierto  
   * cuál ya está bloqueado  
   * cuál ya tiene predicción guardada  
   * cuál ya fue puntuado  
4. entre al detalle de un partido  
5. cargue una predicción de score  
6. en knockout, si predice empate, elija obligatoriamente quién clasifica  
7. guarde su predicción con feedback explícito  
8. vuelva a editarla mientras siga abierta  
9. vea el partido bloqueado automáticamente al llegar el kickoff  
10. vea el estado puntuado una vez que el backend haya procesado resultado y scoring, aunque la lógica de scoring en sí pertenezca a una épica posterior.

Además, el sistema debe permitir:

* servir `GET /api/v1/matches`  
* servir `GET /api/v1/matches/:matchId`  
* servir `PUT /api/v1/matches/:matchId/prediction`  
* exponer flags derivados como `isEditable`, `isLocked`, `predictionStatus`  
* persistir predicciones match-level con unicidad lógica por `userId + matchId`  
* impedir escrituras cuando `now >= kickoffAt`.

---

## **3\. Qué entra en esta épica**

### **Incluido**

* catálogo inicial de partidos y equipos para MVP/dev  
* lectura de fixtures autenticados  
* filtros de fixtures por fase y estado  
* detalle de partido  
* visualización de deadline  
* visualización del estado de partido  
* visualización del estado de la predicción del usuario  
* guardado explícito de predicción  
* sobrescritura simple de predicción antes del lock  
* validación de scores  
* validación knockout con empate \+ clasificado  
* persistencia de `predictions`  
* materialización/derivación de estados UX mínimos  
* locking por kickoff desde backend  
* UX de loading, empty, error y save feedback  
* tests unitarios e integración para lectura, guardado y bloqueo

### **No incluido**

* scoring de partidos  
* asignación de puntos  
* recálculo de standings  
* rankings de ligas  
* macro predictions  
* ajuste post grupos  
* reminder engine  
* ads productivos  
* admin completo de resultados  
* ingestión automática productiva desde proveedor externo

Aunque el modelo de datos y el execution model ya contemplan scoring e idempotencia, esta épica solo debe dejar preparado el terreno para eso, no implementarlo completo como flujo de negocio visible.

---

## **4\. Resultado esperado visible**

Al cerrar Epic 2, un reviewer debe poder probar este flujo de punta a punta:

### **Flujo demo**

1. abrir app autenticado  
2. entrar a `/matches`  
3. ver lista de partidos con CTAs contextuales:  
   * `Predecir`  
   * `Editar predicción`  
   * `Bloqueado`  
   * `Ver resultado`  
   * `Ver puntos`  
4. abrir un partido de fase de grupos  
5. guardar score correctamente  
6. volver al listado y ver resumen de su predicción  
7. abrir un partido de knockout  
8. cargar empate en 90’  
9. ver aparecer el selector obligatorio de clasificado  
10. guardar correctamente  
11. forzar o simular llegada a kickoff  
12. volver a abrir el partido  
13. confirmar que inputs y CTA quedaron bloqueados  
14. verificar que el backend rechaza una escritura posterior con `MATCH_LOCKED`.

Ese flujo deja vivo el primer bucle real de uso diario del producto.

---

## **5\. Dependencias documentales**

Esta épica debe obedecer estrictamente:

* el canon del MVP, especialmente:  
  * simplicidad  
  * competencia centrada en ligas  
  * deadlines exactos sin tolerancia  
  * backend como source of truth  
* la estructura oficial del repo y separación por apps/packages  
* las decisiones técnicas oficiales: Next.js, Cloud Run, Firestore, Firebase Auth, pnpm, TypeScript  
* los contratos API ya definidos para `/matches`, `/matches/:matchId` y `/matches/:matchId/prediction`  
* la state matrix oficial para estados derivados de partido y predicción  
* el UX brief de listado de partidos y detalle/predicción  
* el data model canónico para `matches`, `teams` y `predictions`.

---

## **6\. Definición de Done de la épica**

La épica se considera terminada solo si:

* existe endpoint autenticado `GET /api/v1/matches`  
* existe endpoint autenticado `GET /api/v1/matches/:matchId`  
* existe endpoint autenticado `PUT /api/v1/matches/:matchId/prediction`  
* el listado de partidos muestra estado del usuario sin cálculos client-side  
* el detalle de partido muestra deadline, estado y reglas mínimas de scoring  
* el frontend soporta fase de grupos y knockout  
* el selector de clasificado aparece solo cuando corresponde  
* el backend rechaza scores inválidos  
* el backend rechaza knockout draw sin clasificado  
* el backend rechaza escritura luego del kickoff  
* la predicción guardada puede sobrescribirse antes del lock  
* la predicción queda asociada de forma única al par `userId + matchId`  
* el listado refleja `predictionStatus` actualizado luego del guardado  
* existen tests de dominio para validaciones  
* existen tests de integración para endpoints  
* existen tests UI básicos para los estados críticos  
* CI pasa con lint \+ typecheck \+ test.

---

# **7\. Cards de la épica**

Voy a bajarla en cards ejecutables, igual que Epic 1\.

---

# **CARD 1 — Shared Domain Contracts for Matches & Predictions**

## **Objetivo**

Crear en `packages/shared` los tipos, enums, schemas y contratos públicos necesarios para fixtures, match detail y match prediction.

## **Alcance**

* tipos públicos para:  
  * `MatchSummary`  
  * `MatchDetail`  
  * `TeamRef`  
  * `UserMatchPrediction`  
  * `PredictionStatus`  
* enums o unions para:  
  * `stage`  
  * `match status`  
  * `prediction status`  
* schemas de validación request/response  
* constantes de reglas mínimas visibles para frontend  
* errores públicos relevantes:  
  * `MATCH_LOCKED`  
  * `MATCH_NOT_FOUND`  
  * `MATCH_NOT_EDITABLE`  
  * `INVALID_SCORE`  
  * `INVALID_KNOCKOUT_CLASSIFIER`

## **Tareas**

### **Task 1.1**

Definir `TeamRef` público con:

* `teamId`  
* `name`  
* `flagUrl`

### **Task 1.2**

Definir `MatchSummary` público alineado con API:

* `matchId`  
* `stage`  
* `groupId`  
* `homeTeam`  
* `awayTeam`  
* `kickoffAt`  
* `status`  
* `deadlineAt`  
* `isLocked`  
* `predictionStatus`  
* `userPredictionSummary`  
* `isEditable`  
* `ctaLabel`

### **Task 1.3**

Definir `MatchDetail` público alineado con API:

* mismos campos base del summary  
* `requiresQualifierIfDraw`  
* `officialResult`  
* `userPrediction`  
* `scoringRules`

### **Task 1.4**

Definir shape de `PUT /matches/:matchId/prediction`:

* `homeScorePred`  
* `awayScorePred`  
* `predictedQualifierTeamId`

### **Task 1.5**

Definir shape de respuesta de prediction save:

* `predictionId`  
* `matchId`  
* `status`  
* `isEditable`  
* `homeScorePred`  
* `awayScorePred`  
* `predictedQualifierTeamId`  
* `savedAt`

### **Task 1.6**

Definir schemas compartidos para validación en borde.

## **Acceptance Criteria**

* frontend y backend importan los mismos contratos  
* no hay duplicación de tipos entre `apps/web` y `apps/api`  
* todos los payloads de `/matches` y `/prediction` pueden tiparse desde `packages/shared`  
* los errores públicos tienen códigos consistentes con API spec.

---

# **CARD 2 — Base Data Seeding for Teams, Groups & Matches**

## **Objetivo**

Dejar disponible un dataset mínimo y consistente para poder desarrollar fixtures y predicciones sin depender todavía de una ingestión externa real.

## **Alcance**

* seed de equipos  
* seed de grupos  
* seed de partidos  
* mezcla mínima de:  
  * fase de grupos  
  * octavos  
  * cuartos  
  * semifinal  
  * final  
* variantes de estado:  
  * `scheduled`  
  * `live`  
  * `finished`

## **Tareas**

### **Task 2.1**

Crear seed de `teams/{teamId}` con:

* `teamId`  
* `fifaCode`  
* `name`  
* `shortName`  
* `flagUrl`  
* `groupId`  
* `isActive`

### **Task 2.2**

Crear seed de `matches/{matchId}` con shape canónico:

* `matchId`  
* `stage`  
* `homeTeamId`  
* `awayTeamId`  
* `kickoffAt`  
* `status`  
* resultado oficial si aplica  
* `isScored` si aplica

### **Task 2.3**

Asegurar presencia de casos representativos:

* partido abierto de grupos  
* partido abierto de knockout  
* partido bloqueado no puntuado  
* partido finalizado puntuado  
* partido finalizado no puntuado

### **Task 2.4**

Documentar cómo correr seeds localmente.

## **Acceptance Criteria**

* otro developer puede levantar localmente un fixture funcional  
* el entorno de dev tiene partidos suficientes para probar todos los estados visuales principales  
* el seed no crea estructuras incompatibles con el data model canónico.

---

# **CARD 3 — Matches Repository & Query Layer**

## **Objetivo**

Construir la capa backend de lectura de fixtures y detalle de partido, desacoplada de handlers HTTP.

## **Alcance**

* repositorio de matches  
* repositorio de predictions por usuario  
* join server-side de información necesaria para payload UX-ready  
* mapper de dominio a contrato público

## **Tareas**

### **Task 3.1**

Crear `matchesRepository` con métodos mínimos:

* `listMatches(filters)`  
* `getMatchById(matchId)`

### **Task 3.2**

Crear `predictionsRepository` con métodos de lectura:

* `getPredictionByUserAndMatch(userId, matchId)`  
* `listPredictionsByUserForMatches(userId, matchIds)`

### **Task 3.3**

Implementar mapping entre entidades persistidas y payloads API.

### **Task 3.4**

Resolver derivaciones backend para:

* `isLocked`  
* `isEditable`  
* `requiresQualifierIfDraw`  
* `predictionStatus`  
* `userPredictionSummary`  
* `ctaLabel`

### **Task 3.5**

Asegurar que el frontend no tenga que inferir estado desde timestamps crudos.

## **Acceptance Criteria**

* los handlers HTTP solo orquestan y serializan  
* la lógica de derivación de estados vive en capa de dominio/servicio  
* `GET /matches` devuelve filas listas para render  
* `GET /matches/:matchId` devuelve el detalle sin necesitar joins client-side.

---

# **CARD 4 — GET /api/v1/matches**

## **Objetivo**

Implementar el endpoint autenticado de listado de fixtures con estado del usuario.

## **Alcance**

* endpoint REST  
* filtros básicos  
* orden correcto por kickoff  
* cursor simple opcional  
* auth obligatoria

## **Tareas**

### **Task 4.1**

Crear handler `GET /api/v1/matches`.

### **Task 4.2**

Soportar query params definidos:

* `stage=group|R16|QF|SF|FINAL`  
* `filter=all|today|upcoming|pending|scored|finished`  
* `cursor`  
* `limit`

### **Task 4.3**

Ordenar por `kickoffAt` ascendente cuando aplique.

### **Task 4.4**

Para cada fila, devolver:

* datos de equipos  
* fase  
* kickoff  
* deadline  
* estado del partido  
* estado de predicción del usuario  
* resumen corto de su predicción  
* CTA contextual

### **Task 4.5**

Cubrir estados posibles por fila:

* `empty`  
* `saved_editable`  
* `locked_unscored`  
* `scored`  
* `void`

## **Acceptance Criteria**

* el endpoint responde con envelope estándar  
* el payload es suficiente para construir la pantalla de fixtures  
* la tab Partidos puede renderizarse sin lógica oculta  
* la API devuelve `predictionStatus` y `isEditable` ya resueltos.

---

# **CARD 5 — GET /api/v1/matches/:matchId**

## **Objetivo**

Implementar el endpoint autenticado de detalle de partido para pantalla de predicción/resultado.

## **Alcance**

* lectura completa de un partido  
* resolución del estado del usuario  
* resolución de reglas visibles de scoring  
* representación de predicción existente

## **Tareas**

### **Task 5.1**

Crear handler `GET /api/v1/matches/:matchId`.

### **Task 5.2**

Devolver datos base:

* `matchId`  
* `stage`  
* `groupId`  
* equipos  
* `kickoffAt`  
* `status`  
* `deadlineAt`  
* `isLocked`  
* `isEditable`

### **Task 5.3**

Devolver `requiresQualifierIfDraw` según fase del partido.

### **Task 5.4**

Si existe predicción previa, devolver `userPrediction`.

### **Task 5.5**

Si el partido ya fue puntuado, incluir `officialResult` y `pointsAwarded` dentro del detalle de predicción si corresponde.

### **Task 5.6**

Exponer `scoringRules` resumidas para mostrar ayuda contextual.

## **Acceptance Criteria**

* el detalle sirve tanto para editable como para bloqueado como para puntuado  
* el frontend no necesita recalcular reglas knockout  
* el endpoint responde `MATCH_NOT_FOUND` si no existe  
* el payload es suficiente para construir la pantalla completa de detalle/predicción.

---

# **CARD 6 — Prediction Domain Rules**

## **Objetivo**

Implementar las reglas de dominio que determinan cuándo una predicción es válida o inválida.

## **Alcance**

* validación de score  
* validación de knockout  
* validación de editabilidad  
* validación de ownership

## **Tareas**

### **Task 6.1**

Crear función de dominio `validatePredictionInput(match, input)`.

### **Task 6.2**

Aplicar reglas base:

* scores enteros  
* scores `>= 0`  
* no aceptar floats  
* no aceptar strings no parseables  
* no aceptar nulls en score

### **Task 6.3**

Aplicar regla oficial knockout:

* si fase knockout y `homeScorePred === awayScorePred`  
* entonces `predictedQualifierTeamId` es obligatorio

### **Task 6.4**

Si no hay empate predicho en knockout:

* permitir `predictedQualifierTeamId = null`  
* no persistir valor redundante

### **Task 6.5**

Validar que el `predictedQualifierTeamId`, si existe, pertenezca al partido.

### **Task 6.6**

Validar `now < kickoffAt`.

## **Acceptance Criteria**

* la regla de empate en knockout vive en backend, no en frontend  
* un request inválido devuelve error correcto:  
  * `INVALID_SCORE`  
  * `INVALID_KNOCKOUT_CLASSIFIER`  
  * `MATCH_LOCKED`  
* la lógica de validación es testeable en forma unitaria.

---

# **CARD 7 — Prediction Persistence Model**

## **Objetivo**

Persistir predicciones match-level de forma consistente, única e idempotente para el usuario.

## **Alcance**

* colección `predictions`  
* unicidad lógica por usuario y partido  
* sobrescritura simple  
* timestamps correctos  
* flags base

## **Tareas**

### **Task 7.1**

Implementar entidad `predictions/{predictionId}` alineada con modelo.

### **Task 7.2**

Asegurar campos mínimos:

* `predictionId`  
* `userId`  
* `matchId`  
* `homeScorePred`  
* `awayScorePred`  
* `predictedQualifierTeamId`  
* `isLocked`  
* `pointsAwarded`  
* `isScored`  
* `createdAt`  
* `updatedAt`

### **Task 7.3**

Implementar estrategia de unicidad lógica por `userId + matchId`.

Recomendación:

* lookup por índice lógico `(userId, matchId)`  
* si existe, update  
* si no existe, create

### **Task 7.4**

No exponer endpoint delete en MVP.

### **Task 7.5**

Persistir `predictedQualifierTeamId = null` cuando no corresponda.

## **Acceptance Criteria**

* un usuario nunca termina con dos predictions para el mismo partido  
* editar antes del lock sobrescribe la anterior  
* la estructura persistida respeta el data model acordado  
* queda lista para ser usada luego por scoring y puntos.

---

# **CARD 8 — PUT /api/v1/matches/:matchId/prediction**

## **Objetivo**

Implementar el endpoint de creación/sobrescritura de predicción match-level.

## **Alcance**

* un solo endpoint de escritura  
* comportamiento idempotente de cara al usuario  
* rechazo si el partido está bloqueado

## **Tareas**

### **Task 8.1**

Crear handler `PUT /api/v1/matches/:matchId/prediction`.

### **Task 8.2**

Resolver flujo:

1. autenticar usuario  
2. buscar partido  
3. verificar editabilidad  
4. validar payload  
5. upsert prediction  
6. devolver estado resultante

### **Task 8.3**

Alinear requests soportados:

#### **Fase de grupos**

* `homeScorePred`  
* `awayScorePred`

#### **Knockout con ganador en 90**

* score \+ `predictedQualifierTeamId = null`

#### **Knockout con empate**

* score \+ `predictedQualifierTeamId` obligatorio

### **Task 8.4**

Devolver response pública alineada con API spec.

### **Task 8.5**

Mapear errores de dominio a envelope estándar.

## **Acceptance Criteria**

* guardar predicción requiere un único request  
* el frontend no debe hacer read-write-read para cerrar el flujo básico  
* si el partido está bloqueado, devuelve `MATCH_LOCKED`  
* si el payload es inválido, devuelve el código correcto  
* si el guardado es exitoso, devuelve estado `saved_editable` mientras siga abierto.

---

# **CARD 9 — Match Locking Rules & Derived States**

## **Objetivo**

Consolidar la lógica de locking por kickoff y la resolución determinística de estados funcionales de partido y predicción.

## **Alcance**

* derivación de estados  
* sincronía entre partido y predicción  
* preparación para lock enforcement job

## **Tareas**

### **Task 9.1**

Implementar helpers de dominio para `match state`:

* `EDITABLE`  
* `LOCKED_PENDING`  
* `LIVE_LOCKED`  
* `FINISHED_PENDING_SCORING`  
* `SCORED`

### **Task 9.2**

Implementar helpers de dominio para prediction state:

* `draft`  
* `locked`  
* `scored`

### **Task 9.3**

Derivar desde backend:

* `isEditable`  
* `isLocked`  
* `isFinished`  
* `isScored`

### **Task 9.4**

Asegurar consistencia:

* si `isLocked = true`, la API nunca acepta escritura  
* si `status = scored`, `pointsAwarded` no puede ser null

### **Task 9.5**

Alinear nomenclatura derivada que consume frontend con la state matrix.

## **Acceptance Criteria**

* los estados son exhaustivos y consistentes  
* el frontend no infiere estado a partir de timestamps y heurísticas  
* cualquier partido cae en un estado funcional definido  
* la lógica es reutilizable luego por home, scoring y puntos.

---

# **CARD 10 — Optional Lock Enforcement Job (MVP Hardening)**

## **Objetivo**

Agregar endurecimiento operativo para asegurar que los partidos y predicciones queden correctamente lockeados por kickoff incluso si no hubo tráfico del usuario.

## **Alcance**

* job scheduler simple  
* barrido periódico  
* actualización de locks persistidos cuando haga falta

## **Tareas**

### **Task 10.1**

Crear job mínimo de lock enforcement, alineado con backend execution model.

### **Task 10.2**

Cada minuto, buscar partidos donde:

* `now >= kickoffAt`  
* `status = scheduled`

### **Task 10.3**

Actualizar estado del partido según estrategia definida.

### **Task 10.4**

Asegurar que predicciones asociadas queden con `isLocked = true` si se persiste ese flag.

### **Task 10.5**

Registrar logs mínimos operativos.

## **Acceptance Criteria**

* aunque un partido no sea reconsultado por frontend, queda lockeado al llegar kickoff  
* el sistema no depende solo de controles en request-time  
* el job puede re-ejecutarse sin corromper datos.

---

# **CARD 11 — Fixtures Screen UI**

## **Objetivo**

Construir la pantalla de listado de partidos mobile-first, utilitaria y rápida de escanear.

## **Alcance**

* screen `/matches`  
* filtros/chips  
* cards reutilizables  
* estados loading/empty/error

## **Tareas**

### **Task 11.1**

Crear pantalla Partidos con:

* top bar  
* título “Partidos”  
* filtros horizontales/chips  
* lista vertical de cards

### **Task 11.2**

Implementar filtros sugeridos:

* Todos  
* Hoy  
* Próximos  
* Grupos  
* Octavos  
* Cuartos  
* Semis  
* Final

### **Task 11.3**

Construir `MatchCard` reutilizable con contenido mínimo:

* flags  
* nombres equipos  
* fecha/hora local  
* fase  
* estado del partido  
* estado de predicción del usuario  
* CTA contextual

### **Task 11.4**

Mostrar deadline visible para partidos abiertos.

### **Task 11.5**

Mostrar resumen de predicción del usuario cuando exista.

### **Task 11.6**

Distinguir visualmente:

* abierto  
* bloqueado  
* live  
* finalizado  
* puntuado

## **Acceptance Criteria**

* la pantalla permite detectar rápidamente qué hacer con cada partido  
* el CTA correcto depende del payload API, no de lógica client-side inventada  
* la experiencia funciona bien en mobile con scroll vertical simple  
* hay empty state claro cuando el filtro no devuelve partidos.

---

# **CARD 12 — Match Detail & Prediction Screen UI**

## **Objetivo**

Construir la pantalla de detalle/predicción de partido minimizando taps y ambigüedad.

## **Alcance**

* screen detalle  
* inputs score  
* selector condicional de clasificado  
* feedback de guardado  
* estado bloqueado  
* estado puntuado

## **Tareas**

### **Task 12.1**

Crear header con:

* back  
* fase  
* fecha/hora local

### **Task 12.2**

Crear bloque principal de inputs:

* equipo local \+ flag  
* input score local  
* separador  
* input score visitante  
* equipo visitante \+ flag

### **Task 12.3**

Crear bloque contextual con:

* deadline exacto  
* estado del partido  
* ayuda corta de scoring

### **Task 12.4**

En fase de grupos, mostrar solo dos inputs numéricos.

### **Task 12.5**

En knockout:

* mostrar dos inputs de 90’  
* si hay empate predicho, desplegar selector:  
  * “¿Quién clasifica?”

### **Task 12.6**

Agregar CTA primario:

* `Guardar predicción`

### **Task 12.7**

Agregar mensajes inline:

* “Puedes editar hasta el inicio del partido.”  
* “Si predices empate, debes elegir quién clasifica.”

### **Task 12.8**

Agregar toast de éxito:

* “Predicción guardada.”

### **Task 12.9**

Estado bloqueado:

* inputs deshabilitados  
* copy: “Este partido ya está bloqueado.”

### **Task 12.10**

Estado puntuado:

* mostrar predicción del usuario  
* mostrar resultado oficial  
* mostrar puntos obtenidos  
* mostrar breve breakdown si existe

## **Acceptance Criteria**

* un usuario puede ingresar una predicción en pocos taps  
* el selector de clasificado aparece solo cuando corresponde  
* no hay autoguardado silencioso en MVP  
* el guardado es explícito y con feedback visible  
* el estado bloqueado y puntuado se entienden sin duda.

---

# **CARD 13 — UX Error Handling & Save Resilience**

## **Objetivo**

Asegurar que el flujo de guardado no falle en silencio y que los errores tengan traducción UX accionable.

## **Alcance**

* toasts  
* banners inline  
* retry simple  
* mapeo de errores API a microcopy UX

## **Tareas**

### **Task 13.1**

Mapear errores de API a mensajes UX:

* `MATCH_LOCKED` → “Este partido ya está bloqueado.”  
* `INVALID_SCORE` → “Introduce un marcador válido.”  
* `INVALID_KNOCKOUT_CLASSIFIER` → “Si predices empate, debes elegir quién clasifica.”  
* `INTERNAL_ERROR` → “No pudimos guardar tu predicción. Inténtalo otra vez.”

### **Task 13.2**

Evitar pérdida silenciosa de inputs ante fallo de red.

### **Task 13.3**

Mantener valores del formulario si el request falla.

### **Task 13.4**

Mostrar loading state del botón de guardado.

### **Task 13.5**

Deshabilitar doble submit mientras el request está en vuelo.

## **Acceptance Criteria**

* ningún error importante queda invisible  
* el usuario entiende por qué no pudo guardar  
* un fallo transitorio no borra la predicción escrita en pantalla  
* el flujo se siente robusto en conectividad débil.

---

# **CARD 14 — Tests for Match Read, Validation & Save**

## **Objetivo**

Cubrir con tests la lógica crítica de esta épica.

## **Alcance**

* tests unitarios  
* tests de integración API  
* tests UI mínimos

## **Tareas**

### **Task 14.1**

Tests unitarios de dominio para:

* `isEditable`  
* `isLocked`  
* validación score  
* validación knockout draw rule  
* derivación de `predictionStatus`

### **Task 14.2**

Tests de integración para:

* `GET /matches`  
* `GET /matches/:matchId`  
* `PUT /matches/:matchId/prediction`  
* rechazo por `MATCH_LOCKED`  
* rechazo por `INVALID_KNOCKOUT_CLASSIFIER`

### **Task 14.3**

Tests UI mínimos para:

* listado de partidos  
* render de CTA contextual  
* aparición del selector de clasificado  
* toast de guardado  
* estado bloqueado

### **Task 14.4**

Agregar fixtures/mock data reutilizables.

## **Acceptance Criteria**

* las reglas críticas quedan cubiertas por tests  
* se detecta rápidamente cualquier regresión en locking o validación  
* CI puede fallar si se rompe el core de predicción.

---

# **8\. Orden recomendado de implementación**

Para Codex, el orden correcto de ejecución no es el orden visual sino este:

## **Fase A — Contratos y base de datos**

1. Card 1 — Shared Domain Contracts  
2. Card 2 — Base Data Seeding  
3. Card 3 — Matches Repository & Query Layer

## **Fase B — Lectura core**

4. Card 4 — GET /matches  
5. Card 5 — GET /matches/:matchId

## **Fase C — Escritura core**

6. Card 6 — Prediction Domain Rules  
7. Card 7 — Prediction Persistence Model  
8. Card 8 — PUT /matches/:matchId/prediction

## **Fase D — Estados y endurecimiento**

9. Card 9 — Match Locking Rules & Derived States  
10. Card 10 — Optional Lock Enforcement Job

## **Fase E — Producto visible**

11. Card 11 — Fixtures Screen UI  
12. Card 12 — Match Detail & Prediction Screen UI  
13. Card 13 — UX Error Handling

## **Fase F — Calidad**

14. Card 14 — Tests

Esto sigue además la secuencia recomendada del API spec: primero lecturas core, luego escrituras core, luego módulos siguientes.

---

# **9\. Riesgos principales de la épica**

## **Riesgo 1**

Implementar lógica de editabilidad en frontend y no en backend.

### **Mitigación**

Forzar que la API devuelva `isEditable`, `isLocked`, `predictionStatus` y `ctaLabel` ya resueltos.

---

## **Riesgo 2**

Romper la regla knockout al permitir empate sin clasificado.

### **Mitigación**

Validación obligatoria en backend y cobertura de tests unitarios e integración.

---

## **Riesgo 3**

Generar múltiples predicciones del mismo usuario para el mismo partido.

### **Mitigación**

Upsert sobre unicidad lógica `userId + matchId`.

---

## **Riesgo 4**

Timezone bugs en deadline/kickoff.

### **Mitigación**

Persistir UTC, derivar lock server-side y usar frontend solo para display local.

---

## **Riesgo 5**

Experiencia de guardado frágil con conectividad débil.

### **Mitigación**

No autoguardar, mantener inputs en pantalla si falla, loading explícito y retry simple.

---

# **10\. QA Checklist de la épica**

Antes de cerrar Epic 2, validar:

* `/api/v1/matches` responde autenticado  
* `/api/v1/matches/:matchId` responde autenticado  
* el listado muestra `Predecir` cuando no hay prediction y el partido está abierto  
* el listado muestra `Editar predicción` cuando existe prediction editable  
* el listado muestra `Bloqueado` cuando corresponde  
* el listado muestra `Ver resultado` o `Ver puntos` en estados cerrados/puntuados  
* detalle de grupos permite guardar score simple  
* detalle knockout exige clasificado si hay empate  
* detalle knockout no exige clasificado si no hay empate  
* guardado exitoso devuelve estado correcto  
* re-edición antes del kickoff sobrescribe correctamente  
* escritura después del kickoff falla con `MATCH_LOCKED`  
* el frontend refleja estado bloqueado al recargar  
* errores de validación muestran mensajes claros  
* tests mínimos pasan  
* build del monorepo pasa.

---

# **11\. Entregables concretos de la épica**

Al terminar la épica deben existir, como mínimo:

## **Backend**

* repositorio de matches  
* repositorio de predictions  
* endpoint `GET /matches`  
* endpoint `GET /matches/:matchId`  
* endpoint `PUT /matches/:matchId/prediction`  
* validadores de dominio  
* lógica de estados derivados  
* seed mínimo de torneo/dev

## **Frontend**

* pantalla Partidos  
* card reutilizable de partido  
* pantalla Detalle/Predicción  
* form de score  
* selector condicional de clasificado  
* feedback visual de guardado  
* estados loading/error/empty/bloqueado/puntuado

## **Shared**

* tipos y schemas públicos para matches/predictions  
* catálogo de errores públicos de este módulo

## **Testing**

* tests unitarios de dominio  
* tests integración API  
* tests UI mínimos

## **Ops**

* script seed/dev  
* README actualizado para probar fixtures y predicciones

---

# **12\. Handoff para la Epic 3**

Epic 2 deja listo el terreno para que la siguiente épica sea:

## **EPIC 3 — Macro Picks & Post-Group Adjustment**

Porque una vez que existe el patrón completo de:

* lectura de estado  
* escritura validada  
* locking por deadline  
* contratos compartidos  
* UX de guardado explícito

ya se puede construir con mucha menos ambigüedad:

* picks de grupos A-H  
* finalistas  
* campeón  
* draft parcial  
* lock del torneo  
* ventana de ajuste post grupos  
* warning de penalización  
* confirmación irreversible.