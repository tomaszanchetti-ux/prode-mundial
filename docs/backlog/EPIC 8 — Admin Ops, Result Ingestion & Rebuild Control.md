# **EPIC 8 — Admin Ops, Result Ingestion & Rebuild Control**

Esta épica cierra la capa operativa mínima del MVP, sin rediseñar producto ni introducir complejidad enterprise. Toma como base obligatoria el canon del MVP, la separación API/admin/jobs, el modelo batch/event-driven, los read models materializados, la idempotencia obligatoria y la existencia previa de scoring match, scoring macro, standings y home snapshots.

Su objetivo no es crear un panel admin complejo. Su objetivo es dejar implementado el control operativo mínimo, API-first, para que un operador interno pueda: cargar o corregir resultados oficiales, disparar jobs manuales seguros, inspeccionar logs mínimos, controlar estados críticos de partidos/fases y ejecutar rebuilds sin duplicar efectos. Esto ya está implícitamente previsto por la API mínima admin, por el data model canónico y por las épicas 3, 6 y 7 que dependen de scoring logs, standings materializados y refresh por eventos.

---

## **1\. Propósito**

Implementar la capa operativa mínima del sistema para administrar resultados oficiales, correcciones y recálculos de forma:

* determinística  
* idempotente  
* re-ejecutable  
* auditable en nivel MVP  
* consistente con backend como source of truth

La épica debe dejar resuelto, de punta a punta:

* ingesta manual de resultado oficial de partido  
* corrección manual de resultado ya cargado  
* disparo manual de scoring de partido  
* disparo manual de scoring macro  
* disparo manual de rebuild de standings  
* consulta mínima de logs de operación  
* control mínimo de estado operativo de partidos y fases  
* integración explícita con `matches`, `predictions`, `matchScoringLogs`, `macroScoringLogs`, `users`, `leagueStandings` y `homeSnapshots` donde corresponda.

---

## **2\. Objetivos funcionales**

Al finalizar esta épica, el sistema debe permitir que un admin interno:

1. liste partidos para operar  
2. inspeccione el estado operativo de un partido  
3. cargue resultado oficial de un partido terminado  
4. corrija un resultado oficial previamente cargado  
5. fuerce manualmente el scoring de un partido  
6. fuerce manualmente el scoring macro  
7. fuerce manualmente rebuild de standings  
8. consulte logs mínimos de:  
   * ingesta de resultados  
   * scoring de partidos  
   * scoring macro  
9. controle, al menos a nivel operativo, estados de:  
   * partido  
   * fase de grupos  
   * knockout  
10. ejecute estas operaciones sin duplicar puntos ni romper standings

Además, el sistema debe permitir que, tras una ingesta o corrección:

* el `match` quede actualizado con su resultado oficial  
* el scoring job se acepte o se dispare de forma explícita y segura  
* `matchScoringLogs` o `macroScoringLogs` se puedan sobreescribir o regenerar de forma idempotente  
* `users` mantenga agregados correctos  
* `leagueStandings` se reconstruya desde datos fuente  
* `homeSnapshots` pueda refrescarse por hooks/eventos existentes sin introducir lógica nueva en frontend.

---

## **3\. Alcance**

### **Incluye**

* endpoints admin bajo `/api/v1/admin/...`  
* auth admin mínima en backend  
* contratos shared para requests/responses admin  
* lectura de partidos para operación interna  
* escritura/corrección de resultados oficiales  
* triggers manuales de jobs operativos  
* logs mínimos en persistencia  
* mapeo de side effects operativos  
* validaciones de consistencia de resultados  
* integración con scoring ya existente  
* integración con rebuild de standings ya existente  
* integración con refresh de home ya existente  
* scripts dev mínimos para probar operación local  
* tests unitarios, integración y flujo operativo crítico

### **Excluye**

* panel admin rico  
* analytics operativas avanzadas  
* colas complejas enterprise  
* permisos/roles avanzados  
* auditoría full compliance  
* proveedor externo productivo de resultados  
* live feed  
* notificaciones internas  
* moderación expandida  
* nuevas reglas de scoring  
* nuevas reglas de standings  
* cambios de UX del lado jugador  
* cualquier ranking global

Esto respeta que la API spec ya prevé admin mínimo, que TECH DECISIONS exige simplicidad operativa y que el canon excluye capas sociales/globales fuera de ligas.

---

## **4\. Resultado esperado (flujo demo)**

### **Flujo demo A — Ingesta inicial de resultado**

1. admin lista partidos pendientes o ya jugados  
2. abre partido `m_001`  
3. envía resultado oficial:  
   * `homeScore90`  
   * `awayScore90`  
   * `qualifiedTeamId` si aplica  
   * `status = "finished"`  
4. backend valida consistencia  
5. backend actualiza `matches/{matchId}`  
6. backend crea `resultIngestionLogs`  
7. backend responde `accepted`  
8. backend deja scoring listo para trigger inmediato o manual según endpoint usado  
9. admin dispara `score-match`  
10. scoring recalcula `predictions`, `users`, `leagueStandings`  
11. home se refresca vía hooks/eventos ya definidos

### **Flujo demo B — Corrección de resultado**

1. admin detecta error en resultado cargado  
2. reenvía `POST /api/v1/admin/results/match`  
3. backend registra que es corrección, no primera ingesta  
4. backend sobreescribe `match`  
5. backend persiste nuevo `resultIngestionLogs`  
6. admin dispara `score-match`  
7. scoring se recalcula sin duplicar puntos  
8. standings quedan consistentes  
9. logs reflejan nuevo checksum / nueva ejecución

### **Flujo demo C — Rebuild de standings**

