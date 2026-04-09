# **EPIC 5 — Macro Picks & Post-Group Adjustment**

## **1\. Propósito de la épica**

Esta épica construye el segundo gran bucle jugable del MVP: las **predicciones macro del torneo**.

Su objetivo es dejar implementado, de punta a punta:

* carga de picks macro iniciales  
* edición libre antes del kickoff del torneo  
* bloqueo estricto al kickoff exacto del torneo  
* habilitación condicional de la ventana de ajuste post grupos  
* confirmación irreversible del ajuste  
* penalización automática del ajuste  
* estados UX claros y consistentes  
* persistencia correcta en backend  
* contratos compartidos listos para reutilización por scoring macro, home y puntos

Esta épica debe materializar exactamente lo ya cerrado en el canon y en la API:

* picks iniciales:  
  * **1° y 2° por grupo**  
  * **2 finalistas**  
  * **1 campeón**  
* ajuste:  
  * **solo una vez**  
  * **solo si hubo picks iniciales**  
  * **solo cambia finalistas y campeón**  
  * **no toca picks de grupos**  
  * **es irreversible**  
  * **aplica penalización automática**.

---

## **2\. Objetivos funcionales de la épica**

Al finalizar esta épica, el sistema debe permitir que un usuario autenticado:

1. entre a la tab o pantalla de **Macro Picks**  
2. vea el estado actual de sus picks macro  
3. complete los picks por grupos A-H:  
   * 1° de grupo  
   * 2° de grupo  
4. seleccione:  
   * 2 finalistas  
   * 1 campeón  
5. guarde sus picks macro con feedback explícito  
6. vuelva a editarlos libremente mientras siga abierta la ventana inicial  
7. vea el módulo bloqueado automáticamente al kickoff exacto del torneo  
8. vea, una vez cerrada la fase de grupos, si tiene o no ajuste disponible  
9. si tiene ajuste disponible:  
   * abra la pantalla de ajuste  
   * cambie **solo** finalistas y campeón  
   * vea warning claro de penalización  
   * confirme una única vez  
10. después de confirmar, vea el ajuste como final, irreversible y bloqueado

Además, el sistema debe permitir:

* servir `GET /api/v1/macro-picks`  
* servir `PUT /api/v1/macro-picks`  
* servir `POST /api/v1/macro-picks/adjustment`  
* devolver flags ya resueltos como:  
  * `isLocked`  
  * `adjustmentAvailable`  
  * `adjustmentAlreadyUsed`  
  * `status`  
  * `completion`  
* persistir una única entidad `macroPredictions/{userId}`  
* impedir escrituras cuando la ventana correspondiente ya cerró  
* impedir ajuste si el usuario no tuvo picks iniciales  
* impedir segundo ajuste.

---

## **3\. Qué entra en esta épica**

### **Incluido**

* lectura autenticada de macro picks  
* creación inicial de macro picks  
* sobrescritura simple antes del cierre inicial  
* validación de picks por grupo  
* validación de finalistas  
* validación de campeón  
* cálculo de completion  
* deadline visible  
* bloqueo inicial por kickoff del torneo  
* derivación server-side del estado del módulo  
* habilitación condicional de ajuste post grupos  
* pantalla/flujo de ajuste  
* validación de ajuste  
* persistencia de `isAdjusted`, `adjustedAt`, `adjustedFinalists`, `adjustedChampion`  
* exposición del modelo de penalización en respuesta de ajuste  
* UX de loading, empty, draft, locked, adjustment available, adjusted locked  
* tests unitarios e integración para reglas de validación, locking y ajuste  
* hardening opcional con job que active ventana de ajuste y/o cierre por hitos del torneo

### **No incluido**

* scoring macro completo  
* asignación real de puntos macro  
* recalculo de standings por efecto del macro scoring  
* explicación de puntos macro ganados  
* notificaciones  
* badges  
* ranking global  
* predicciones avanzadas fuera de canon  
* reseeding estructural del torneo  
* admin complejo de bracket

Esta épica deja el módulo **jugable y correctamente persistido**, pero no resuelve todavía el **scoring macro full**. Eso queda para la siguiente pieza de backend batch/event-driven. Esto además es consistente con que Epic 3 dejó `macroPoints` como placeholder y explicitó que el scoring macro podía quedar stub-ready.

