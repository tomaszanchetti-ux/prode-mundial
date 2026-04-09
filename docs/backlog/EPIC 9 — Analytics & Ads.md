# **EPIC 9 — Analytics & Ads**

---

## **1\. Propósito**

Implementar una capa **mínima, consistente y no intrusiva** de:

* **analytics de producto (MVP)**  
* **ads inline no disruptivos**

sin alterar la lógica core del juego, respetando:

* backend como source of truth  
* modelo event-driven \+ batch  
* API `/api/v1` con envelope estándar  
* frontend sin lógica crítica

La épica permite entender uso del producto y habilitar monetización básica sin romper el loop principal.

---

## **2\. Objetivos funcionales**

### **Analytics**

El sistema debe permitir:

1. capturar eventos mínimos de uso del producto  
2. enviar eventos desde frontend → backend  
3. persistir eventos de forma simple  
4. tolerar retries sin duplicación crítica (idempotencia básica)  
5. no depender de lógica client-side para consistencia  
6. mantener payloads pequeños, explícitos y estables

---

### **Ads**

El sistema debe permitir:

1. renderizar banners inline no intrusivos  
2. definir slots permitidos desde backend  
3. controlar visibilidad y fallback  
4. registrar impresiones y clicks (analytics)  
5. no interrumpir flujos críticos:  
   * guardado de predicción  
   * confirmación de macro  
   * joins de liga

---

## **3\. Alcance**

### **Incluye**

#### **Analytics**

* endpoint `POST /api/v1/events`  
* contrato shared de eventos  
* persistencia simple en Firestore  
* set mínimo de eventos:  
  * screen viewed  
  * match prediction saved  
  * macro picks saved  
  * macro adjustment confirmed  
  * league created  
  * league joined  
  * invite opened  
  * home CTA clicked  
  * points viewed  
  * ad impression  
  * ad click

#### **Ads**

* endpoint `GET /api/v1/config/ads`  
* definición de ad slots permitidos  
* render inline en frontend  
* estados:  
  * loading  
  * hidden  
  * filled  
  * fallback  
* tracking de impresión y click

---

### **Excluye**

* analytics avanzada / BI / dashboards  
* segmentación  
* funnels complejos  
* user profiling  
* A/B testing  
* ad network integration compleja  
* interstitials  
* video ads  
* notificaciones  
* cambios en scoring, standings o home

---

## **4\. Resultado esperado (flujo demo)**

### **Flujo A — Tracking básico**

1. usuario abre `/home`  
2. frontend envía `screen_viewed`  
3. backend persiste evento  
4. usuario guarda predicción  
5. frontend envía `match_prediction_saved`  
6. backend persiste

---

### **Flujo B — Ads en home**

1. usuario entra a `/home`  
2. frontend consume `GET /api/v1/config/ads`  
3. recibe slots activos  
4. renderiza banner inline entre bloques  
5. se dispara `ad_impression`  
6. usuario hace click  
7. se dispara `ad_click`

---

### **Flujo C — Protección UX**

1. usuario guarda predicción  
2. no aparece ningún ad durante acción  
3. flujo termina sin interrupción  
4. ad solo aparece en bloques pasivos

---

## **5\. Dependencias**

* MVP CANON (ads no intrusivos, home accionable)  
* API Spec (envelope y principios)  
* PROJECT STRUCTURE (apps/web captura eventos)  
* DATA MODEL (Firestore collections)  
* EPIC 7 (home como punto de integración)

---

## **6\. Definition of Done**

* existe `POST /api/v1/events`  
* eventos se persisten correctamente  
* idempotencia básica implementada  
* frontend envía eventos sin bloquear UX  
* existe `GET /api/v1/config/ads`  
* ad slots definidos y respetados  
* ads no aparecen en momentos críticos  
* impressions y clicks se trackean  
* no hay lógica crítica en frontend  
* tests básicos pasan  
* performance no degradada

---

# **CARDS (ejecutables para Codex)**

---

# **CARD 1 — Shared Contracts: Analytics Events**

## **Objetivo**

Definir contratos de eventos en `packages/shared`

## **Dominio**

`shared`

## **Tasks**

crear archivo:  
packages/shared/src/analytics/events.ts

* 

definir enum:  
export type AnalyticsEventType \=  
  | 'screen\_viewed'  
  | 'match\_prediction\_saved'  
  | 'macro\_picks\_saved'  
  | 'macro\_adjustment\_confirmed'  
  | 'league\_created'  
  | 'league\_joined'  
  | 'invite\_opened'  
  | 'home\_cta\_clicked'  
  | 'points\_viewed'  
  | 'ad\_impression'  
  | 'ad\_click'

* 

definir payload base:  
export type AnalyticsEvent \= {  
  eventId: string  
  eventType: AnalyticsEventType  
  userId: string | null  
  sessionId: string  
  timestamp: string  
  metadata?: Record\<string, unknown\>  
}

*   
* definir metadata por tipo (optional typing helper)

## **Acceptance Criteria**

* tipos exportados correctamente  
* compatibles con API  
* reutilizables en web y backend

