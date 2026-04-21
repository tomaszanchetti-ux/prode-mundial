# **Prode Mundial \- BACKEND EXECUTION MODEL (Jobs \+ Scoring \+ Orchestration) — MVP v1**

---

# **1\. Propósito del documento**

Este documento define con precisión absoluta:

* cómo se ejecuta el backend en runtime  
* qué jobs existen  
* cuándo se ejecutan  
* qué datos leen y escriben  
* en qué orden ocurren las operaciones  
* cómo se garantiza idempotencia  
* cómo se reconstruye el sistema ante fallos

👉 Es la guía operativa que Codex debe seguir para implementar backend y jobs sin ambigüedad.

---

# **2\. Principios obligatorios**

## **2.1 Event-driven**

El sistema NO es realtime continuo.

Solo reacciona a eventos:

* kickoff  
* fin de partido  
* cierre de fase  
* ajuste confirmado  
* acción admin

👉 Alineado con TECH DECISIONS

---

## **2.2 Batch-first**

Las operaciones críticas se ejecutan en jobs:

* scoring  
* standings  
* macro scoring

NO en requests HTTP.

---

## **2.3 Idempotencia obligatoria**

Todos los jobs deben poder ejecutarse múltiples veces sin:

* duplicar puntos  
* corromper datos  
* generar inconsistencias

---

## **2.4 Backend como única fuente de verdad**

El frontend NO calcula:

* scoring  
* rankings  
* estados críticos

## **2.5 Regla operativa de planes de liga**

La validación de cupos ocurre en backend síncrono, no en jobs:

* `memberLimit = 20` en el MVP operativo  
* `join league` debe rechazar cuando la liga está llena  
* los jobs de scoring y standings no cambian por plan, porque en MVP no hay planes pagos operativos

---

# **3\. Arquitectura de ejecución**

## **3.1 Componentes**

* API (Cloud Run)  
* Jobs (Cloud Run Jobs)  
* Scheduler (Cloud Scheduler)  
* Firestore (DB)

---

## **3.2 Tipos de ejecución**

| Tipo | Trigger |
| ----- | ----- |
| Scheduled | Cloud Scheduler |
| Event-driven | API/Admin |
| Manual | Admin |

---

# **4\. Catálogo de jobs**

---

## **4.1 Job: Match Lock Enforcement**

### **Objetivo**

Asegurar que todos los partidos pasen a estado locked correctamente.

### **Trigger**

* cada 1 minuto (scheduler)

### **Lógica**

FOR each match WHERE:  
now \>= kickoff AND status \= scheduled

→ set:  
status \= live OR locked (según provider)

→ ensure:  
predictions.is\_locked \= true

---

## **4.2 Job: Result Ingestion**

### **Objetivo**

Ingestar resultado oficial del partido.

### **Trigger**

* webhook externo O admin manual

### **Input**

* matchId  
* score90  
* winner

### **Output**

* update matches:  
  * status \= finished  
  * scores  
  * winner\_team\_id

---

## **4.3 Job: Match Scoring (CRÍTICO)**

### **Objetivo**

Calcular puntos de todos los usuarios para un partido.

---

## **Trigger**

* match.status \= finished  
* match.is\_scored \= false

---

## **Input**

* match  
* predictions for match

---

## **Proceso**

FOR each prediction:

1. calcular puntos:  
   * exact score  
   * correct sign  
   * knockout qualifier (si aplica)  
2. actualizar prediction:  
   * points\_awarded  
   * is\_scored \= true  
3. acumular en memoria:  
   * user\_total\_points\_delta  
   * stats (exactHits, correctSigns)

---

## **Post-loop**

FOR each affected user:

→ update users:  
total\_points \+= delta  
exact\_hits \+= delta  
correct\_signs \+= delta

---

## **Final**

→ set match.is\_scored \= true

---

## **Idempotencia**

ANTES de ejecutar:

IF match.is\_scored \= true → EXIT

---

# **4.4 Job: League Standings Rebuild (CRÍTICO)**

### **Objetivo**

Actualizar rankings de todas las ligas afectadas.

---

## **Trigger**

* match scored

---

## **Input**

* users afectados  
* ligas de esos usuarios

---

## **Proceso**

FOR each league:

1. obtener miembros  
2. obtener stats de users  
3. ordenar por:  
   * total\_points DESC  
   * exact\_hits DESC  
   * correct\_signs DESC  
   * macro\_points DESC  
4. persistir en:

league\_standings/{leagueId}

---

## **Output**

Read model listo para API.

---

## **Regla**

NO calcular standings on-demand.

👉 Alineado con data model

---

# **4.5 Job: Macro Scoring**

### **Trigger**

* fin fase de grupos  
* fin torneo

---

## **Proceso**

1. comparar picks vs realidad  
2. calcular puntos  
3. actualizar user.macro\_points  
4. actualizar total\_points

---

# **4.6 Job: Adjustment Window Activation**

### **Trigger**

* fin fase de grupos

---

## **Acción**

→ habilitar flag:

adjustment\_available \= true

---

## **Expiración**

* kickoff primer partido knockout → false

---

# **4.7 Job: Repair / Rebuild (Admin)**

### **Objetivo**

Permitir reconstrucción completa del sistema.

---

## **Proceso**

1. reset match scoring  
2. reset user aggregates  
3. re-run scoring all matches  
4. rebuild standings

---

## **Uso**

* bugs  
* inconsistencias  
* testing

---

# **5\. ORQUESTACIÓN COMPLETA**

---

## **5.1 Flujo oficial post-partido**

1. partido termina  
2. resultado se ingesta  
3. match.status \= finished  
4. job scoring corre  
5. users se actualizan  
6. standings se recalculan  
7. match.is\_scored \= true

👉 Flujo consistente con MVP CANON

---

# **6\. ORDEN DE EJECUCIÓN**

Orden SIEMPRE:

1. Match update  
2. Match scoring  
3. User aggregates  
4. League standings

---

# **7\. CONSISTENCIA Y LOCKS**

## **7.1 Reglas**

* un match no puede ser scoreado dos veces  
* standings se recalculan después de scoring  
* no hay escrituras concurrentes conflictivas

---

# **8\. ESCALABILIDAD MVP**

## **8.1 Supuestos**

* miles de usuarios  
* cientos de ligas  
* decenas de partidos

---

## **8.2 Estrategia**

* batch por match  
* no recalcular todo  
* solo usuarios afectados

---

# **9\. LOGGING**

Cada job debe loggear:

* start  
* input  
* output  
* errores

---

# **10\. FAILURES**

## **10.1 Si falla scoring**

* retry manual o automático

## **10.2 Si falla standings**

* re-run independiente

---

# **11\. REGLA DE ORO**

👉 **Nunca mezclar lógica de scoring dentro de la API.**

TODO scoring vive en jobs.

---

# **12\. Relación con otros documentos**

Este documento operacionaliza:

* STATE MATRIX  
* DATA MODEL  
* API SPEC  
* MVP CANON

En caso de duda:

👉 este documento define cómo se ejecuta el sistema en runtime.