---

## **4\. Resultado esperado visible**

Al cerrar Epic 5, un reviewer debe poder probar este flujo de punta a punta:

### **Flujo demo A — Picks iniciales**

1. abrir app autenticado  
2. entrar a `/macro-picks`  
3. ver empty state o draft  
4. completar grupos A-H  
5. elegir finalistas  
6. elegir campeón  
7. guardar  
8. ver feedback de guardado exitoso  
9. recargar  
10. confirmar que el backend devuelve el mismo estado persistido

### **Flujo demo B — Edición antes del cierre**

1. abrir nuevamente `/macro-picks`  
2. modificar picks iniciales  
3. guardar otra vez  
4. confirmar que sobrescribe correctamente  
5. verificar que sigue `submitted_editable` mientras no llegó el kickoff

### **Flujo demo C — Lock del módulo inicial**

1. simular llegada al kickoff exacto del torneo  
2. abrir `/macro-picks`  
3. ver estado `locked_original`  
4. confirmar que el frontend muestra el módulo bloqueado  
5. intentar escribir por API  
6. recibir `MACRO_PICKS_LOCKED`

### **Flujo demo D — Ajuste disponible**

1. cerrar fase de grupos en backend  
2. abrir `/macro-picks`  
3. ver `adjustmentAvailable = true`  
4. confirmar que los picks de grupos se muestran read-only  
5. modificar solo finalistas y campeón  
6. ver warning explícito de penalización reducida  
7. confirmar ajuste  
8. recibir `adjusted_locked`  
9. recargar  
10. verificar que ya no hay segunda oportunidad

### **Flujo demo E — Reglas protegidas**

1. intentar ajustar sin picks iniciales  
2. recibir `ADJUSTMENT_NOT_AVAILABLE`  
3. intentar ajustar dos veces  
4. recibir `ADJUSTMENT_ALREADY_USED`  
5. intentar mandar finalistas duplicados  
6. recibir `INVALID_FINALISTS_DUPLICATE`  
7. intentar mandar campeón fuera de finalistas  
8. recibir `INVALID_CHAMPION_NOT_IN_FINALISTS`.

---

## **5\. Dependencias documentales**

Esta épica debe obedecer estrictamente:

* **MVP CANON**  
  * sin ranking global  
  * macro \= 1° y 2° por grupo \+ finalistas \+ campeón  
  * ajuste post grupos una sola vez  
  * solo si hubo picks iniciales  
  * con penalización automática  
  * deadlines exactos sin tolerancia  
  * backend como source of truth.  
* **API Specification**  
  * `GET /api/v1/macro-picks`  
  * `PUT /api/v1/macro-picks`  
  * `POST /api/v1/macro-picks/adjustment`  
  * envelope estándar  
  * errores públicos  
  * payloads camelCase.  
* **DATA MODEL**  
  * entidad `macroPredictions/{userId}`  
  * campos de ajuste  
  * constraints de picks macro  
  * una sola macroPrediction por usuario  
  * edición solo dentro de ventana válida.  
* **TECH DECISIONS**  
  * Firestore  
  * Cloud Run  
  * Firebase Auth  
  * Jobs separados de API  
  * read models simples  
  * idempotencia obligatoria.  
* **continuidad con Epic 2**  
  * mismo patrón de escritura explícita  
  * mismo patrón de bloqueo estricto por deadline  
  * mismos principios de estados derivados server-side.

---

## **6\. Definición de Done de la épica**

La épica se considera terminada solo si:

* existe endpoint autenticado `GET /api/v1/macro-picks`  
* existe endpoint autenticado `PUT /api/v1/macro-picks`  
* existe endpoint autenticado `POST /api/v1/macro-picks/adjustment`  
* `GET /macro-picks` devuelve estado UX-ready sin cálculos client-side  
* el frontend permite completar los 8 grupos  
* el frontend permite elegir 2 finalistas  
* el frontend permite elegir 1 campeón  
* el backend rechaza duplicados 1°/2° dentro del mismo grupo  
* el backend rechaza finalistas duplicados  
* el backend rechaza campeón fuera de finalistas  
* el guardado inicial sobrescribe correctamente antes del cierre  
* el backend rechaza guardado inicial tras kickoff con `MACRO_PICKS_LOCKED`  
* el backend solo habilita ajuste si hubo picks iniciales antes del cierre  
* el ajuste solo permite cambiar finalistas y campeón  
* el ajuste no toca `groupPicks`  
* el ajuste es irreversible  
* el backend rechaza segundo ajuste con `ADJUSTMENT_ALREADY_USED`  
* la UI muestra warning claro de penalización antes de confirmar ajuste  
* la respuesta del ajuste devuelve `penaltyModel`  
* existen tests unitarios de dominio  
* existen tests de integración API  
* existen tests UI mínimos  
* CI pasa con lint \+ typecheck \+ test.