1. admin dispara `POST /api/v1/admin/jobs/rebuild-standings`  
2. backend acepta job con `jobAccepted = true`  
3. job reconstruye standings desde memberships \+ aggregates de usuario  
4. posiciones se recalculan por:  
   * `totalPoints`  
   * `exactHits`  
   * `correctSigns`  
5. `leagueStandings` queda materializado de nuevo  
6. home de usuarios afectados se refresca por el flujo ya previsto

### **Flujo demo D — Macro scoring manual**

1. admin dispara `POST /api/v1/admin/jobs/score-macro`  
2. job evalúa macro predictions contra resultados oficiales disponibles  
3. persiste/reescribe `macroScoringLogs`  
4. actualiza `users.macroPoints` y `users.totalPoints`  
5. dispara rebuild de standings afectados  
6. home refleja impacto competitivo

### **Flujo demo E — Logs mínimos**

1. admin consulta `GET /api/v1/admin/logs/results`  
2. ve historial reciente de ingestas/correcciones  
3. admin consulta `GET /api/v1/admin/logs/scoring`  
4. ve referencias mínimas a:  
   * score-match  
   * score-macro  
   * rebuild-standings  
5. puede inspeccionar si la última operación fue aceptada, ejecutada y con qué scope

Este flujo es consistente con el modelo oficial: resultado oficial → scoring → updates de usuario → rebuild standings → snapshots derivados.

---

## **5\. Dependencias**

Esta épica depende directamente de:

* **MVP CANON**  
  * backend como source of truth  
  * scoring post-evento  
  * modelo event-driven \+ batch  
  * read models precomputados  
  * deadlines exactos  
  * competencia solo en ligas  
* **PROJECT STRUCTURE**  
  * `apps/api`  
  * `apps/jobs`  
  * `apps/admin`  
  * shared-first  
  * jobs separados de API  
* **API Specification**  
  * admin API mínima ya prevista  
  * contracts bajo `/api/v1`  
  * envelope `{ ok, data }`  
* **DATA MODEL**  
  * `matches`  
  * `predictions`  
  * `users`  
  * `leagueStandings`  
  * `matchScoringLogs`  
  * `macroScoringLogs`  
  * `resultIngestionLogs`  
  * `adminActions` opcional mínimo  
* **TECH DECISIONS**  
  * Cloud Run para API  
  * Cloud Run Jobs para batch  
  * Firestore  
  * Cloud Scheduler  
  * idempotencia obligatoria  
  * simplicidad operativa primero  
* **EPIC 3**  
  * scoring match  
  * aggregates de usuario  
  * standings materializados  
* **EPIC 6**  
  * macro scoring  
  * macroScoringLogs  
  * trigger a standings  
* **EPIC 7**  
  * refresh de home por eventos  
  * refresh tras standings rebuild/scoring

---

## **6\. Definition of Done**

La épica se considera terminada solo si:

* existe `GET /api/v1/admin/matches`  
* existe `GET /api/v1/admin/matches/:matchId`  
* existe `PATCH /api/v1/admin/matches/:matchId`  
* existe `POST /api/v1/admin/results/match`  
* existe `POST /api/v1/admin/jobs/score-match`  
* existe `POST /api/v1/admin/jobs/score-macro`  
* existe `POST /api/v1/admin/jobs/rebuild-standings`  
* existe `GET /api/v1/admin/logs/results`  
* existe `GET /api/v1/admin/logs/scoring`  
* el backend valida payloads de resultados de grupos y knockout  
* el backend rechaza resultados inconsistentes  
* la ingesta de resultados crea `resultIngestionLogs`  
* la corrección de resultado no duplica puntos por sí sola  
* score-match puede re-ejecutarse sin doble conteo  
* score-macro puede re-ejecutarse sin doble conteo  
* rebuild-standings puede re-ejecutarse y producir mismo estado  
* `matchScoringLogs` persiste checksum, version y snapshot de resultado  
* `macroScoringLogs` persiste scope, checksum y version  
* los jobs tienen payload explícito y logs trazables  
* los endpoints admin usan envelope estándar  
* no hay lógica crítica nueva en frontend  
* existen tests unitarios de validación  
* existen tests de integración de endpoints admin  
* existen tests de jobs idempotentes  
* existe semilla/script mínimo para probar flujo operativo local  
* CI pasa con lint \+ typecheck \+ test

---

# **7\. CARDS — Ejecutables para Codex**

---

# **CARD 1 — Shared Contracts: Admin Ops, Result Ingestion & Jobs**

## **Objetivo**

Definir en `packages/shared` todos los contratos, tipos, enums y schemas públicos/operativos que usará EPIC 8, manteniendo consistencia con `/api/v1`, camelCase y envelope estándar.

## **Dominio**

`shared`

## **Tasks**

### **Task 1.1**

Crear enum/union `AdminJobType`:

* `score_match`  
* `score_macro`  
* `rebuild_standings`

### **Task 1.2**

Crear enum/union `AdminJobStatus`:

* `accepted`  
* `running`  
* `completed`  
* `failed`

### **Task 1.3**

Crear enum/union `ResultIngestionActionType`:

* `ingest`  
* `correction`

### **Task 1.4**

Crear enum/union `MatchOperationalStatus` para DTO admin, reutilizando `match.status` existente y agregando flags derivados, no estados nuevos de producto:

* `scheduled`  
* `live` si ya existe en canon técnico  
* `finished`  
* `cancelled` si ya existe en modelo  
* no introducir estados inventados si no existen upstream

### **Task 1.5**

Definir `AdminMatchListItem`:

* `matchId`  
* `stage`  
* `groupId | null`  
* `homeTeam`  
* `awayTeam`  
* `kickoffAt`  
* `status`  
* `isLocked`  
* `hasOfficialResult`  
* `lastResultIngestedAt | null`  
* `lastScoredAt | null`  
* `manualLock | null`

