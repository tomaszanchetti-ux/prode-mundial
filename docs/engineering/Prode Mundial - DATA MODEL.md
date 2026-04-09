# **Prode Mundial \- DATA MODEL.md**

## **1\. Propósito del documento**

Este documento define el **modelo de datos canónico** del MVP de Prode Mundial.

Su objetivo es:

* establecer entidades, relaciones y cardinalidades oficiales  
* definir qué campos son obligatorios, opcionales y derivados  
* cerrar constraints, unicidades e índices recomendados  
* separar con claridad:  
  * datos persistidos  
  * datos derivados  
  * read models materializados  
* darle a Codex una fuente de verdad limpia para implementar persistencia, queries, contratos y validaciones sin reinterpretar documentos híbridos

Este documento responde al gap marcado en el documento de “requeridos para ejecución”: el proyecto ya tenía cobertura funcional fuerte, pero todavía necesitaba un `DATA_MODEL.md` dedicado y canónico para entidades, constraints, índices, snapshots y estrategia de recálculo.

---

## **2\. Alcance y límites**

Este documento **sí define**:

* entidades persistidas  
* relaciones  
* cardinalidades  
* campos  
* constraints  
* índices  
* estados persistidos vs derivados  
* snapshots/read models  
* criterios de integridad de datos

Este documento **no define en detalle**:

* secuencia operativa de jobs  
* lógica paso a paso de scoring  
* orchestration batch  
* admin workflows

Eso debe vivir en un documento separado tipo `SCORING_AND_JOBS.md` o `BACKEND_EXECUTION_MODEL.md`.

---

## **3\. Principios de modelado obligatorios**

### **3.1 Backend source of truth**

La verdad del sistema vive en backend \+ persistencia.  
El frontend no calcula lógica crítica. Esto ya está alineado con la API spec, que exige que la API devuelva estados interpretables como `isEditable`, `isLocked`, `isScored` y `adjustmentAvailable`.

### **3.2 Write optimized \+ read simple**

El modelo privilegia lecturas simples y payloads claros, aunque eso implique denormalización controlada y read models materializados. Este principio ya estaba explícito en el spec técnico existente.

### **3.3 Event-driven, no realtime continuo**

Los datos relevantes se recalculan cuando importa:

* fin de partido  
* cierre de fase  
* ajuste confirmado  
* recálculo admin

No se modela ranking global ni recomputación constante.

### **3.4 MVP sin ranking global**

El modelo de datos del MVP **no contempla leaderboard global materializado**.  
La competencia visible se limita a:

* standings por liga  
* posición del usuario dentro de cada liga  
* puntos personales  
* resumen de puntos recientes.

### **3.5 Idempotencia first**

Todo dato de scoring y ranking debe poder recomponerse sin duplicar puntos. Esto ya está definido como requisito funcional y técnico.

---

## **4\. Entidades oficiales del MVP**

El modelo canónico del MVP se compone de estas entidades principales:

1. `users`  
2. `teams`  
3. `groups`  
4. `matches`  
5. `predictions`  
6. `macroPredictions`  
7. `leagues`  
8. `leagueMembers`  
9. `leagueStandings`  
10. `matchScoringLogs`  
11. `macroScoringLogs`  
12. opcionales mínimos de soporte:  
* `resultIngestionLogs`  
* `adminActions`

Las entidades 1, 4, 5, 6, 7, 8, 9 y 10 ya aparecen directa o implícitamente en el Data Model previo y en los contratos de API. `teams` y `groups` se vuelven entidades canónicas separadas en esta versión porque el sistema necesita referenciar equipos y grupos de forma consistente desde matches, picks macro y vistas del torneo.

---

## **5\. Convenciones globales del modelo**

### **5.1 IDs**

Todos los IDs son strings opacos.

Ejemplos:

* `userId`  
* `teamId`  
* `groupId`  
* `matchId`  
* `leagueId`  
* `membershipId`  
* `predictionId`

Esto está alineado con la API pública.

### **5.2 Timestamps**

Todos los timestamps persistidos deben guardarse en UTC.

### **5.3 Nullability**

Cuando un dato aún no aplica, usar `null`.  
No usar strings especiales tipo `"pending"` para reemplazar null si el campo representa ausencia de valor.