---

# **7\. Cards de la épica**

---

## **CARD 1 — Shared Domain Contracts for Macro Picks & Adjustment**

### **Objetivo**

Crear en `packages/shared` los tipos, enums, schemas y errores públicos del dominio `macro-picks`.

### **Alcance**

* tipos públicos para:  
  * `MacroPicksState`  
  * `GroupPick`  
  * `MacroPicksCompletion`  
  * `MacroPicksResponse`  
  * `SaveMacroPicksRequest`  
  * `SaveMacroPicksResponse`  
  * `ConfirmMacroAdjustmentRequest`  
  * `ConfirmMacroAdjustmentResponse`  
  * `AdjustmentWindow`  
  * `PenaltyModel`  
* errores públicos:  
  * `MACRO_PICKS_LOCKED`  
  * `ADJUSTMENT_NOT_AVAILABLE`  
  * `ADJUSTMENT_ALREADY_USED`  
  * `INVALID_GROUP_PICK_DUPLICATE`  
  * `INVALID_FINALISTS_DUPLICATE`  
  * `INVALID_CHAMPION_NOT_IN_FINALISTS`  
  * `VALIDATION_ERROR`

### **Tareas**

#### **Task 1.1**

Definir `MacroPicksStatus` como union exacta alineada con API:

* `not_started`  
* `draft_editable`  
* `submitted_editable`  
* `locked_original`  
* `adjustment_available`  
* `adjusted_locked`  
* `fully_scored`

#### **Task 1.2**

Definir `GroupPick`:

type GroupPick \= {  
  firstTeamId: string  
  secondTeamId: string  
}

#### **Task 1.3**

Definir `MacroPicksCompletion`:

type MacroPicksCompletion \= {  
  groupsCompleted: number  
  groupsTotal: number  
  hasFinalists: boolean  
  hasChampion: boolean  
  percent: number  
}

#### **Task 1.4**

Definir `AdjustmentWindow`:

type AdjustmentWindow \= {  
  opensAt: string | null  
  closesAt: string | null  
}

#### **Task 1.5**

Definir `PenaltyModel`:

type PenaltyModel \= {  
  finalistPoints: number  
  championPoints: number  
}

#### **Task 1.6**

Definir `MacroPicksResponse` alineado con `GET /api/v1/macro-picks`:

type MacroPicksResponse \= {  
  status: MacroPicksStatus  
  isLocked: boolean  
  adjustmentAvailable: boolean  
  adjustmentAlreadyUsed: boolean  
  initialDeadlineAt: string  
  adjustmentWindow: AdjustmentWindow  
  groupPicks: Record\<string, GroupPick\>  
  finalists: \[string, string\] | null  
  champion: string | null  
  completion: MacroPicksCompletion  
}

#### **Task 1.7**

Definir `SaveMacroPicksRequest`:

type SaveMacroPicksRequest \= {  
  groupPicks: Record\<string, GroupPick\>  
  finalists: \[string, string\]  
  champion: string  
}

#### **Task 1.8**

Definir `ConfirmMacroAdjustmentRequest`:

type ConfirmMacroAdjustmentRequest \= {  
  finalists: \[string, string\]  
  champion: string  
}

#### **Task 1.9**

Definir `ConfirmMacroAdjustmentResponse` alineado con API:

type ConfirmMacroAdjustmentResponse \= {  
  status: "adjusted\_locked"  
  adjustmentConfirmedAt: string  
  adjustedFinalists: \[string, string\]  
  adjustedChampion: string  
  penaltyModel: PenaltyModel  
}

#### **Task 1.10**

Crear schemas compartidos de validación para requests/responses y exportarlos desde `packages/shared`.

### **Acceptance Criteria**