### **Task 1.6**

Definir `AdminMatchDetail`:

* todo lo anterior  
* `result`  
  * `homeScore90 | null`  
  * `awayScore90 | null`  
  * `qualifiedTeamId | null`  
  * `winnerTeamId | null`  
* `operational`  
  * `canIngestResult`  
  * `canCorrectResult`  
  * `canTriggerMatchScoring`  
  * `scoringRecommended`  
  * `lastIngestionLogId | null`  
  * `lastScoringChecksum | null`

### **Task 1.7**

Definir request schema `AdminUpsertMatchResultRequest`:

* `matchId`  
* `homeScore90`  
* `awayScore90`  
* `qualifiedTeamId | null`  
* `status`  
* `source`  
* `note | null`  
* `triggerScoring?: boolean`

### **Task 1.8**

Reglas del schema:

* scores enteros `>= 0`  
* si stage knockout y `homeScore90 === awayScore90` entonces `qualifiedTeamId` obligatorio  
* si stage group entonces `qualifiedTeamId` debe ser `null`  
* `status` permitido solo si representa cierre válido para resultado oficial  
* `source` string corto requerido para trazabilidad MVP  
* `note` opcional

### **Task 1.9**

Definir `AdminTriggerScoreMatchRequest`:

* `matchId`  
* `reason`  
* `force?: boolean`

### **Task 1.10**

Definir `AdminTriggerScoreMacroRequest`:

* `eventId`  
* `scope`  
* `reason`  
* `force?: boolean`

### **Task 1.11**

Definir `AdminTriggerRebuildStandingsRequest`:

* `leagueId?: string | null`  
* `userId?: string | null`  
* `reason`  
* `force?: boolean`

### **Task 1.12**

Definir `AdminJobAcceptedResponse`:

* `jobAccepted`  
* `jobType`  
* `jobId`  
* `scope`  
* `acceptedAt`

### **Task 1.13**

Definir `ResultIngestionLogDto`:

* `logId`  
* `matchId`  
* `actionType`  
* `source`  
* `note | null`  
* `requestChecksum`  
* `resultSnapshot`  
* `previousResultSnapshot | null`  
* `triggerScoringRequested`  
* `createdAt`  
* `createdBy`

### **Task 1.14**

Definir `ScoringLogReferenceDto`:

* `jobType`  
* `scope`  
* `entityId`  
* `status`  
* `checksum`  
* `scoringVersion`  
* `processedCount`  
* `startedAt | null`  
* `completedAt | null`

### **Task 1.15**

Definir responses:

* `AdminMatchListResponse`  
* `AdminMatchDetailResponse`  
* `AdminResultLogsResponse`  
* `AdminScoringLogsResponse`

### **Task 1.16**

Exportar tipos desde barrel de `packages/shared`.

### **Task 1.17**

Agregar tests de schemas:

* payload válido grupos  
* payload válido knockout con clasificado  
* payload inválido knockout sin clasificado  
* payload inválido grupos con clasificado  
* payload inválido con scores negativos

## **Acceptance Criteria**

* todos los contratos admin viven en `packages/shared`  
* frontend/admin y backend usan mismos tipos  
* no se introducen campos que obliguen al frontend jugador  
* schemas cubren grupo y knockout correctamente  
* tests de schema pasan

---

# **CARD 2 — Data Model Extension: resultIngestionLogs \+ adminActions mínimos**

## **Objetivo**

Canonizar e implementar la persistencia mínima operativa que el data model dejó como soporte opcional pero recomendado para robustez del MVP.

## **Dominio**

`backend / api / shared`

## **Tasks**

### **Task 2.1**

Crear documento de implementación interna para colección:

`resultIngestionLogs/{logId}`

### **Task 2.2**

Definir shape persistido:

type ResultIngestionLog \= {  
  logId: string  
  matchId: string  
  actionType: 'ingest' | 'correction'  
  source: string  
  note: string | null

  requestChecksum: string

  resultSnapshot: {  
    homeScore90: number  
    awayScore90: number  
    qualifiedTeamId: string | null  
    winnerTeamId: string | null  
    status: string  
    stage: string  
  }

  previousResultSnapshot: {  
    homeScore90: number | null  
    awayScore90: number | null  
    qualifiedTeamId: string | null  
    winnerTeamId: string | null  
    status: string | null  
  } | null

  triggerScoringRequested: boolean

  createdAt: timestamp  
  createdBy: string  
}

### **Task 2.3**

Definir ID determinístico o cuasi determinístico:

* preferir `autoId` para historial  
* persistir `requestChecksum` para deduplicación lógica  
* no usar checksum como primary key si se quiere mantener historial de correcciones distintas

### **Task 2.4**

Implementar repository `resultIngestionLogsRepository`:

* `createLog()`  
* `listLogs()`  
* `getLatestByMatchId()`  
* `findByChecksumWithinMatch()`

### **Task 2.5**

Crear `adminActions/{actionId}` mínimo solo para:

* `match_result_ingested`  
* `match_result_corrected`  
* `job_score_match_triggered`  
* `job_score_macro_triggered`  
* `job_rebuild_standings_triggered`

### **Task 2.6**

`adminActions` debe guardar:

* `actionId`  
* `actionType`  
* `actorUserId`  
* `targetType`  
* `targetId`  
* `payloadSummary`  
* `createdAt`

### **Task 2.7**

Agregar índices/restricciones de consulta necesarias:

* por `matchId + createdAt desc`  
* por `actionType + createdAt desc`

### **Task 2.8**

Actualizar documentación interna del modelo sin modificar canon funcional.

## **Acceptance Criteria**

