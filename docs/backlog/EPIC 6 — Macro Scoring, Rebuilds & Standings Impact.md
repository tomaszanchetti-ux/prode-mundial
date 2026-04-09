# **EPIC 6 — Macro Scoring, Rebuilds & Standings Impact**

---

# **1\. Propósito de la épica**

Activar el **motor de scoring macro completo**, conectando:

**macro predictions → puntos → usuario → standings de liga**

Esta épica cierra el gap explícito dejado en EPIC 5 (macro jugable pero sin scoring) y completa el loop:

picks macro → resultado real → scoring → impacto competitivo en ligas

Todo respetando:

* backend como source of truth  
* modelo batch/event-driven  
* idempotencia obligatoria  
* sin ranking global  
* standings solo por liga

---

# **2\. Objetivos funcionales**

## **Usuario**

Debe poder:

1. recibir puntos por:  
   * grupos  
   * finalistas  
   * campeón  
2. ver impacto en:  
   * `macroPoints`  
   * `totalPoints`  
3. ver reflejado automáticamente en:  
   * standings de ligas  
4. entender penalización si ajustó

---

## **Sistema**

Debe:

1. evaluar picks macro contra resultados oficiales  
2. aplicar reglas de scoring:  
   * grupo  
   * finalistas  
   * campeón  
3. aplicar penalización si `isAdjusted = true`  
4. persistir:  
   * `macroScoringLogs`  
   * aggregates en `users`  
5. recalcular standings afectados  
6. permitir rebuild completo idempotente

---

# **3\. Alcance**

## **Incluido**

### **Scoring macro completo**

* grupos (1° / 2°)  
* finalistas  
* campeón  
* penalización por ajuste

### **Persistencia**

* `macroScoringLogs`  
* actualización de:  
  * `users.macroPoints`  
  * `users.totalPoints`

### **Impacto en standings**

* recalculo de `leagueStandings`

### **Jobs**

* macro scoring job  
* rebuild macro scoring job  
* rebuild standings job (trigger)

### **Rebuilds**

* idempotentes  
* re-ejecutables

---

## **No incluido**

* cambios en scoring rules  
* nuevas mecánicas  
* UI avanzada explicativa  
* notificaciones

---

# **4\. Resultado esperado (flujo demo)**

1. termina fase de grupos → se conocen clasificados  
2. termina final → campeón definido  
3. se ejecuta job macro scoring  
4. usuario entra a app  
5. ve:  
   * puntos macro ganados  
   * totalPoints actualizado  
6. entra a liga  
7. ve cambio de posición

---

# **5\. Dependencias**

* EPIC 3 (scoring base \+ standings)  
* EPIC 5 (macroPredictions)  
* DATA MODEL (`macroScoringLogs`, `users`, `leagueStandings`)  
* API SPEC (read models)  
* TECH DECISIONS (jobs \+ idempotencia)

---

# **6\. Definition of Done**

* macro scoring ejecuta correctamente  
* scoring es idempotente  
* `macroScoringLogs` persistidos  
* `users.macroPoints` correcto  
* `users.totalPoints` actualizado  
* standings recalculados  
* jobs re-ejecutables sin duplicar  
* tests completos  
* endpoints reflejan datos correctos

---

# **7\. CARDS EJECUTABLES**

---

# **CARD 1 — Shared Contracts: Macro Scoring**

## **Objetivo**

Definir contratos en `packages/shared`

---

## **Types**

MacroScoringBreakdown \= {  
  groupPoints: number  
  finalistsPoints: number  
  championPoints: number  
  adjustmentPenaltyApplied: boolean  
  totalPoints: number  
}

MacroScoringLog \= {  
  userId: string  
  tournamentId: string  
  breakdown: MacroScoringBreakdown  
  createdAt: string  
}

---

## **Acceptance Criteria**

* tipos usados por API \+ jobs  
* no duplicación

---

# **CARD 2 — Domain Logic: Macro Scoring Engine**

## **Objetivo**

Implementar scoring puro

---

## **Inputs**

* `macroPredictions`  
* resultados oficiales:  
  * grupos (ranking final)  
  * finalistas  
  * campeón

---

## **Reglas**

### **Grupos**

* exacto (1° y 2° correctos): \+10  
* clasificados correctos, orden invertido: \+5

### **Finalistas**

* correcto: \+10  
* si ajustado: \+5

### **Campeón**

* correcto: \+25  
* si ajustado: \+12

(usar valores de API spec)

---

## **Penalización**

if (isAdjusted) {  
  usar adjustedFinalistPoints y adjustedChampionPoints  
}

---

## **Output**