* frontend y backend consumen el mismo contrato  
* no hay duplicación de tipos entre `apps/web` y `apps/api`  
* todos los payloads de `/macro-picks` y `/macro-picks/adjustment` se tipan desde `packages/shared`  
* los errores públicos coinciden con API spec.

---

## **CARD 2 — Groups & Teams Read Layer for Macro Module**

### **Objetivo**

Construir la capa de lectura de grupos y equipos necesaria para renderizar correctamente el formulario de macro picks.

### **Alcance**

* lectura de `groups`  
* lectura de `teams`  
* payload server-ready para UI  
* orden estable A-H  
* validación de integridad del torneo

### **Tareas**

#### **Task 2.1**

Crear `groupsRepository` con métodos:

* `listGroupsOrdered()`  
* `getGroupById(groupId)`

#### **Task 2.2**

Crear `teamsRepository` con métodos:

* `listTeamsByGroupIds(groupIds)`  
* `getTeamsMap(teamIds)`

#### **Task 2.3**

Crear mapper UI-ready para cada grupo:

type MacroGroupOptionSet \= {  
  groupId: string  
  label: string  
  teams: Array\<{  
    teamId: string  
    name: string  
    shortName: string  
    flagUrl: string | null  
  }\>  
}

#### **Task 2.4**

Asegurar que cada grupo tenga exactamente 4 equipos activos para entorno dev/test, o falle de manera explícita si el dataset es inconsistente.

#### **Task 2.5**

Exportar helper para construir el catálogo de grupos del módulo sin lógica en frontend.

### **Acceptance Criteria**

* la UI no hardcodea grupos ni equipos  
* el orden de grupos es estable  
* la API o capa server-side entrega datos suficientes para renderizar selects/cards  
* la lectura es compatible con `groups/{groupId}` y `teams/{teamId}` del modelo canónico.

---

## **CARD 3 — MacroPredictions Repository & Persistence Model**

### **Objetivo**

Implementar la persistencia del dominio `macroPredictions` respetando la shape canónica del modelo de datos.

### **Alcance**

* repositorio de `macroPredictions/{userId}`  
* create/upsert inicial  
* update de ajuste  
* lectura única por user  
* timestamps y flags consistentes

### **Tareas**

#### **Task 3.1**

Crear `macroPredictionsRepository` con métodos mínimos:

* `getByUserId(userId)`  
* `upsertInitial(userId, payload)`  
* `confirmAdjustment(userId, payload)`  
* `markLocked(userId, lockedAt)`  
* `markAdjustmentAvailability(...)` solo si se decide persistir algo auxiliar; preferir derivación si no hace falta persistencia

#### **Task 3.2**

Persistir shape canónica mínima:

{  
  userId,  
  groupPicks,  
  finalists,  
  champion,  
  isLocked,  
  isSubmitted,  
  isAdjusted,  
  adjustedAt,  
  adjustedFinalists,  
  adjustedChampion,  
  createdAt,  
  updatedAt,  
  lockedAt  
}

#### **Task 3.3**

Asegurar comportamiento:

* primer guardado crea documento  
* guardados siguientes antes del cierre sobrescriben documento  
* ajuste actualiza solo campos de ajuste  
* no muta `groupPicks` en ajuste

#### **Task 3.4**

Asegurar que Firestore use `userId` como key del documento.

#### **Task 3.5**

Agregar mappers entre entidad Firestore y contratos públicos.

### **Acceptance Criteria**

* existe una sola macroPrediction por usuario  
* guardado inicial y ajuste no generan duplicados  
* la entidad coincide con el data model canónico  
* timestamps y flags quedan consistentes.

---

## **CARD 4 — Macro Validation Domain Rules**

### **Objetivo**

Implementar las reglas puras de validación del dominio macro.

### **Alcance**

* validación de picks por grupo  
* validación de finalistas  
* validación de campeón  
* validación de completitud  
* validación específica del ajuste

### **Tareas**

#### **Task 4.1**

Implementar `validateGroupPick(groupId, pick, groupTeamIds)`.

Reglas:

* `firstTeamId` obligatorio  
* `secondTeamId` obligatorio  
* ambos deben pertenecer al grupo  
* no pueden ser iguales

#### **Task 4.2**

Implementar `validateAllGroupPicks(groupPicks, groupsCatalog)`.

Reglas:

* deben existir los 8 grupos esperados para submit completo  
* no se aceptan groupIds desconocidos  
* no se aceptan equipos fuera del grupo correspondiente

#### **Task 4.3**

Implementar `validateFinalists(finalists)`.

Reglas:

* array de longitud 2  
* ambos distintos

#### **Task 4.4**

Implementar `validateChampion(champion, finalists)`.

Regla:

* champion debe pertenecer a finalists

#### **Task 4.5**

Implementar `validateAdjustmentPayload(adjustmentPayload)`.

Reglas:

* solo acepta `finalists` y `champion`  
* no acepta `groupPicks`  
* finalistas distintos  
* champion dentro de finalists

#### **Task 4.6**

Normalizar errores del dominio a códigos públicos del API spec.

### **Acceptance Criteria**

* todas las reglas están encapsuladas en funciones puras  
* los errores son determinísticos  
* no hay validaciones críticas escondidas en UI  
* la lógica es reusable por API, jobs y tests.

---

## **CARD 5 — Macro State Machine & Derived Flags**

### **Objetivo**

Resolver en backend el estado funcional del módulo macro y todas las banderas derivadas que consume frontend.

### **Alcance**

* derivación de `status`  
* derivación de `isLocked`  
* derivación de `adjustmentAvailable`  
* derivación de `adjustmentAlreadyUsed`  
* derivación de `completion`

### **Tareas**

#### **Task 5.1**

Implementar helper puro `resolveMacroStatus(...)`.

Debe contemplar al menos:

* ausencia de documento → `not_started`  
* draft parcial editable → `draft_editable`  
* submitted completo editable antes del kickoff → `submitted_editable`  
* picks iniciales cerrados, sin ajuste disponible aún → `locked_original`  
* ajuste disponible → `adjustment_available`  
* ajuste confirmado → `adjusted_locked`  
* scoring macro final aplicado → `fully_scored` si luego otra épica lo necesitara

#### **Task 5.2**

Implementar helper `computeMacroCompletion(...)`.

Reglas:

* `groupsCompleted` \= cantidad de grupos con 1° y 2° válidos  
* `groupsTotal` \= 8  
* `hasFinalists`  
* `hasChampion`  
* `percent` consistente y estable

#### **Task 5.3**

Implementar helper `isInitialMacroWindowOpen(now, tournamentKickoffAt)`.

Regla:

* editable solo si `now < tournamentKickoffAt`

#### **Task 5.4**

Implementar helper `isAdjustmentWindowOpen(now, firstR16KickoffAt, allGroupsClosed)`.

Regla:

* adjustment disponible solo si:  
  * hubo picks iniciales válidos antes del cierre  
  * la fase de grupos ya cerró  
  * `now < firstR16KickoffAt`  
  * no fue usado antes

#### **Task 5.5**

Definir una única fuente de derivación para que la API no emita flags inconsistentes.

### **Acceptance Criteria**

* cualquier usuario cae en un estado macro exhaustivo y consistente  
* frontend no infiere estado con timestamps ni heurísticas  
* `adjustmentAvailable` nunca contradice `status`  
* el sistema responde exactamente con la lógica binding del MVP.

---

## **CARD 6 — GET /api/v1/macro-picks**

### **Objetivo**

Exponer lectura autenticada del estado macro del usuario con payload listo para pantalla.

### **Alcance**

* endpoint autenticado  
* lectura de `macroPredictions`  
* derivación de flags  
* envelope estándar

### **Tareas**

#### **Task 6.1**

Crear route/controller `GET /api/v1/macro-picks`.

#### **Task 6.2**

Resolver:

* user autenticado  
* groups catalog  
* macroPrediction actual  
* deadline inicial  
* ventana de ajuste

#### **Task 6.3**

Mapear response alineado con API spec:

* `status`  
* `isLocked`  
* `adjustmentAvailable`  
* `adjustmentAlreadyUsed`  
* `initialDeadlineAt`  
* `adjustmentWindow`  
* `groupPicks`  
* `finalists`  
* `champion`  
* `completion`

#### **Task 6.4**

Si no existe documento, devolver `not_started` con payload vacío útil para UI, no error.

### **Acceptance Criteria**

* el frontend puede construir toda la pantalla con un único request  
* la respuesta es estable y no ambigua  
* envelope estándar respetado  
* auth requerida.