---

# **CARD 2 — API: POST /events**

## **Objetivo**

Implementar endpoint de ingesta de eventos

## **Dominio**

`api`

## **Tasks**

crear route:  
apps/api/src/domains/analytics/routes/post-events.ts

*   
* validar body contra schema  
* validar:  
  * eventType válido  
  * timestamp presente

generar hash idempotente:  
idempotencyKey \= hash(eventType \+ sessionId \+ timestamp)

* 

upsert en Firestore:  
analyticsEvents/{idempotencyKey}

* 

response:  
{ "ok": true, "data": { "accepted": true } }

* 

## **Acceptance Criteria**

* endpoint responde correctamente  
* duplicados no crean nuevos docs  
* errores siguen spec estándar

---

# **CARD 3 — Persistence: analyticsEvents**

## **Objetivo**

Definir colección de eventos

## **Dominio**

`backend`

## **Tasks**

colección:  
analyticsEvents/{eventId}

* 

shape:  
{  
  eventId: string  
  eventType: string  
  userId: string | null  
  sessionId: string  
  timestamp: timestamp  
  metadata: object | null  
  createdAt: timestamp  
}

*   
* índices:  
  * eventType  
  * createdAt

## **Acceptance Criteria**

* colección creada  
* escritura válida  
* query simple posible

---

# **CARD 4 — Web: Analytics Client**

## **Objetivo**

Implementar cliente de envío de eventos

## **Dominio**

`web`

## **Tasks**

crear hook:  
apps/web/src/lib/analytics/useAnalytics.ts

* 

función:  
track(eventType, metadata?)

*   
* incluir:  
  * sessionId (uuid persistido en localStorage)  
  * timestamp  
* enviar POST async (fire-and-forget)  
* retry simple (1 intento)

## **Acceptance Criteria**

* no bloquea UI  
* no rompe flows  
* funciona en mobile

---

# **CARD 5 — Web: Instrumentación mínima**

## **Objetivo**

Instrumentar eventos clave

## **Dominio**

`web`

## **Tasks**

* `/home`  
  * screen\_viewed  
  * home\_cta\_clicked  
* `/matches`  
  * screen\_viewed  
* save prediction  
  * match\_prediction\_saved  
* `/macro-picks`  
  * macro\_picks\_saved  
  * macro\_adjustment\_confirmed  
* `/leagues`  
  * league\_created  
  * league\_joined  
* `/points`  
  * points\_viewed

## **Acceptance Criteria**

* eventos se disparan correctamente  
* no duplicación excesiva  
* no impacta performance

---

# **CARD 6 — Shared Contracts: Ads Config**

## **Objetivo**

Definir contrato de ads

## **Dominio**

`shared`

## **Tasks**

archivo:  
packages/shared/src/ads/ads.ts

* 

definir:  
export type AdSlot \=  
  | 'home\_inline\_1'  
  | 'home\_inline\_2'  
  | 'matches\_inline\_1'  
  | 'league\_detail\_inline\_1'

* 

definir config:  
export type AdConfig \= {  
  slot: AdSlot  
  enabled: boolean  
  imageUrl: string  
  clickUrl: string  
}

* 

## **Acceptance Criteria**

* slots definidos  
* tipado consistente

---

# **CARD 7 — API: GET /config/ads**

## **Objetivo**

Servir configuración de ads

## **Dominio**

`api`

## **Tasks**

endpoint:  
GET /api/v1/config/ads

* 

retornar lista estática (MVP):  
{  
  "ok": true,  
  "data": {  
    "slots": \[...\]  
  }  
}

* 

## **Acceptance Criteria**

* responde correctamente  
* configurable fácilmente

---

# **CARD 8 — Web: Ad Renderer**

## **Objetivo**

Renderizar ads inline

## **Dominio**

`web`

## **Tasks**

componente:  
AdSlot.tsx

*   
* props:  
  * slotId  
* estados:  
  * loading  
  * hidden  
  * filled  
  * fallback (no render)  
* render:  
  * imagen clickable  
* on mount:  
  * track `ad_impression`  
* on click:  
  * track `ad_click`

## **Acceptance Criteria**

* render correcto  
* eventos enviados  
* no rompe layout

---

# **CARD 9 — Web: Placement Rules**

## **Objetivo**

Definir ubicaciones permitidas

## **Dominio**

`web`

## **Tasks**

### **Permitir**

* home:  
  * entre bloques (NO arriba del todo)  
* matches list:  
  * cada N items  
* league detail:  
  * debajo del header

### **Prohibir**

* dentro de forms  
* durante:  
  * save prediction  
  * confirm macro  
  * join league  
* en modales críticos

## **Acceptance Criteria**

* reglas respetadas  
* UX intacta

---

# **CARD 10 — QA & Guards**

## **Objetivo**

Asegurar no regresiones

## **Dominio**

`testing`

## **Tasks**

* test endpoint events  
* test idempotencia  
* test ads config  
* test render sin datos  
* test no render en estados críticos

## **Acceptance Criteria**

* tests pasan  
* no rompe flows existentes