* existe colección `resultIngestionLogs`  
* existe colección mínima `adminActions`  
* se puede listar historial por partido  
* hay checksum para deduplicación lógica  
* correcciones no pisan historial anterior  
* implementación queda alineada con soporte opcional del data model

---

# **CARD 3 — Admin Auth Guard & Internal Access Policy mínima**

## **Objetivo**

Proteger endpoints admin sin introducir RBAC enterprise.

## **Dominio**

`api`

## **Tasks**

### **Task 3.1**

Crear middleware/guard `requireAdminAuth`.

### **Task 3.2**

Base de la validación:

* validar Firebase ID token igual que resto de API  
* luego validar allowlist admin mínima por config/env o documento de usuarios internos  
* no introducir sistema de roles complejo

### **Task 3.3**

Agregar variables/config:

* `ADMIN_ALLOWLIST_EMAILS`  
* o `ADMIN_ALLOWLIST_USER_IDS`

### **Task 3.4**

Responder:

* `UNAUTHENTICATED` si no hay token válido  
* `FORBIDDEN` si el token es válido pero no autorizado

### **Task 3.5**

Cubrir todos los endpoints `/api/v1/admin/*`.

### **Task 3.6**

Agregar tests:

* sin token  
* token inválido  
* usuario no admin  
* usuario admin

## **Acceptance Criteria**

* ningún endpoint admin queda expuesto sin guard  
* no se crea RBAC fuera de MVP  
* errores cumplen catálogo estándar  
* tests de auth admin pasan

---

# **CARD 4 — Admin Matches Read API**

## **Objetivo**

Exponer lectura mínima operativa de partidos para backoffice.

## **Dominio**

`api / backend`

## **Tasks**

### **Task 4.1**

Implementar `GET /api/v1/admin/matches`.

### **Task 4.2**

Soportar filtros query opcionales:

* `stage`  
* `status`  
* `hasOfficialResult`  
* `needsScoring`  
* `dateFrom`  
* `dateTo`

### **Task 4.3**

Resolver `needsScoring` server-side:

* `true` si el partido tiene resultado oficial y no tiene scoring log vigente consistente con checksum actual del resultado  
* `false` en caso contrario

### **Task 4.4**

Enriquecer cada item con:

* resultado oficial resumido si existe  
* `lastResultIngestedAt`  
* `lastScoredAt`  
* `isLocked`  
* `manualLock` si ese campo ya vive en match/admin patch previo

### **Task 4.5**

Implementar `GET /api/v1/admin/matches/:matchId`.

### **Task 4.6**

En detalle, incluir:

* metadata del partido  
* resultado actual persistido  
* scoring reference  
* flags operativos  
* último log de ingesta si existe

### **Task 4.7**

Mantener serializers camelCase y envelope estándar.

### **Task 4.8**

Agregar tests integración:

* listado vacío  
* listado con filtros  
* detalle existente  
* `MATCH_NOT_FOUND`

## **Acceptance Criteria**

* admin puede listar partidos para operar  
* admin puede inspeccionar detalle operativo de un partido  
* el backend resuelve `needsScoring`  
* contratos responden listos para UI/API-first  
* tests pasan

---

# **CARD 5 — PATCH /api/v1/admin/matches/:matchId**

## **Objetivo**

Permitir correcciones operativas mínimas de metadata del partido, sin mezclar todavía la ingesta del resultado oficial.

## **Dominio**

`api / backend`

## **Tasks**

### **Task 5.1**

Implementar endpoint ya previsto por la API spec para patch administrativo del partido.

### **Task 5.2**

Permitir actualizar solo campos operativos mínimos:

* `kickoffAt`  
* `status` si aplica a metadata operativa  
* `manualLock`

### **Task 5.3**

No permitir por este endpoint actualizar:

* scores oficiales  
* qualifiedTeamId  
* scoring logs  
* aggregates de usuarios

### **Task 5.4**

Registrar `adminActions` cuando haya cambio efectivo.

### **Task 5.5**

Si cambia `kickoffAt` o `manualLock`, invalidar/refreshar read models afectados cuando corresponda:

* match detail/list read states  
* home snapshots si impacta CTA/lock visual

### **Task 5.6**

Agregar tests de patch permitido vs campos prohibidos.

## **Acceptance Criteria**

* metadata operativa se puede corregir  
* resultado oficial solo entra por endpoint de results  
* cambios operativos quedan trazados  
* no hay side effects de scoring en este endpoint

---

# **CARD 6 — Result Ingestion Handler**

## **Objetivo**

Implementar el caso de uso central de EPIC 8: ingesta/corrección oficial de resultado de partido.

## **Dominio**

`backend / api`

## **Tasks**

### **Task 6.1**

Crear servicio `upsertOfficialMatchResult()`.

### **Task 6.2**

Flow exacto:

1. validar auth admin  
2. validar payload  
3. cargar `match`  
4. validar que existe  
5. inferir stage real desde `match`  
6. validar consistencia del resultado según stage  
7. construir `winnerTeamId`  
8. construir `resultChecksum`  
9. comparar con resultado previo  
10. determinar `actionType`:  
* `ingest` si el match no tenía resultado oficial  
* `correction` si sí tenía  
11. si payload equivale exactamente al resultado vigente:  
* no mutar datos críticos innecesariamente  
* crear respuesta idempotente  
* opcionalmente registrar acción no-op solo en log app, no obligatorio en persistencia  
12. si hay cambio:  
* actualizar `matches/{matchId}`  
* persistir timestamps/result fields  
* persistir `resultIngestionLogs`  
* registrar `adminActions`  
13. si `triggerScoring = true`:  
* enqueue/trigger `score-match`  
14. responder con estado final

### **Task 6.3**

Persistir en `match` los campos de resultado oficiales si aún no están formalizados en implementación:

* `homeScore90`  
* `awayScore90`  
* `qualifiedTeamId | null`  
* `winnerTeamId | null`  
* `resultUpdatedAt`  
* `hasOfficialResult = true`

### **Task 6.4**

No modificar nada en `predictions`, `users` o `leagueStandings` dentro de este handler.  
Eso se delega al job.

### **Task 6.5**

Reglas de validación:

* no aceptar `qualifiedTeamId` distinto de los equipos del match  
* en knockout con empate, `qualifiedTeamId` obligatorio  
* en knockout sin empate, `qualifiedTeamId` debe coincidir con ganador de 90’ si el modelo así lo exige; si el canon previo distingue clasificado de ganador solo cuando hay empate, respetar ese modelo exacto  
* en groups, `qualifiedTeamId = null`  
* scores enteros no negativos

### **Task 6.6**

Construir checksum del resultado sobre:

* `matchId`  
* `homeScore90`  
* `awayScore90`  
* `qualifiedTeamId`  
* `status`

### **Task 6.7**

Implementar endpoint REST:  
`POST /api/v1/admin/results/match`

### **Task 6.8**

Response de éxito:

{  
  "ok": true,  
  "data": {  
    "matchId": "m\_001",  
    "actionType": "ingest",  
    "resultAccepted": true,  
    "resultChanged": true,  
    "triggerScoringRequested": true,  
    "currentResultChecksum": "..."  
  }  
}

### **Task 6.9**

Errores esperados:

* `VALIDATION_ERROR`  
* `MATCH_NOT_FOUND`  
* `FORBIDDEN`  
* `UNAUTHENTICATED`  
* `INTERNAL_ERROR`

### **Task 6.10**

Tests unitarios del servicio:

* groups válido  
* knockout válido con empate y clasificado  
* knockout inválido sin clasificado  
* corrección cambia checksum  
* misma carga repetida no cambia estado

### **Task 6.11**

Tests integración del endpoint:

* primera ingesta  
* corrección  
* idempotent repeat  
* triggerScoring true

## **Acceptance Criteria**

* se puede cargar resultado oficial  
* se puede corregir resultado oficial  
* el endpoint es idempotente ante mismo payload  
* el endpoint no duplica scoring ni puntos  
* `resultIngestionLogs` queda persistido  
* side effects de scoring quedan separados

---

# **CARD 7 — Match Scoring Trigger API \+ Job Contract**

## **Objetivo**

Exponer trigger manual y explícito de scoring de partido, sin recalcular dentro del request HTTP.

## **Dominio**

`api / jobs / backend`

## **Tasks**

### **Task 7.1**

Implementar endpoint:  
`POST /api/v1/admin/jobs/score-match`

### **Task 7.2**

Payload:

* `matchId`  
* `reason`  
* `force?: boolean`

### **Task 7.3**

Validaciones:

* `match` existe  
* hay resultado oficial  
* si no hay resultado oficial responder error de negocio:  
  * `VALIDATION_ERROR` o código específico interno, sin inventar catálogo público innecesario  
* si ya existe scoring log con checksum igual y `force !== true`, aceptar no-op o responder `jobAccepted: false` con motivo explícito en `data`

### **Task 7.4**

Construir `ScoreMatchJobPayload`:

* `jobId`  
* `matchId`  
* `requestedBy`  
* `requestedAt`  
* `reason`  
* `force`  
* `expectedResultChecksum`

### **Task 7.5**

Enqueue/execute Cloud Run Job con payload explícito.

### **Task 7.6**

Persistir `adminActions` del trigger.

### **Task 7.7**

Job `score-match` debe:

1. leer match actual  
2. validar resultado oficial  
3. recomputar scoring match-level  
4. upsert `matchScoringLogs/{matchId}`  
5. recalcular aggregates de usuarios afectados  
6. encolar rebuild de standings de ligas afectadas  
7. refrescar homes afectadas por hook/evento existente

### **Task 7.8**

Idempotencia del job:

* usar checksum del resultado  
* si el checksum actual coincide con scoring log existente y `force !== true`, permitir early exit seguro  
* si `force === true`, recalcular igual y sobrescribir log/aggregates consistentemente  
* nunca acumular sobre estado previo sin restar o recomputar controlado

### **Task 7.9**

Agregar CLI/script dev:  
`pnpm job:score-match --matchId=m_001`

### **Task 7.10**

Tests:

* trigger acepta job  
* job con resultado sin cambios no duplica  
* `force` reejecuta y deja mismo estado final  
* standings afectados se reconstruyen  
* home se refresca

## **Acceptance Criteria**

* API solo dispara job  
* scoring real vive en jobs  
* payload del job es explícito  
* idempotencia se apoya en checksum  
* no hay doble conteo al repetir

---

# **CARD 8 — Macro Scoring Trigger API \+ Job Contract**

## **Objetivo**

Completar la operación manual del scoring macro, consistente con EPIC 6 y separada de la API.

## **Dominio**

`api / jobs / backend`

## **Tasks**

### **Task 8.1**

Implementar endpoint:  
`POST /api/v1/admin/jobs/score-macro`

### **Task 8.2**

Payload:

* `eventId`  
* `scope`  
  * `group-stage`  
  * `finalists`  
  * `champion`  
  * `full-macro`  
* `reason`  
* `force?: boolean`

### **Task 8.3**

Mapear este endpoint al concepto de recálculo macro ya previsto en API spec, ajustando naming al patrón definitivo de esta épica. El endpoint histórico `recalculate-macro` queda absorbido por `score-macro` para consistencia operativa, sin crear dos caminos paralelos.

### **Task 8.4**

Construir `ScoreMacroJobPayload`:

* `jobId`  
* `eventId`  
* `scope`  
* `requestedBy`  
* `requestedAt`  
* `reason`  
* `force`

### **Task 8.5**

Job `score-macro` debe:

1. resolver universo de usuarios con `macroPredictions`  
2. cargar resultados oficiales necesarios según scope  
3. calcular scoring macro  
4. upsert `macroScoringLogs`  
5. actualizar `users.macroPoints` y `users.totalPoints`  
6. encolar rebuild standings de ligas afectadas  
7. refrescar homes afectadas

### **Task 8.6**

Idempotencia:

* `macroScoringLogs` con checksum \+ scope \+ scoringVersion  
* misma corrida repetida sin cambios no debe alterar aggregates  
* `force` debe recalcular y sobrescribir, no duplicar

### **Task 8.7**

Script dev:  
`pnpm job:score-macro --eventId=tournament-finished --scope=full-macro`

### **Task 8.8**

Tests:

* trigger manual  
* log macro upsert  
* users actualizados correctamente  
* rebuild standings disparado  
* no duplicación en rerun

## **Acceptance Criteria**

* el scoring macro se puede lanzar manualmente  
* job y API quedan separados  
* se respeta exactamente EPIC 6  
* reruns son seguros

---

# **CARD 9 — Rebuild Standings Trigger API \+ Orchestration**

## **Objetivo**

Exponer rebuild explícito de standings, desacoplado y seguro, reutilizando builder ya cerrado en épicas previas.

## **Dominio**

`api / jobs / backend`

## **Tasks**

### **Task 9.1**

Implementar endpoint:  
`POST /api/v1/admin/jobs/rebuild-standings`

### **Task 9.2**

Soportar scopes:

* rebuild global de todas las ligas  
* rebuild por `leagueId`  
* rebuild por `userId` derivando ligas afectadas

### **Task 9.3**

Payload:

* `leagueId?: string | null`  
* `userId?: string | null`  
* `reason`  
* `force?: boolean`

### **Task 9.4**

Construir `RebuildStandingsJobPayload`:

* `jobId`  
* `scope`  
* `leagueIds[]`  
* `requestedBy`  
* `requestedAt`  
* `reason`  
* `force`

### **Task 9.5**

Orquestación del job:

1. resolver ligas objetivo  
2. por cada liga:  
   * obtener memberships  
   * leer `users` aggregates  
   * ordenar por desempate canónico:  
     1. `totalPoints DESC`  
     2. `exactHits DESC`  
     3. `correctSigns DESC`  
   * asignar `position`  
   * upsert `leagueStandings/{leagueId}/table/{userId}`  
3. actualizar `lastUpdatedAt`  
4. refrescar homes de usuarios afectados

### **Task 9.6**

Idempotencia:

* reconstrucción full del snapshot  
* no patch incremental ciego  
* mismo input ⇒ mismo output

### **Task 9.7**

Responder `jobAccepted` desde API, nunca el rebuild inline.

### **Task 9.8**

Script dev:  
`pnpm job:rebuild-standings --leagueId=lg_001`

### **Task 9.9**

Tests:

* rebuild global  
* rebuild por liga  
* rebuild por usuario  
* posiciones correctas  
* rerun sin divergencia

## **Acceptance Criteria**

* rebuild de standings se puede lanzar manualmente  
* el resultado coincide con desempates canónicos  
* el job es re-ejecutable  
* home de afectados puede refrescarse después

---

# **CARD 10 — Scoring Log Read API**

## **Objetivo**

Dar visibilidad mínima a scoring logs y jobs operativos sin crear observabilidad enterprise.

## **Dominio**

`api / backend`

## **Tasks**

### **Task 10.1**

Implementar:  
`GET /api/v1/admin/logs/scoring`

### **Task 10.2**

Soportar filtros opcionales:

* `jobType`  
* `matchId`  
* `eventId`  
* `status`  
* `dateFrom`  
* `dateTo`  
* `limit`

### **Task 10.3**

La respuesta debe unificar referencias provenientes de:

* `matchScoringLogs`  
* `macroScoringLogs`  
* estado básico de ejecución de rebuilds si este no vive en colección separada

### **Task 10.4**

Para match scoring mapear:

* `entityId = matchId`  
* `jobType = score_match`  
* `checksum`  
* `scoringVersion`  
* `processedCount = totalPredictionsProcessed`

### **Task 10.5**

Para macro scoring mapear:

* `entityId = eventId`  
* `jobType = score_macro`  
* `scope`  
* `checksum`  
* `scoringVersion`  
* `processedCount = totalUsersProcessed`

### **Task 10.6**

Si rebuild-standings no tiene colección propia, exponer referencia mínima desde `adminActions` \+ metadata de ejecución.  
No crear una colección compleja solo para MVP si no es necesaria.

### **Task 10.7**

Tests:

* lectura match logs  
* lectura macro logs  
* filtros  
* respuesta vacía válida

## **Acceptance Criteria**

* admin puede consultar scoring logs mínimos  
* logs reflejan checksum/version/count  
* no se introduce stack de observabilidad extra  
* contrato queda UI-ready

---

# **CARD 11 — Result Ingestion Logs Read API**

## **Objetivo**

Permitir inspección de ingestas y correcciones de resultados oficiales.

## **Dominio**

`api / backend`

## **Tasks**

### **Task 11.1**

Implementar:  
`GET /api/v1/admin/logs/results`

### **Task 11.2**

Soportar filtros:

* `matchId`  
* `actionType`  
* `dateFrom`  
* `dateTo`  
* `limit`

### **Task 11.3**

Orden por `createdAt desc`.

### **Task 11.4**

Cada item debe devolver:

* `logId`  
* `matchId`  
* `actionType`  
* `source`  
* `note`  
* `requestChecksum`  
* `resultSnapshot`  
* `previousResultSnapshot`  
* `triggerScoringRequested`  
* `createdAt`  
* `createdBy`

### **Task 11.5**

Tests:

* listado general  
* filtrado por partido  
* filtrado por acción  
* orden descendente

## **Acceptance Criteria**

* admin puede auditar ingestas y correcciones  
* el historial queda visible  
* contrato es suficiente para un stub UI o inspección API-first

---

# **CARD 12 — Phase State Control mínimo**

## **Objetivo**

Definir control operativo mínimo de fases sin agregar motor nuevo de torneo.

## **Dominio**

`backend / api / shared`

## **Tasks**

### **Task 12.1**

Crear `tournamentPhaseResolver` que derive estado de fase a partir de datos fuente, no de flags manuales salvo que ya existan en canon:

* grupos abiertos/cerrados  
* knockout abierto/cerrado  
* macro adjustment habilitable o no  
* macro scoring habilitable o no

### **Task 12.2**

Crear DTO admin de phase status:

* `groupStageClosed`  
* `roundOf16Started`  
* `finalFinished`  
* `macroAdjustmentWindowOpen`  
* `macroScoringRecommendedScope`

### **Task 12.3**

Exponer endpoint:  
`GET /api/v1/admin/phases`

### **Task 12.4**

No crear `PATCH /admin/phases` salvo que sea estrictamente necesario para MVP.  
La prioridad es inspección operativa, no override manual de tournament engine.

### **Task 12.5**

Si el sistema necesita override mínimo para incidentes, implementarlo como config/documento único opcional:  
`tournamentOps/manualOverrides/default`  
con campos muy acotados:

* `forceMacroAdjustmentOpen?: boolean`  
* `forceMacroAdjustmentClosed?: boolean`  
  y nada más

### **Task 12.6**

Documentar que estos overrides son excepcionales y no reemplazan la verdad normal derivada de matches.

### **Task 12.7**

Tests:

* fase grupos abierta  
* grupos cerrados  
* knockout iniciado  
* final terminada  
* overrides mínimos

## **Acceptance Criteria**

* el admin puede ver el estado operativo de fases  
* no se introduce un panel de control complejo  
* la verdad sigue derivando del backend  
* ajustes macro y scoring macro pueden apoyarse en este resolver

---

# **CARD 13 — Jobs Runtime Entrypoints & Execution Safety**

## **Objetivo**

Materializar entrypoints claros en `apps/jobs` para los jobs operativos de EPIC 8, siguiendo las reglas del repo.

## **Dominio**

`jobs`

## **Tasks**

### **Task 13.1**

Crear entrypoint único por job:

* `apps/jobs/src/score-match/index.ts`  
* `apps/jobs/src/score-macro/index.ts`  
* `apps/jobs/src/rebuild-standings/index.ts`

### **Task 13.2**

Cada entrypoint debe:

* parsear payload explícito  
* validar schema  
* inicializar logger  
* ejecutar caso de uso  
* emitir logs estructurados  
* devolver exit code correcto

### **Task 13.3**

No depender de estado implícito del runtime.  
Todo input debe venir por payload/env/config explícita.

### **Task 13.4**

Agregar `jobId` a todo log emitido.

### **Task 13.5**

Estandarizar logging estructurado:

* `jobId`  
* `jobType`  
* `scope`  
* `startedAt`  
* `completedAt`  
* `status`  
* `processedCount`  
* `checksum | null`  
* `errorCode | null`

### **Task 13.6**

Agregar wrappers compartidos para:

* `withJobLogging`  
* `withJobErrorHandling`  
* `parseJobPayload`

### **Task 13.7**

Tests de entrypoint:

* payload válido  
* payload inválido  
* ejecución exitosa  
* retry seguro

## **Acceptance Criteria**

* cada job tiene entrypoint propio  
* payload siempre explícito  
* logs son trazables  
* entrypoints siguen convención del repo  
* jobs pueden correrse localmente y en Cloud Run Jobs

---

# **CARD 14 — Admin Stub UI / API-first Ops Surface**

## **Objetivo**

Dejar una superficie mínima de operación en `apps/admin` o, si se prefiere por velocidad, un stub usable que consuma los contratos ya definidos.

## **Dominio**

`admin`

## **Tasks**

### **Task 14.1**

No construir panel complejo.  
Implementar solo vistas mínimas:

* lista de partidos  
* detalle de partido  
* formulario de resultado  
* triggers de jobs  
* lista de logs

### **Task 14.2**

Rutas sugeridas:

* `/matches`  
* `/matches/:matchId`  
* `/logs/results`  
* `/logs/scoring`

### **Task 14.3**

Detalle de partido debe permitir:

* ver metadata  
* ver resultado actual  
* enviar/corregir resultado  
* disparar score-match  
* ver referencia a último scoring/log

### **Task 14.4**

Agregar confirmación simple en acciones destructivas/impactantes:

* corregir resultado  
* disparar rebuild global

### **Task 14.5**

No agregar diseño complejo.  
Usar componentes simples y utilitarios.

### **Task 14.6**

Si por timing se decide no cerrar UI completa, dejar al menos:

* páginas skeleton  
* clientes API  
* hooks  
* formularios básicos  
* fixtures/stories mínimas

## **Acceptance Criteria**

* existe una superficie mínima de operación o un stub funcional  
* no se introduce complejidad visual innecesaria  
* toda lógica crítica sigue en backend/jobs  
* UI solo consume contratos admin

---

# **CARD 15 — Cross-Domain Integration Hooks**

## **Objetivo**

Conectar la operación admin con los dominios ya cerrados sin modificar reglas previas.

## **Dominio**