---

## **CARD 7 — PUT /api/v1/macro-picks**

### **Objetivo**

Crear o sobrescribir picks macro iniciales antes del cierre del torneo.

### **Alcance**

* endpoint autenticado  
* validación de payload  
* lock estricto por kickoff  
* upsert seguro

### **Tareas**

#### **Task 7.1**

Crear route/controller `PUT /api/v1/macro-picks`.

#### **Task 7.2**

Validar payload completo:

* `groupPicks`  
* `finalists`  
* `champion`

#### **Task 7.3**

Resolver deadline:

* si `now >= tournamentKickoffAt` → `MACRO_PICKS_LOCKED`

#### **Task 7.4**

Persistir mediante `upsertInitial`.

#### **Task 7.5**

Devolver response alineada con API:

* `status`  
* `savedAt`  
* `completionPercent`

#### **Task 7.6**

Asegurar idempotencia razonable ante retry de red con mismo payload.

### **Acceptance Criteria**

* un único request basta para guardar  
* un segundo save antes del cierre sobrescribe  
* un save después del cierre falla  
* no existe endpoint delete  
* la lógica crítica vive en backend.

---

## **CARD 8 — POST /api/v1/macro-picks/adjustment**

### **Objetivo**

Confirmar el ajuste post grupos de forma única e irreversible.

### **Alcance**

* endpoint autenticado  
* validación específica del ajuste  
* elegibilidad del ajuste  
* penalización automática expuesta  
* persistencia de confirmación

### **Tareas**

#### **Task 8.1**

Crear route/controller `POST /api/v1/macro-picks/adjustment`.

#### **Task 8.2**

Validar precondiciones:

* existe macroPrediction previa  
* `isSubmitted = true`  
* ventana de ajuste abierta  
* no usado antes

#### **Task 8.3**

Validar payload:

* `finalists`  
* `champion`  
* sin duplicados  
* champion dentro de finalists

#### **Task 8.4**

Persistir:

* `isAdjusted = true`  
* `adjustedAt = now`  
* `adjustedFinalists`  
* `adjustedChampion`

#### **Task 8.5**

No modificar:

* `groupPicks`  
* `finalists` originales  
* `champion` original

#### **Task 8.6**

Devolver response:

* `status = adjusted_locked`  
* `adjustmentConfirmedAt`  
* `adjustedFinalists`  
* `adjustedChampion`  
* `penaltyModel`

#### **Task 8.7**

Usar penalty model del canon/API:

* `finalistPoints = 5`  
* `championPoints = 12`

### **Acceptance Criteria**

* el ajuste se puede ejecutar una sola vez  
* es irreversible  
* no toca picks de grupos  
* el penalty model queda visible para UI  
* los errores públicos son exactos:  
  * `ADJUSTMENT_NOT_AVAILABLE`  
  * `ADJUSTMENT_ALREADY_USED`  
  * `INVALID_FINALISTS_DUPLICATE`  
  * `INVALID_CHAMPION_NOT_IN_FINALISTS`.

---

## **CARD 9 — Tournament Timeline & Window Resolution**

### **Objetivo**

Definir cómo el backend conoce los hitos temporales necesarios para la ventana inicial y la ventana de ajuste.

### **Alcance**

* kickoff del torneo  
* cierre de grupos  
* kickoff del primer partido de octavos  
* derivación consistente en UTC

### **Tareas**

#### **Task 9.1**

Definir helper para `tournamentKickoffAt`:

* preferentemente desde el partido más temprano del torneo

#### **Task 9.2**

Definir helper para `firstR16KickoffAt`:

* primer partido con `stage = "R16"`

#### **Task 9.3**

Definir helper `allGroupsClosed`:

* idealmente true si todos los partidos de grupos están finalizados/cerrados según source of truth backend

#### **Task 9.4**

Persistir UTC y derivar todo server-side.

#### **Task 9.5**

Prohibir cualquier tolerancia o grace period.

### **Acceptance Criteria**

* todos los deadlines salen de backend  
* no hay dependencia de reloj del cliente  
* no hay tolerancia  
* la lógica es consistente con kickoff exacto del MVP.

---

## **CARD 10 — Optional Macro Lock / Adjustment Activation Job**

### **Objetivo**