### **5.4 Soft vs hard deletion**

En MVP, preferir:

* desactivación  
* archivado  
* flags de estado

Evitar borrados físicos si afectan trazabilidad.

---

## **6\. Entidad `users`**

### **6.1 Propósito**

Representa al usuario autenticado que participa en el juego.

### **6.2 Collection**

`users/{userId}`

### **6.3 Shape canónico**

{  
  userId: string  
  displayName: string  
  email: string  
  country: string | null  
  photoUrl: string | null

  totalPoints: number  
  macroPoints: number  
  exactHits: number  
  correctSigns: number

  profileCompleted: boolean

  createdAt: timestamp  
  updatedAt: timestamp  
}

### **6.4 Campos obligatorios**

* `userId`  
* `displayName`  
* `email`  
* `totalPoints`  
* `macroPoints`  
* `exactHits`  
* `correctSigns`  
* `profileCompleted`  
* `createdAt`  
* `updatedAt`

### **6.5 Campos opcionales**

* `country`  
* `photoUrl`

### **6.6 Constraints**

* `displayName` requerido para aparecer en rankings/ligas  
* `email` único por proveedor de auth lógico  
* `totalPoints >= 0`  
* `macroPoints >= 0`  
* `exactHits >= 0`  
* `correctSigns >= 0`

### **6.7 Notas**

El spec previo ya definía `total_points` y `macro_points`; esta versión canónica agrega `exactHits` y `correctSigns` al agregado personal para alinear mejor user profile, desempates y lectura rápida desde API sin recomputar. Los desempates por exactos, signos y macro ya están definidos en functional/API/read models.

---

## **7\. Entidad `teams`**

### **7.1 Propósito**

Fuente normalizada de selecciones/equipos del torneo.

### **7.2 Collection**

`teams/{teamId}`

### **7.3 Shape canónico**

{  
  teamId: string  
  fifaCode: string  
  name: string  
  shortName: string  
  flagUrl: string | null  
  groupId: string | null

  isActive: boolean

  createdAt: timestamp  
  updatedAt: timestamp  
}

### **7.4 Campos obligatorios**

* `teamId`  
* `fifaCode`  
* `name`  
* `shortName`  
* `isActive`  
* `createdAt`  
* `updatedAt`

### **7.5 Campos opcionales**

* `flagUrl`  
* `groupId`

### **7.6 Constraints**

* `fifaCode` único  
* `groupId` debe existir si no es null

### **7.7 Notas**

Aunque en los documentos previos los equipos aparecen embebidos o referenciados por ID, para implementación limpia el sistema necesita una entidad estable de equipos porque:

* matches referencian home/away team  
* picks macro usan team IDs  
* champion/finalists dependen de equipos  
* la UI muestra nombres/banderas de forma repetida.

---

## **8\. Entidad `groups`**

### **8.1 Propósito**

Representa los grupos del torneo para fase inicial.

### **8.2 Collection**

`groups/{groupId}`

### **8.3 Shape canónico**

{  
  groupId: string  
  name: string // "A", "B", etc.  
  teamIds: string\[\]  
  isClosed: boolean

  createdAt: timestamp  
  updatedAt: timestamp  
}

### **8.4 Campos obligatorios**

* `groupId`  
* `name`  
* `teamIds`  
* `isClosed`  
* `createdAt`  
* `updatedAt`

### **8.5 Constraints**

* `teamIds.length` esperado \= 4 en formato mundial estándar  
* no duplicados dentro de `teamIds`  
* todos los `teamIds` deben existir

### **8.6 Notas**

El functional spec y macro predictions dependen de que cada grupo tenga 1° y 2° predichos; por eso conviene que `groups` exista como entidad canónica y no solo como string arbitrario.

---

## **9\. Entidad `matches`**

### **9.1 Propósito**

Representa cada partido oficial del torneo y su resultado fuente de verdad interna.

### **9.2 Collection**

`matches/{matchId}`

### **9.3 Shape canónico**