* `MacroScoringBreakdown`

---

## **Tasks**

### **Task 2.1**

Implement `scoreGroupPicks()`

### **Task 2.2**

Implement `scoreFinalists()`

### **Task 2.3**

Implement `scoreChampion()`

### **Task 2.4**

Implement `applyAdjustmentPenalty()`

### **Task 2.5**

Compose `computeMacroScore()`

---

## **Acceptance**

* determinístico  
* sin side effects  
* testeable aislado

---

# **CARD 3 — Persistence: macroScoringLogs**

## **Objetivo**

Persistir resultados

---

## **Collection**

macroScoringLogs/{userId}\_{tournamentId}

---

## **Shape**

{  
  userId  
  tournamentId  
  totalPoints  
  breakdown  
  isAdjusted  
  createdAt  
}

---

## **Idempotencia**

* overwrite seguro  
* no duplicación

---

## **Tasks**

* upsert log  
* índice por userId

---

## **Acceptance**

* múltiples ejecuciones no duplican

---

# **CARD 4 — Users Aggregates Update**

## **Objetivo**

Actualizar usuario

---

## **Campos**

* `users.macroPoints`  
* `users.totalPoints`

---

## **Regla**

totalPoints \= matchPoints \+ macroPoints

---

## **Tasks**

### **Task 4.1**

leer estado previo

### **Task 4.2**

restar macro anterior (si existe)

### **Task 4.3**

sumar nuevo macro

---

## **Idempotencia**

* recalculo completo  
* no acumulativo incremental

---

## **Acceptance**

* consistencia garantizada

---

# **CARD 5 — Standings Impact Trigger**

## **Objetivo**

Disparar rebuild de standings

---

## **Trigger**

* después de actualizar usuarios

---

## **Scope**

* solo ligas donde participa el usuario

---

## **Tasks**

* obtener memberships  
* enqueue job standings

---

## **Acceptance**

* standings reflejan macroPoints

---

# **CARD 6 — Job: Macro Scoring Execution**

## **Objetivo**

Job batch principal

---

## **Input**

* tournamentId

---

## **Flow**

for each user:  
  load macroPrediction  
  compute score  
  persist log  
  update user  
trigger standings rebuild

---

## **Idempotencia**

* safe retry  
* sin duplicar

---

## **Acceptance**

* ejecución completa  
* logs generados

---

# **CARD 7 — Job: Macro Rebuild (Full)**

## **Objetivo**

Recalculo total

---

## **Flow**

clear macroScoringLogs  
recompute all users  
rebuild all standings

---

## **Use cases**

* corrección de datos  
* fallback

---

## **Acceptance**

* mismo resultado siempre

---

# **CARD 8 — API Read Models Impact**

## **Objetivo**

Actualizar endpoints existentes

---

## **Afectados**

* `/api/v1/points`  
* `/api/v1/leagues/:leagueId/standings`  
* `/api/v1/home`

---

## **Cambios**

* incluir `macroPoints`  
* incluir breakdown opcional

---

## **Regla**

* backend devuelve estado final  
* frontend no calcula

---

## **Acceptance**

* datos consistentes

---

# **CARD 9 — Tests**

---

## **Unit**

* scoring grupos  
* scoring finalistas  
* scoring campeón  
* penalización

---

## **Integration**

* job completo  
* persistencia  
* aggregates

---

## **E2E**

* scoring → standings

---

## **Acceptance**

* cobertura crítica completa

---

# **CARD 10 — Seeds & Dev Tools**

---

## **Objetivo**

Permitir testing local

---

## **Incluye**

* resultados mock torneo  
* macroPredictions mock  
* script:

pnpm run job:macro-score

---

## **Acceptance**

* reproducible local

---

# **8\. Riesgos principales**

---

## **1\. Doble conteo**

Mitigación:

* rebuild completo  
* no incremental

---

## **2\. Dependencia de resultados oficiales**

Mitigación:

* fallback manual  
* job re-ejecutable

---

## **3\. Inconsistencia standings**

Mitigación:

* trigger obligatorio post scoring  
* rebuild global disponible

---

## **4\. Penalización incorrecta**

Mitigación:

* tests específicos por adjusted

---

# **9\. Entregables concretos**

* módulo `macro-scoring` completo  
* jobs:  
  * `macro-score`  
  * `macro-rebuild`  
* colección `macroScoringLogs`  
* actualización de `users`  
* integración con standings  
* tests completos  
* scripts dev

---

# **Resultado final**

El sistema queda capaz de:

transformar picks macro en impacto competitivo real dentro de ligas, de forma determinística, idempotente y re-ejecutable