Agregar endurecimiento operativo para que el módulo macro no dependa solo de request-time checks.

### **Alcance**

* job scheduler simple  
* cierre de ventana inicial  
* activación/cierre de ajuste  
* logs mínimos

### **Tareas**

#### **Task 10.1**

Crear job `macro-window-enforcement`.

#### **Task 10.2**

Cada minuto o frecuencia razonable:

* detectar si pasó kickoff del torneo  
* marcar `isLocked = true` en macro predictions que sigan abiertas si se decide persistir el flag

#### **Task 10.3**

Detectar cierre de grupos y elegibilidad de ajuste.

#### **Task 10.4**

Detectar cierre de octavos kickoff y bloquear posibilidad de ajuste.

#### **Task 10.5**

Registrar logs operativos mínimos para debugging.

### **Acceptance Criteria**

* el sistema no depende solo de checks en handler  
* los estados quedan consistentes aunque el usuario no abra la pantalla  
* el job es idempotente y reejecutable.

---

## **CARD 11 — Macro Picks Screen UI**

### **Objetivo**

Construir la pantalla principal de macro picks mobile-first, clara y rápida de completar.

### **Alcance**

* pantalla `/macro-picks`  
* grupos A-H  
* finalistas  
* campeón  
* barra o resumen de completion  
* CTA principal contextual  
* estados loading/error/empty/draft/locked

### **Tareas**

#### **Task 11.1**

Crear screen del dominio `macro-picks` en `apps/web/src/domains/macro-picks`.

#### **Task 11.2**

Renderizar bloques de grupos A-H con selección explícita de:

* 1°  
* 2°

#### **Task 11.3**

Renderizar bloque de finalistas.

#### **Task 11.4**

Renderizar bloque de campeón.

#### **Task 11.5**

Renderizar summary de completion.

#### **Task 11.6**

Mostrar deadline visible siempre.

#### **Task 11.7**

Mostrar CTA contextual:

* `Guardar picks`  
* `Guardar cambios`  
* `Bloqueado`  
* `Ajustar picks`

### **Acceptance Criteria**

* la pantalla es utilitaria y no decorativa  
* el usuario entiende qué le falta completar  
* hay un solo CTA principal por estado  
* el deadline es visible  
* no hay cálculos de negocio en cliente.

---

## **CARD 12 — Adjustment UX Flow**

### **Objetivo**

Construir el flujo UX específico del ajuste post grupos.

### **Alcance**

* modo de ajuste  
* picks de grupos read-only  
* finalistas/champion editables  
* warning de penalización  
* confirmación irreversible

### **Tareas**

#### **Task 12.1**

Mostrar los `groupPicks` iniciales como solo lectura en ajuste.

#### **Task 12.2**

Permitir editar solo:

* finalistas  
* campeón

#### **Task 12.3**

Mostrar warning persistente:

* estás usando tu único ajuste  
* no podrás volver atrás  
* los puntos posibles serán reducidos según penalización

#### **Task 12.4**

Agregar confirm modal o confirm step explícito.

#### **Task 12.5**

Después de confirmar, navegar a estado final bloqueado.

### **Acceptance Criteria**

* el flujo comunica irreversibilidad  
* el usuario entiende la penalización antes de confirmar  
* los grupos no son editables  
* el estado final queda claro.

---

## **CARD 13 — Home Integration for Macro Summary**

### **Objetivo**

Integrar el resumen macro en Home para sostener retorno y visibilidad de estado.

### **Alcance**

* summary card en `/home`  
* CTA contextual  
* reuse de estados backend

### **Tareas**

#### **Task 13.1**

Extender el dominio Home para consumir summary macro existente o nuevo mapper desde `GET /home`.

#### **Task 13.2**

Mostrar en home:

* estado macro actual  
* completion si aplica  
* deadline si aplica  
* CTA:  
  * `Completar picks`  
  * `Editar picks`  
  * `Ver picks`  
  * `Ajustar picks`

#### **Task 13.3**

No recalcular nada del lado cliente.

### **Acceptance Criteria**

* la home sigue siendo tablero de acción  
* el módulo macro aparece con un CTA claro  
* el estado de home coincide con `/macro-picks`.

---

## **CARD 14 — Tests: Domain, API, UI**

### **Objetivo**

Cubrir el dominio macro con tests suficientes para que Codex no introduzca regresiones silenciosas.