{  
  matchId: string

  stage: "group" | "R16" | "QF" | "SF" | "FINAL"  
  groupId: string | null

  homeTeamId: string  
  awayTeamId: string

  kickoffAt: timestamp  
  status: "scheduled" | "live" | "finished" | "corrected"

  homeScore90: number | null  
  awayScore90: number | null  
  winnerTeamId: string | null

  isLocked: boolean  
  isScored: boolean

  sourceProvider: string | null  
  sourceLastSyncedAt: timestamp | null

  createdAt: timestamp  
  updatedAt: timestamp  
}

### **9.4 Campos obligatorios**

* `matchId`  
* `stage`  
* `homeTeamId`  
* `awayTeamId`  
* `kickoffAt`  
* `status`  
* `isLocked`  
* `isScored`  
* `createdAt`  
* `updatedAt`

### **9.5 Campos opcionales**

* `groupId`  
* `homeScore90`  
* `awayScore90`  
* `winnerTeamId`  
* `sourceProvider`  
* `sourceLastSyncedAt`

### **9.6 Constraints**

* `homeTeamId !== awayTeamId`  
* si `stage === "group"`, `groupId` requerido  
* si `stage !== "group"`, `groupId = null`  
* si `status === "finished" || status === "corrected"`, entonces:  
  * `homeScore90 !== null`  
  * `awayScore90 !== null`  
  * `winnerTeamId !== null` en knockout  
* `isScored = true` solo si el resultado ya fue procesado por scoring  
* `isLocked = true` cuando `now >= kickoffAt` o admin lo fuerce

### **9.7 Notas**

El spec técnico previo ya definía `matches` con `stage`, `home_team_id`, `away_team_id`, `kickoff_at`, `status`, `home_score_90`, `away_score_90`, `winner_team_id` e `is_scored`. Esta versión canónica agrega `isLocked` porque API/UX lo tratan como estado clave de lectura y evita depender exclusivamente de cálculo dinámico.

---

## **10\. Entidad `predictions` (match-level)**

### **10.1 Propósito**

Guarda la predicción de un usuario para un partido.

### **10.2 Collection**

`predictions/{predictionId}`

### **10.3 Shape canónico**

{  
  predictionId: string

  userId: string  
  matchId: string

  homeScorePred: number  
  awayScorePred: number  
  predictedWinnerTeamId: string | null

  isLocked: boolean  
  isScored: boolean

  pointsAwarded: number  
  scoringBreakdown: {  
    exact90Points: number  
    outcome90Points: number  
    qualifierPoints: number  
    totalPoints: number  
  } | null

  createdAt: timestamp  
  updatedAt: timestamp  
  lockedAt: timestamp | null  
  scoredAt: timestamp | null  
}

### **10.4 Campos obligatorios**

* `predictionId`  
* `userId`  
* `matchId`  
* `homeScorePred`  
* `awayScorePred`  
* `isLocked`  
* `isScored`  
* `pointsAwarded`  
* `createdAt`  
* `updatedAt`

### **10.5 Campos opcionales**

* `predictedWinnerTeamId`  
* `scoringBreakdown`  
* `lockedAt`  
* `scoredAt`

### **10.6 Constraints**

* único por `(userId, matchId)`  
* scores enteros `>= 0`  
* si el partido es knockout y `homeScorePred === awayScorePred`, `predictedWinnerTeamId` es obligatorio  
* si el partido es knockout y `homeScorePred !== awayScorePred`, `predictedWinnerTeamId` debe ser `null`  
* si `isScored = true`, entonces `pointsAwarded >= 0`  
* `lockedAt` se setea cuando la predicción deja de ser editable

### **10.7 Notas**

Las reglas de knockout y validación vienen del functional spec, mientras que `is_locked`, `points_awarded` e `is_scored` ya estaban en el data model anterior. La API también trata estas banderas como parte del contrato clave.

---

## **11\. Entidad `macroPredictions`**

### **11.1 Propósito**

Guarda las predicciones macro de un usuario para el torneo.

### **11.2 Collection**

`macroPredictions/{userId}`

### **11.3 Shape canónico**