`backend / jobs`

## **Tasks**

### **Task 15.1**

Al finalizar `score-match`, disparar:

* rebuild standings de ligas afectadas  
* refresh de home de usuarios afectados

### **Task 15.2**

Al finalizar `score-macro`, disparar:

* rebuild standings de ligas afectadas  
* refresh de home de usuarios afectados

### **Task 15.3**

Al finalizar `rebuild-standings`, disparar:

* refresh de home de miembros afectados

### **Task 15.4**

Asegurar que estos hooks sean idempotentes:

* refresh reconstruye desde verdad fuente  
* no agrega duplicados en `recentPointsFeed` ni snapshots

### **Task 15.5**

No recalcular home dentro de endpoint admin HTTP.  
Eso queda en jobs/eventos como ya definió EPIC 7\.

### **Task 15.6**

Tests integración cruzada:

* ingesta resultado → score-match → standings → home  
* score-macro → standings → home  
* rebuild-standings → home

## **Acceptance Criteria**

* operación admin impacta correctamente producto jugador  
* no hay divergencia entre scores, standings y home  
* no se reabre ninguna decisión funcional previa

---

# **CARD 16 — QA, Seeds & Dev Ops Pack de EPIC 8**

## **Objetivo**

Dejar reproducible localmente el flujo operativo completo.

## **Dominio**

`testing / scripts / docs`

## **Tasks**

### **Task 16.1**

Crear seed mínimo con:

* partidos group y knockout  
* predicciones de varios usuarios  
* una o más ligas con miembros  
* macroPredictions cargadas  
* users con aggregates base

### **Task 16.2**

Crear script de seed:  
`pnpm seed:ops-admin`

### **Task 16.3**

Crear scripts:

* `pnpm admin:ingest-result --matchId=...`  
* `pnpm job:score-match --matchId=...`  
* `pnpm job:score-macro --eventId=... --scope=...`  
* `pnpm job:rebuild-standings --leagueId=...`

### **Task 16.4**

Agregar test plan manual:

* primera ingesta  
* corrección  
* rerun scoring  
* rebuild standings  
* lectura logs

### **Task 16.5**

Agregar README corto de operación local.

### **Task 16.6**

Suite de tests mínima:

* unit:  
  * validadores de resultado  
  * checksum builders  
  * phase resolver  
* integration:  
  * endpoints admin  
  * repos logs  
  * dispatch jobs  
* flow:  
  * ingesta → scoring → standings  
  * corrección → rescoring → standings estables

## **Acceptance Criteria**

* un dev puede probar EPIC 8 end-to-end localmente  
* scripts cubren los flujos críticos  
* tests críticos pasan  
* README deja pasos operativos claros

---

# **8\. Contrato mínimo final de endpoints admin**

## **Endpoints obligatorios definitivos**

### **Lectura**

* `GET /api/v1/admin/matches`  
* `GET /api/v1/admin/matches/:matchId`  
* `GET /api/v1/admin/phases`  
* `GET /api/v1/admin/logs/results`  
* `GET /api/v1/admin/logs/scoring`

### **Escritura/operación**

* `PATCH /api/v1/admin/matches/:matchId`  
* `POST /api/v1/admin/results/match`  
* `POST /api/v1/admin/jobs/score-match`  
* `POST /api/v1/admin/jobs/score-macro`  
* `POST /api/v1/admin/jobs/rebuild-standings`

Todos deben responder con envelope:

{  
  "ok": true,  
  "data": {}  
}

y errores estándar:

{  
  "ok": false,  
  "error": {  
    "code": "VALIDATION\_ERROR",  
    "message": "..."  
  }  
}

Esto mantiene consistencia con la API pública y con la mínima admin API ya prevista.

---

# **9\. Reglas operativas binding de EPIC 8**

## **9.1 Ingesta no hace scoring inline**

`POST /api/v1/admin/results/match` actualiza verdad de resultado y registra log.  
El scoring corre por job separado.

## **9.2 Corrección de resultado exige rescoring**

Toda corrección que cambie checksum del resultado debe marcar `needsScoring = true`.

## **9.3 Score-match depende de checksum**

Si el checksum del resultado no cambió y no hay `force`, el job puede hacer early exit seguro.

## **9.4 Score-macro depende de scope \+ checksum**

Reruns son válidos y deben dejar el mismo estado final.

## **9.5 Rebuild-standings siempre reconstruye**

No parchea posiciones en caliente.  
Relee memberships \+ user aggregates y materializa de nuevo.

## **9.6 Home nunca calcula lógica crítica**

Solo se refresca como snapshot derivado de fuentes ya correctas.

## **9.7 Frontend jugador no participa de la operación**

Toda capa operativa vive en admin/api/jobs.

## **9.8 Nada de ranking global**

Todo impacto competitivo sigue terminando únicamente en ligas.

---

# **10\. Entregables concretos al cerrar EPIC 8**

## **Backend / API**

* dominio admin ops  
* handlers admin protegidos  
* repos de logs operativos  
* result ingestion service  
* job dispatchers  
* serializers admin

## **Jobs**

* entrypoint `score-match`  
* entrypoint `score-macro`  
* entrypoint `rebuild-standings`  
* wrappers de logging/errores  
* payload validators

## **Shared**

* contratos admin  
* schemas requests/responses  
* tipos de logs operativos  
* enums de jobs/scopes

## **Admin**

* stub o superficie mínima funcional para operar  
* formularios básicos  
* lectura de logs

## **Persistencia**

* `resultIngestionLogs`  
* `adminActions`  
* uso consistente de `matchScoringLogs`  
* uso consistente de `macroScoringLogs`

## **Testing / Ops**

* seeds  
* scripts  
* tests unit/integration/flow  
* README operativo