### **Alcance**

* unit tests  
* integration tests  
* UI tests mínimos

### **Tareas**

#### **Task 14.1**

Unit tests de validación:

* grupo duplicado  
* equipo fuera de grupo  
* finalistas duplicados  
* champion fuera de finalists

#### **Task 14.2**

Unit tests de state machine:

* not started  
* draft editable  
* submitted editable  
* locked original  
* adjustment available  
* adjusted locked

#### **Task 14.3**

Integration tests:

* `GET /macro-picks`  
* `PUT /macro-picks`  
* `POST /macro-picks/adjustment`

#### **Task 14.4**

Casos API críticos:

* save antes del cierre  
* save después del cierre  
* ajuste sin picks iniciales  
* ajuste duplicado  
* ajuste fuera de ventana

#### **Task 14.5**

UI tests mínimos:

* completion visible  
* deadline visible  
* grupos read-only durante ajuste  
* warning de penalización visible  
* CTA cambia según estado

### **Acceptance Criteria**

* las reglas críticas quedan cubiertas  
* los errores públicos están testeados  
* los estados UX más delicados tienen cobertura mínima  
* CI pasa.

---

## **CARD 15 — Seeds & Dev Scenarios for Macro Module**

### **Objetivo**

Dejar escenarios reproducibles de datos para probar todos los estados macro sin depender de operación manual compleja.

### **Alcance**

* dataset de grupos/equipos  
* escenarios de macro prediction por usuario  
* helper de reloj/fixtures de tiempo si corresponde

### **Tareas**

#### **Task 15.1**

Agregar seeds de usuarios con:

* sin macro picks  
* draft parcial  
* submitted editable  
* locked original  
* adjustment available  
* adjusted locked

#### **Task 15.2**

Agregar script dev para resetear y recrear escenarios.

#### **Task 15.3**

Documentar cómo probar cada estado.

### **Acceptance Criteria**

* otro developer puede levantar localmente todos los estados críticos  
* los escenarios son compatibles con modelo y contratos  
* QA puede validar sin setup manual frágil.

---

## **8\. Riesgos principales de la épica**

### **Riesgo 1 — Ventana de ajuste mal resuelta**

Puede habilitar ajuste antes de tiempo o dejarlo abierto tarde.

**Mitigación:** toda resolución temporal y de cierre de grupos vive server-side, en UTC, con helpers únicos y tests específicos.

### **Riesgo 2 — Inconsistencia entre estado y flags**

`status`, `isLocked` y `adjustmentAvailable` podrían contradecirse.

**Mitigación:** una sola state machine de dominio, reutilizada por endpoint y UI mapper.

### **Riesgo 3 — Ajuste sobrescribiendo picks originales**

Podría perderse evidencia del pick inicial.

**Mitigación:** persistir `adjustedFinalists` y `adjustedChampion` por separado, dejando intactos `groupPicks`, `finalists` y `champion` originales.

### **Riesgo 4 — Dependencia del cliente para deadlines**

Podría abrir bugs de timezone o tolerancias.

**Mitigación:** backend source of truth, UTC, sin grace period, checks en request-time y job de endurecimiento opcional.

### **Riesgo 5 — UX confusa en ajuste**

El usuario podría no entender que pierde puntos máximos posibles.

**Mitigación:** warning persistente, confirmación explícita e inclusión de `penaltyModel` en response.

---

## **9\. Entregables concretos de la épica**

### **Backend**

* `macroPredictionsRepository`  
* validadores de dominio macro  
* state machine macro  
* `GET /api/v1/macro-picks`  
* `PUT /api/v1/macro-picks`  
* `POST /api/v1/macro-picks/adjustment`  
* helpers de ventanas y deadlines  
* job opcional de enforcement

### **Frontend**

* pantalla `Macro Picks`  
* bloques A-H  
* selector de finalistas  
* selector de campeón  
* completion summary  
* modo ajuste  
* warning de penalización  
* estados loading/error/locked/adjusted

### **Shared**

* tipos y schemas públicos del dominio macro  
* catálogo de errores públicos del módulo

### **Testing**

* tests unitarios de dominio  
* tests integración API  
* tests UI mínimos

### **Ops**

* seeds dev  
* scripts de escenarios  
* README/handoff actualizado.