{  
  userId: string

  groupPicks: {  
    \[groupId: string\]: {  
      firstTeamId: string  
      secondTeamId: string  
    }  
  }

  finalists: \[string, string\] | null  
  champion: string | null

  isLocked: boolean  
  isSubmitted: boolean

  isAdjusted: boolean  
  adjustedAt: timestamp | null

  adjustedFinalists: \[string, string\] | null  
  adjustedChampion: string | null

  createdAt: timestamp  
  updatedAt: timestamp  
  lockedAt: timestamp | null  
}

### **11.4 Campos obligatorios**

* `userId`  
* `groupPicks`  
* `isLocked`  
* `isSubmitted`  
* `isAdjusted`  
* `createdAt`  
* `updatedAt`

### **11.5 Campos opcionales**

* `finalists`  
* `champion`  
* `adjustedAt`  
* `adjustedFinalists`  
* `adjustedChampion`  
* `lockedAt`

### **11.6 Constraints**

* un documento por usuario  
* para cada grupo cargado:  
  * `firstTeamId !== secondTeamId`  
* si `finalists` existe:  
  * longitud exacta \= 2  
  * sin repetidos  
* si `champion` existe:  
  * debe pertenecer a `finalists`  
* si `isAdjusted = true`:  
  * `adjustedAt` requerido  
  * `adjustedFinalists` y/o `adjustedChampion` deben existir  
* `adjustedChampion` debe pertenecer a `adjustedFinalists`  
* solo elegible a ajuste si hubo picks iniciales válidos antes del lock

### **11.7 Notas**

El documento técnico previo ya tenía `group_picks`, `finalists`, `champion`, `is_locked`, `is_adjusted`, `adjusted_finalists` y `adjusted_champion`. Esta versión agrega `isSubmitted`, `lockedAt` y separación más explícita entre carga inicial y ajuste porque el functional spec dice que puede haber draft parcial, cierre por kickoff del torneo y ajuste único/irreversible post grupos.

---

## **12\. Entidad `leagues`**

### **12.1 Propósito**

Representa una liga privada/social creada por usuarios.

### **12.2 Collection**

`leagues/{leagueId}`

### **12.3 Shape canónico**

{  
  leagueId: string  
  name: string

  ownerUserId: string
  memberLimit: 20

  inviteCode: string  
  inviteToken: string  
  inviteLink: string | null

  isActive: boolean  
  archivedAt: timestamp | null

  createdAt: timestamp  
  updatedAt: timestamp  
}

### **12.4 Campos obligatorios**

* `leagueId`  
* `name`  
* `ownerUserId`  
* `memberLimit`
* `inviteCode`  
* `inviteToken`  
* `isActive`  
* `createdAt`  
* `updatedAt`

### **12.5 Campos opcionales**

* `inviteLink`  
* `archivedAt`

### **12.6 Constraints**

* `name` requerido  
* `memberLimit = 20` en todo el MVP  
* `inviteCode` único  
* `inviteToken` único  
* `ownerUserId` debe existir  
* `archivedAt` solo si `isActive = false`

### **12.7 Notas**

Los contratos API ya exponen `inviteCode`, `inviteLink`, `ownerUserId`, `isActive` y creación de liga por nombre. En el MVP operativo solo se sostiene `memberLimit = 20`; planes pagos, billing y branding premium quedan explícitamente post-MVP.

---

## **13\. Entidad `leagueMembers`**

### **13.1 Propósito**

Vincula usuarios con ligas.

### **13.2 Collection**

`leagueMembers/{membershipId}`

### **13.3 Shape canónico**

{  
  membershipId: string  
  leagueId: string  
  userId: string

  role: "owner" | "member"

  joinedAt: timestamp  
}

### **13.4 Campos obligatorios**

* `membershipId`  
* `leagueId`  
* `userId`  
* `role`  
* `joinedAt`

### **13.5 Constraints**

* único por `(leagueId, userId)`  
* `role = "owner"` solo para el creador de la liga  
* toda liga debe tener al menos un membership owner  
* no permitir duplicados de usuario dentro de misma liga

### **13.6 Notas**

El modelo previo tenía `league_members/{membershipId}` con `league_id`, `user_id` y `joined_at`, y marcaba explícitamente el índice `(league_id, user_id)`. El blueprint también había sugerido un `role`, por lo que conviene canonizarlo desde ahora aunque el MVP no tenga roles avanzados.

