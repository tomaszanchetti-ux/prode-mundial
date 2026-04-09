# **Prode Mundial \- STATE MATRIX \+ BUSINESS STATES SPEC (MVP v1)**

---

# **1\. Propósito del documento**

Este documento define con precisión absoluta:

* todos los estados posibles del sistema  
* transiciones válidas entre estados  
* condiciones que disparan cada transición  
* flags derivados que consume el frontend  
* restricciones de edición por estado  
* relación entre estados de backend y estados UX

👉 Es el documento que elimina ambigüedad sobre **qué puede pasar y cuándo**.

---

# **2\. Principios obligatorios**

## **2.1 Backend define estados, frontend los consume**

El frontend nunca infiere estado.

La API debe devolver flags explícitos:

* isEditable  
* isLocked  
* isScored  
* isFinished  
* adjustmentAvailable

---

## **2.2 Estados son determinísticos**

Un mismo input → mismo estado siempre.

No hay lógica ambigua ni dependiente del cliente.

---

## **2.3 Estados son exhaustivos y mutuamente consistentes**

No puede existir un objeto en “estado indefinido”.

---

## **2.4 Transiciones son unidireccionales**

Ejemplo:

* un partido NO puede volver de "finished" a "scheduled"

---

# **3\. STATE MODEL — MATCH**

## **3.1 Estados base del partido (`matches.status`)**

| Estado | Descripción |
| ----- | ----- |
| scheduled | Partido futuro |
| live | Partido en curso |
| finished | Partido finalizado |

👉 Fuente: data model

---

## **3.2 Estados derivados del sistema**

Estos no necesariamente se persisten, pero se exponen vía API.

| Estado derivado | Condición |
| ----- | ----- |
| isEditable | now \< kickoff AND status \= scheduled |
| isLocked | now \>= kickoff |
| isFinished | status \= finished |
| isScored | is\_scored \= true |

---

## **3.3 Matriz completa de estados del partido**

| status | now \< kickoff | now \>= kickoff | is\_scored | Estado funcional |
| ----- | ----- | ----- | ----- | ----- |
| scheduled | yes | no | false | EDITABLE |
| scheduled | no | yes | false | LOCKED\_PENDING |
| live | no | yes | false | LIVE\_LOCKED |
| finished | no | yes | false | FINISHED\_PENDING\_SCORING |
| finished | no | yes | true | SCORED |

---

## **3.4 Reglas críticas**

* kickoff bloquea SIEMPRE edición  
* scoring solo ocurre cuando:  
  * status \= finished  
  * resultados cargados

👉 Alineado con MVP CANON

---

# **4\. STATE MODEL — PREDICTIONS**

## **4.1 Estados base**

| Estado | Condición |
| ----- | ----- |
| draft | guardado antes del kickoff |
| locked | kickoff alcanzado |
| scored | puntos asignados |

---

## **4.2 Campos relevantes**

* is\_locked  
* is\_scored  
* points\_awarded

👉 Fuente: data model

---

## **4.3 Transiciones**

draft → locked → scored

❌ No hay reversión

---

## **4.4 Reglas**

* una predicción nunca puede volver a editable después de kickoff  
* scoring es idempotente

---

# **5\. STATE MODEL — MACRO PICKS**

## **5.1 Estados**

| Estado | Condición |
| ----- | ----- |
| editable | antes inicio torneo |
| locked | kickoff torneo |
| adjusted | post grupos |
| scored | fin torneo |

---

## **5.2 Sub-estado: adjustment**

| Estado | Condición |
| ----- | ----- |
| available | fase grupos terminada |
| used | usuario ya ajustó |
| expired | kickoff octavos |

---

## **5.3 Reglas**

* ajuste solo UNA vez  
* penalización automática

👉 Alineado con functional spec

---

# **6\. STATE MODEL — LEAGUES**

## **6.1 Estados**

| Estado | Condición |
| ----- | ----- |
| active_joinable | liga operativa, con cupo disponible y habilitada para recibir miembros |
| active_full | liga operativa, pero alcanzó `memberLimit` |
| inactive | desactivada |

---

## **6.2 Membership**

| Estado | Condición |
| ----- | ----- |
| member | pertenece a liga |
| not\_member | no pertenece |

---

## **6.3 Flags API**

* isMember  
* canJoin  
* isActive
* isFull
* memberLimitReached

---

# **7\. STATE MODEL — SCORING**

## **7.1 Estados del match scoring**

| Estado | Condición |
| ----- | ----- |
| pending | match terminado, no procesado |
| processed | scoring ejecutado |

---

## **7.2 Reglas críticas**

* scoring es:  
  * batch  
  * idempotente  
  * post-evento

👉 MVP CANON

---

# **8\. STATE MODEL — DEADLINES**

## **8.1 Tipos**

| Tipo | Evento |
| ----- | ----- |
| match | kickoff |
| macro\_initial | inicio torneo |
| macro\_adjustment | inicio octavos |

---

## **8.2 Regla global**

NO existen tolerancias.

---

# **9\. MAPE0 BACKEND → FRONTEND**

## **9.1 Ejemplo match card**

Backend:

{  
isEditable: true,  
isLocked: false,  
isScored: false  
}

Frontend:

→ Mostrar:

* inputs activos  
* botón guardar  
* deadline visible

---

## **9.2 Ejemplo scored**

Backend:

{  
isEditable: false,  
isLocked: true,  
isScored: true  
}

Frontend:

→ Mostrar:

* resultado real  
* puntos obtenidos  
* breakdown

---

# **10\. EDGE CASES CRÍTICOS**

## **10.1 Usuario sin predicción**

* match scored  
  → puntos \= 0

---

## **10.2 Predicción guardada justo en kickoff**

* backend decide usando timestamp server-side

---

## **10.3 Re-scoring**

* permitido  
* no duplica puntos

---

# **11\. REGLA DE ORO**

👉 **El sistema nunca debe dejar al usuario en un estado ambiguo.**

Siempre debe poder responder:

* ¿puedo editar esto?  
* ¿esto ya se jugó?  
* ¿esto ya se puntuó?  
* ¿cuántos puntos gané?

---

# **12\. Relación con otros documentos**

Este documento es consistente con:

* MVP CANON  
* API Specification  
* Data Model  
* Functional Spec

En caso de conflicto, este documento define la **interpretación operativa de estados**.
