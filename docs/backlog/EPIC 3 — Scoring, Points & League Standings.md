# **EPIC 3 — Scoring, Points & League Standings**

---

# **🧠 1\. Propósito de la épica**

Esta épica activa el **motor de recompensa del producto**:

convertir predicciones en puntos → puntos en ranking → ranking en competencia social

Sin esta épica, el producto no tiene loop de engagement.

---

# **🎯 2\. Objetivos funcionales**

Al finalizar esta épica, el sistema debe permitir que:

### **Usuario:**

1. vea puntos otorgados post-partido  
2. entienda por qué obtuvo esos puntos  
3. vea su acumulado total actualizado  
4. vea su posición dentro de cada liga  
5. vea cambios de posición luego de cada scoring  
6. consulte historial de puntos recientes

### **Sistema:**

1. ingesta resultado oficial  
2. ejecuta scoring determinístico e idempotente  
3. actualiza:  
   * predictions (scoring breakdown)  
   * users (aggregates)  
   * leagueStandings (ranking materializado)  
4. persiste snapshots finales  
5. permite re-ejecución sin duplicar puntos

👉 Todo alineado con:

* modelo event-driven \+ batch  
* backend como source of truth

---

# **📦 3\. Qué entra en esta épica**

## **✅ Incluido**

### **Scoring engine**

* scoring match-level (group \+ knockout)  
* scoring breakdown persistido  
* logs de scoring

### **Points layer**

* acumulado usuario  
* exactHits / correctSigns  
* macroPoints (placeholder si aún no se ejecuta macro scoring)

### **League standings**

* ranking por liga materializado  
* desempates:  
  1. totalPoints  
  2. exactHits  
  3. correctSigns

### **Endpoints nuevos**

* `/points`  
* `/leagues/:leagueId/standings`

### **Jobs**

* score-match job  
* rebuild-standings job

---

## **❌ No incluido**

* scoring macro completo (puede quedar stub-ready)  
* notificaciones  
* badges/gamificación  
* ranking global (explícitamente fuera del MVP)

---

# **🧪 4\. Resultado esperado (flujo demo)**

1. admin ingesta resultado de partido  
2. se ejecuta job de scoring  
3. usuario entra a app  
4. ve:  
   * puntos ganados  
   * breakdown  
5. entra a liga  
6. ve:  
   * nueva posición  
   * variación vs anterior  
7. entra a “mis puntos”  
8. ve historial reciente

👉 Esto cierra el **loop diario de retorno**

---

# **🧩 5\. Dependencias clave**

Esta épica depende directamente de:

* DATA MODEL (predictions, users, leagueStandings)  
* API Spec (contracts de lectura)  
* TECH DECISIONS (jobs \+ batch model)

---

# **✅ 6\. Definition of Done**

La épica está terminada solo si:

* scoring se ejecuta correctamente para:  
  * exact score  
  * outcome  
  * knockout qualifier  
* scoring es idempotente  
* predictions quedan con:  
  * `pointsAwarded`  
  * `scoringBreakdown`  
* users actualizan:  
  * `totalPoints`  
  * `exactHits`  
  * `correctSigns`  
* standings:  
  * se recalculan correctamente  
  * se persisten (no on-demand)  
* endpoints:  
  * `/points` funciona  
  * `/leagues/:id/standings` funciona  
* jobs:  
  * pueden re-ejecutarse sin duplicar  
* UI:  
  * muestra puntos \+ ranking sin lógica client-side

---

# **🧱 7\. CARDS (ejecutables para Codex)**

---

# **CARD 1 — Shared Contracts: Scoring & Standings**

## **Objetivo**

Extender `packages/shared` para scoring y rankings.

## **Definir:**

### **Types**

UserPointsSummary {  
  totalPoints: number  
  macroPoints: number  
  exactHits: number  
  correctSigns: number  
}

MatchScoringBreakdown {  
  exact90Points: number  
  outcome90Points: number  
  qualifierPoints: number  
  totalPoints: number  
}