---

## **14\. Entidad `leagueStandings` (read model crítico)**

### **14.1 Propósito**

Representa la tabla materializada de cada liga.

### **14.2 Path**

`leagueStandings/{leagueId}/table/{userId}`

### **14.3 Shape canónico**

{  
  leagueId: string  
  userId: string

  displayName: string

  totalPoints: number  
  exactHits: number  
  correctSigns: number  
  macroPoints: number

  position: number | null  
  isOwner: boolean

  lastUpdatedAt: timestamp  
  lastPointArrivalAt: timestamp | null  
}

### **14.4 Campos obligatorios**

* `leagueId`  
* `userId`  
* `displayName`  
* `totalPoints`  
* `exactHits`  
* `correctSigns`  
* `macroPoints`  
* `isOwner`  
* `lastUpdatedAt`

### **14.5 Campos opcionales**

* `position`  
* `lastPointArrivalAt`

### **14.6 Constraints**

* un documento por `(leagueId, userId)`  
* `displayName` debe reflejar snapshot del nombre visible actual o vigente al recalcular  
* métricas no negativas  
* `position` puede persistirse o calcularse durante rebuild según estrategia elegida

### **14.7 Notas**

El spec previo ya define `league_standings/{leagueId}/table/{userId}` como el read model principal, con `total_points`, `exact_hits`, `correct_signs`, `macro_points` y `last_updated_at`. La API también lo usa como base para ranking interno de liga y `myStanding`.

---

## **15\. Entidad `matchScoringLogs`**

### **15.1 Propósito**

Trazabilidad e idempotencia para scoring de partido.

### **15.2 Collection**

`matchScoringLogs/{matchId}`

### **15.3 Shape canónico**

{  
  matchId: string

  scoredAt: timestamp  
  totalPredictionsProcessed: number

  checksum: string  
  scoringVersion: string

  resultSnapshot: {  
    homeScore90: number  
    awayScore90: number  
    winnerTeamId: string | null  
    stage: string  
  }  
}

### **15.4 Campos obligatorios**

* `matchId`  
* `scoredAt`  
* `totalPredictionsProcessed`  
* `checksum`  
* `scoringVersion`

### **15.5 Notas**

El documento técnico previo ya definía esta entidad con `match_id`, `scored_at`, `total_predictions_processed` y `checksum`. Esta versión canónica agrega `scoringVersion` y `resultSnapshot` para facilitar debugging y correcciones futuras.

---

## **16\. Entidad `macroScoringLogs`**

### **16.1 Propósito**

Trazabilidad e idempotencia del scoring macro.

### **16.2 Collection**

`macroScoringLogs/{eventId}`

### **16.3 Shape canónico**

{  
  eventId: string // ej: "group-stage-closed", "tournament-finished"

  scoredAt: timestamp  
  totalUsersProcessed: number

  checksum: string  
  scoringVersion: string

  scope: "group-stage" | "finalists" | "champion" | "full-macro"  
}

### **16.4 Justificación**

El spec previo menciona triggers de macro scoring al fin de fase de grupos y fin de torneo, pero no separa un log específico. Conviene canonizarlo porque el MVP depende de recalcular macro points y standings sin duplicaciones.

---

## **17\. Entidades opcionales mínimas de soporte**

Estas no son core para producto, pero sí útiles para una implementación más robusta del MVP.

### **17.1 `resultIngestionLogs`**

Para registrar cuándo se sincronizó/corrigió un resultado oficial.

### **17.2 `adminActions`**

Para dejar trazabilidad mínima de:

* corrección de partido  
* unlock/lock manual  
* recálculo manual  
* archivado de liga

La API spec ya prevé operación admin para corregir fixtures/resultados, recálculos, lock/unlock y jobs/logs mínimos.

---

## **18\. Relaciones canónicas**

### **18.1 User → Predictions**

* 1 user puede tener N predictions  
* 1 prediction pertenece a 1 user

### **18.2 User → MacroPredictions**

* 1 user tiene 0 o 1 macroPredictions

### **18.3 User → LeagueMembers**

* 1 user puede pertenecer a N ligas  
* 1 membership pertenece a 1 user

### **18.4 League → LeagueMembers**

* 1 league tiene N memberships  
* 1 membership pertenece a 1 league

### **18.5 League → LeagueStandings**

* 1 league tiene N rows materializadas  
* 1 row de standings pertenece a 1 league y 1 user

### **18.6 Match → Predictions**

* 1 match puede tener N predictions  
* 1 prediction pertenece a 1 match

### **18.7 Group → Teams**

* 1 group tiene N teams  
* 1 team pertenece a 0 o 1 group

### **18.8 Group → MacroPredictions**

* un macro prediction contiene picks para múltiples groups

Estas relaciones ya estaban presentes de forma parcial en el spec previo, que explicitaba user → predictions, user → macro\_predictions, user → memberships, league → standings y match → predictions.

---

## **19\. Cardinalidades oficiales**

| Relación | Cardinalidad |
| ----- | ----- |
| User → Prediction | 1:N |
| Match → Prediction | 1:N |
| User → MacroPrediction | 1:0..1 |
| League → LeagueMember | 1:N |
| User → LeagueMember | 1:N |
| League → LeagueStandingRow | 1:N |
| User → LeagueStandingRow | 1:N |
| Group → Team | 1:N |
| Team → Match (home/away) | 1:N |

---

## **20\. Constraints de negocio críticos**

### **20.1 Predicción única por usuario por partido**

No puede haber más de una prediction por `(userId, matchId)`.

### **20.2 Liga única por membership**

No puede haber más de una membership por `(leagueId, userId)`.

### **20.3 Sin ranking global**

No crear ninguna entidad tipo:

* `globalStandings`  
* `globalLeaderboard`  
* `userGlobalRank`  
* `top100Snapshots`

Esto quedó expresamente fuera del MVP.

### **20.4 Knockout classifier**

Si el usuario predice empate en knockout, debe informar clasificado.  
Si no hay empate, no debe persistirse clasificado adicional.

### **20.5 Macro picks**

* no repetir equipos en 1° y 2° del mismo grupo  
* no repetir finalistas  
* champion debe pertenecer a finalists  
* adjustedChampion debe pertenecer a adjustedFinalists.

### **20.6 Locks**

* prediction editable solo antes de kickoff  
* macro editable solo antes de kickoff del torneo  
* adjustment editable solo dentro de su ventana oficial.

### **20.7 Puntajes**

No permitir valores negativos en acumulados, breakdowns ni counters.

---

## **21\. Índices recomendados**

El spec previo ya sugería índices Firestore para:

* predictions by `match_id`  
* league\_members by `user_id`  
* standings by `league_id + total_points`.

Esta versión canónica recomienda:

### **21.1 `predictions`**

* `(matchId)`  
* `(userId)`  
* `(userId, matchId)` único lógico  
* `(matchId, isScored)` opcional para jobs

### **21.2 `matches`**

* `(kickoffAt)`  
* `(status, kickoffAt)`  
* `(stage, kickoffAt)`

### **21.3 `leagueMembers`**

* `(leagueId, userId)` único lógico  
* `(userId)`  
* `(leagueId)`

### **21.4 `leagueStandings/{leagueId}/table`**

* orden por:  
  * `totalPoints DESC`  
  * `exactHits DESC`  
  * `correctSigns DESC`  
  * `macroPoints DESC`  
  * `lastPointArrivalAt ASC`  
  * `userId ASC` como fallback técnico estable

Los criterios de desempate vienen del functional spec: puntos totales, más exactos, más signos correctos, más puntos macro, menor timestamp de llegada a ese puntaje y `user_id` como fallback estable.

### **21.5 `macroPredictions`**

* colección keyed por `userId`; no requiere índice complejo en MVP

---

## **22\. Persistidos vs derivados**

## **22.1 Persistidos**

Deben persistirse sí o sí:

* users aggregates  
* match result source of truth  
* predictions  
* macro predictions  
* leagues  
* memberships  
* league standings rows  
* scoring logs  
* locks

## **22.2 Derivados**

Pueden derivarse al vuelo si hace falta:

* `canJoin`  
* `isMember`  
* `predictionStatus`  
* `adjustmentAvailable`  
* cards/resúmenes UX