LeagueStandingEntry {  
  userId: string  
  displayName: string  
  position: number  
  totalPoints: number  
  exactHits: number  
  correctSigns: number  
}

## **Acceptance**

* frontend/backend usan mismos tipos  
* no duplicación

---

# **CARD 2 — Scoring Domain Logic**

## **Objetivo**

Implementar motor puro de scoring

## **Input**

* match result  
* prediction

## **Output**

* scoring breakdown

## **Reglas**

### **Group**

* exact → 5  
* outcome → 3

### **Knockout**

* exact90  
* outcome90  
* qualifier

## **Constraints**

* determinístico  
* puro (sin side effects)  
* testeable

---

# **CARD 3 — Score Match Job**

## **Objetivo**

Ejecutar scoring por partido

## **Flujo**

1. obtener match finalizado  
2. traer predictions  
3. calcular scoring  
4. actualizar:  
   * predictions  
   * users aggregates  
5. generar logs

## **Idempotencia**

* no duplicar puntos si re-ejecuta

---

# **CARD 4 — Users Aggregates Update**

## **Objetivo**

Actualizar stats de usuario

## **Campos**

* totalPoints  
* exactHits  
* correctSigns

## **Regla**

* recalcular desde delta  
* no confiar en acumulación incremental sin control

---

# **CARD 5 — League Standings Builder**

## **Objetivo**

Materializar ranking por liga

## **Flujo**

1. obtener miembros  
2. leer puntos  
3. ordenar por:  
   * totalPoints DESC  
   * exactHits DESC  
   * correctSigns DESC  
4. asignar posición  
5. persistir snapshot

---

# **CARD 6 — GET /api/v1/points**

## **Objetivo**

Vista de puntos del usuario

## **Response**

{  
  "ok": true,  
  "data": {  
    "totalPoints": 74,  
    "recentMatches": \[  
      {  
        "matchId": "m\_1",  
        "points": 5,  
        "breakdown": {...}  
      }  
    \]  
  }  
}

---

# **CARD 7 — GET /api/v1/leagues/:leagueId/standings**

## **Objetivo**

Ranking completo de liga

## **Response**

{  
  "ok": true,  
  "data": {  
    "leagueId": "lg\_1",  
    "standings": \[  
      {  
        "position": 1,  
        "userId": "...",  
        "points": 80  
      }  
    \]  
  }  
}

---

# **CARD 8 — UI: Points & League Ranking**

## **Objetivo**

### **Points screen**

* total puntos  
* últimos partidos  
* breakdown

### **League screen**

* ranking completo  
* posición del usuario destacada

---

# **🔁 8\. Impacto en el producto**

Esta épica:

👉 activa dopamina (puntos)  
👉 activa competencia (ranking)  
👉 activa retorno (loop diario)

Sin esto, el producto no escala engagement.

---

# **🧭 HANDOFF — Próxima sesión**

## **Estado actual**

* MVP CANON definido  
* Epic 1 cerrada  
* Epic 2 cerrada  
* Epic 3 definida (este doc)

---

## **Próximo paso recomendado**

👉 **EPIC 4 — Leagues (Creation, Join, Management)**

Porque:

* standings sin ligas completas queda incompleto  
* social loop depende de ligas

---

## **Documentos necesarios para continuar**

Para mantener nivel ultra fino, en próxima sesión debemos generar:

### **1\. EPIC 4 — Leagues**

* creación de liga  
* join flow  
* invites  
* membership

### **2\. LEAGUE DOMAIN SPEC**

* reglas completas  
* lifecycle  
* estados

### **3\. INVITE SYSTEM SPEC**

* tokens  
* expiración  
* seguridad

### **4\. STANDINGS EDGE CASES**

* empates  
* recalculaciones  
* ligas vacías

### **5\. BACKEND EXECUTION MODEL (jobs completos)**

* orquestación  
* retries  
* fallbacks