La API spec ya exige que estos estados se devuelvan resueltos, aunque no todos requieran columna propia.

## **22.3 Materializados**

Conviene materializar:

* standings por liga  
* agregados por usuario  
* recent scored matches si el endpoint lo requiere mucho  
* league summary para home si el costo lo justifica

El cambio de lógica y el spec técnico insisten en evitar joins, queries complejas y recomputación de rankings en runtime.

---

## **23\. Snapshots recomendados**

### **23.1 Resultado de partido en scoring log**

Guardar snapshot del resultado procesado.

### **23.2 Breakdown de scoring por prediction**

Guardar breakdown dentro de `predictions` para explicar puntos luego en UI/admin.

### **23.3 Standing row snapshot mínimo**

`leagueStandings` ya funciona como snapshot vigente de cada usuario dentro de cada liga.

### **23.4 Recent points snapshot**

No obligatorio como entidad separada en v1, pero sí puede resolverse con datos de `predictions.scoredAt` \+ `pointsAwarded` o una vista denormalizada si hiciera falta para `/me/points`. La API ya contempla “recentScoredMatches”.

---

## **24\. Estrategia de recálculo — implicancias para el modelo**

Este documento no define jobs en detalle, pero el modelo debe permitir:

* recalcular un partido sin duplicar puntos  
* recalcular macro scoring en hitos del torneo  
* recomponer standings por liga  
* reparar una corrección manual de resultado

Eso es consistente con el spec previo de rebuild manual, logs anti-bugs e idempotencia.

### **Requisito de diseño**

Ninguna entidad core debe impedir:

* revertir un scoring previo  
* re-aplicar scoring corregido  
* reconstruir standings desde datos persistidos

---

## **25\. Seguridad y ownership a nivel modelo**

### **25.1 Users**

Cada usuario solo edita su propio perfil.

### **25.2 Predictions**

Solo el owner puede escribir/editar su prediction antes del lock.

### **25.3 MacroPredictions**

Solo el owner puede editar dentro de ventana válida.

### **25.4 LeagueStandings**

Read-only desde frontend.

### **25.5 Admin**

Puede corregir resultados, recálculos y ligas según endpoints protegidos.

Esto ya estaba contemplado en el spec técnico y en la API.

---

## **26\. Edge cases que el modelo debe tolerar**

### **26.1 Usuario sin prediction**

No crear documento vacío innecesario. Este caso ya estaba explicitado como edge case técnico.

### **26.2 Partido corregido**

El match puede pasar a `corrected` y gatillar recálculo completo. El spec previo ya contempla corrección y rebuild manual.

### **26.3 Doble ejecución de job**

Se resuelve con `isScored` \+ logs \+ checksum, no creando estructuras paralelas.

### **26.4 Usuario cambia displayName**

Debe impactar en:

* `users.displayName`  
* futuras lecturas de standings  
  y, si se decide snapshot actualizado, en `leagueStandings.displayName` durante recálculo o sync controlado.

### **26.5 Liga archivada**

Se mantiene el histórico, pero `isActive = false` impide joins nuevos.

---

## **27\. Colecciones que NO deben existir en MVP**

Para proteger foco y evitar contaminación del modelo:

* `globalStandings`  
* `top100`  
* `leaderboardWindows`  
* `chatMessages`  
* `notificationCampaigns`  
* `fantasyTeams`  
* `bets`  
* `rewardsWallet`  
* `socialProfilesAdvanced`

Todo eso está fuera del alcance del MVP o explícitamente removido por la simplificación costo-eficiente.

---

## **28\. Resumen ejecutivo para Codex**

### **Modelo mínimo obligatorio del MVP**

* users  
* teams  
* groups  
* matches  
* predictions  
* macroPredictions  
* leagues  
* leagueMembers  
* leagueStandings  
* scoringLogs

### **Principios**

* sin ranking global  
* standings por liga materializados  
* agregados de usuario persistidos  
* scoring idempotente  
* read models simples  
* constraints explícitos

### **Regla final**

Si una implementación requiere crear una nueva entidad core, debe justificarse contra este documento.  
Si no mejora claridad, integridad o costo operativo del MVP, no debería agregarse.

---
