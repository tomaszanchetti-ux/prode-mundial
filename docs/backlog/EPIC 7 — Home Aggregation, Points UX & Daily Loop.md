# **EPIC 7 — Home Aggregation, Points UX & Daily Loop**

---

## **1\. Propósito de la épica**

Esta épica construye la **home definitiva del MVP como tablero principal accionable**, conectando en una sola lectura optimizada los cuatro loops ya cerrados del producto:

* partidos  
* puntos  
* macro picks  
* ligas

Su objetivo es dejar implementado, de punta a punta:

* `GET /api/v1/home` como payload único, listo para render  
* read model de home precomputado / read-optimized  
* bloques UX con estado resuelto por backend  
* puntos recientes integrados con scoring de partidos y scoring macro  
* deadlines visibles y consistentes en toda la home  
* CTAs contextuales por bloque  
* impacto visible de ligas: posición, puntos y cambios  
* soporte para estados empty / loading / partial / locked / scored  
* performance consistente con el principio: **frontend sin lógica crítica**  
* tests de dominio, integración, materialización y UI

Esta épica **no redefine scoring**, **no redefine macro**, **no redefine standings**, **no agrega ranking global**. Solo agrega la **capa de agregación y consumo diario** sobre lo ya cerrado en EPIC 1 a EPIC 6\.

---

## **2\. Objetivos funcionales de la épica**

Al finalizar esta épica, el sistema debe permitir que un usuario autenticado:

1. entre a `/home`  
2. vea inmediatamente cuál es su próxima acción útil  
3. vea partidos del día o pendientes con CTA correcto  
4. vea si recibió puntos recientes por scoring match o macro  
5. vea su situación macro actual:  
   * incompleto  
   * editable  
   * bloqueado  
   * ajuste disponible  
   * ajustado final  
6. vea su posición relevante en ligas sin entrar todavía al detalle  
7. vea deadlines visibles por bloque cuando correspondan  
8. navegue con un solo toque al flujo correcto:  
   * predecir partidos  
   * editar predicción  
   * ver puntos  
   * completar / editar / ajustar macro  
   * abrir liga / ver ranking  
9. reciba una home consistente aunque algunos subdominios estén sin datos aún  
10. no dependa de joins client-side ni recomputación local

Además, el sistema debe permitir:

* servir `GET /api/v1/home`  
* exponer read model de home materializable  
* integrar scoring match \+ scoring macro dentro de un `recentPointsFeed`  
* reflejar standings de liga ya materializados, sin cálculo on-demand en frontend  
* mantener una sola lectura principal para la pantalla home  
* permitir refresh seguro e idempotente del read model cuando cambien datos upstream.

---

## **3\. Qué entra en esta épica**

### **Incluido**

* endpoint autenticado `GET /api/v1/home`  
* dominio `home` en shared, api y web  
* read model materializado o reconstruible de home por usuario  
* bloque `priorityCard`  
* bloque `todayMatches` / próximos accionables  
* bloque `recentPointsSummary`  
* bloque `recentPointsFeed`  
* bloque `leagueSummary`  
* bloque `macroSummary`  
* soporte de `adSlots` inline no intrusivos  
* reglas de priorización del CTA principal de la home  
* deadlines visibles y consistentes por bloque  
* estados UX:  
  * loading  
  * empty  
  * partial  
  * locked  
  * scored  
* mappers backend a DTO público  
* jobs / hooks de refresh de home si aplican  
* tests unitarios, integración, read model y UI

### **No incluido**

* ranking global  
* feed social  
* notificaciones push  
* reminders engine  
* recomendaciones personalizadas  
* activity stream social  
* nuevas reglas de scoring  
* nuevas reglas de standings  
* cambios a EPIC 6  
* lógica crítica nueva en frontend

Todo esto queda fuera del alcance de la épica y del MVP binding.

---

## **4\. Resultado esperado visible**

Al cerrar EPIC 7, un reviewer debe poder probar este flujo de punta a punta:

### **Flujo demo A — Home accionable con partidos pendientes**

1. abrir app autenticado  
2. entrar a `/home`  
3. ver `priorityCard` indicando partidos pendientes  
4. ver lista de partidos del día o próximos accionables  
5. tocar `Ver partidos`  
6. navegar a `/matches?filter=pending`  
7. volver a home  
8. confirmar que el estado sigue consistente

### **Flujo demo B — Home tras scoring de partidos**

1. admin ingesta resultado oficial  
2. corre scoring de match  
3. se actualizan aggregates del usuario  
4. se recalculan standings afectados  
5. abrir `/home`  
6. ver `recentPointsSummary.hasRecentScoring = true`  
7. ver `recentPointsFeed` con entradas de partidos puntuados  
8. tocar `Ver mis puntos`  
9. navegar a `/points`

### **Flujo demo C — Home tras scoring macro**

1. termina fase o final según corresponda  
2. corre macro scoring  
3. se actualiza `users.macroPoints` y `users.totalPoints`  
4. se recalculan standings  
5. abrir `/home`  
6. ver puntos recientes macro en el feed  
7. ver impacto reflejado en `leagueSummary`  
8. ver `macroSummary` actualizado y bloqueado / scored según corresponda

### **Flujo demo D — Home con ligas**

1. usuario pertenece a una o más ligas  
2. abrir `/home`  
3. ver liga principal resumida  
4. ver posición actual y puntos  
5. si hubo cambio reciente, ver variación  
6. tocar CTA de liga  
7. navegar a detalle o ranking

### **Flujo demo E — Home parcial**

1. usuario nuevo sin ligas  
2. sin picks macro aún  
3. con cero o pocos partidos puntuados  
4. abrir `/home`  
5. ver bloques resueltos sin errores:  
   * partidos disponibles  
   * macro vacío  
   * ligas vacías  
   * puntos recientes vacíos  
6. confirmar que cada bloque ofrece CTA útil y no decorativo.

---

## **5\. Dependencias documentales**

Esta épica debe obedecer estrictamente:

* **MVP CANON**  
  * home \= tablero de acción  
  * un CTA principal por bloque  
  * deadlines siempre visibles  
  * sin ranking global  
  * backend como source of truth  
  * read optimized / precomputado.  
* **API Specification**  
  * `GET /api/v1/home` ya existe como contrato base  
  * un frontend debe poder construir la home sin joins extra  
  * payload camelCase y envelope estándar.  
* **DATA MODEL**  
  * standings materializados  
  * aggregates de usuario persistidos  
  * conveniencia de materializar recent scored matches y league summary para home si el costo lo justifica.  
* **TECH DECISIONS**  
  * Firestore  
  * Cloud Run  
  * Cloud Run Jobs  
  * read models simples  
  * jobs separados de API  
  * idempotencia obligatoria.  
* **EPIC 3**  
  * points layer  
  * recent history  
  * standings materializados.  
* **EPIC 4**  
  * myStanding y summary de ligas.  
* **EPIC 5**  
  * macro summary reutilizable en home  
  * CTA contextual macro.  
* **EPIC 6**  
  * macro scoring ya definido y no modificable  
  * impacto en standings ya cerrado.

---

## **6\. Resultado esperado**

Al terminar esta épica debe existir una home que:

* carga con un único `GET /api/v1/home`  
* muestra datos listos para render, sin joins client-side  
* expone un bloque prioritario claro  
* conecta el loop diario:  
  * predecir  
  * volver  
  * ver puntos  
  * ver posición  
  * completar o revisar macro  
* mantiene consistencia exacta con matches, macro, points y leagues  
* tolera ausencia parcial de datos sin romper la pantalla  
* sigue siendo mobile-first y utilitaria, no decorativa.

---

## **7\. Definition of Done**

La épica se considera terminada solo si:

* existe `GET /api/v1/home`  
* el payload permite construir la home sin requests extra obligatorias  
* existe `priorityCard` con priorización server-side  
* existe bloque de partidos accionables  
* existe bloque de `recentPointsSummary`  
* existe `recentPointsFeed`  
* existe `leagueSummary`  
* existe `macroSummary`  
* todos los bloques exponen CTA contextual ya resuelto  
* todos los deadlines visibles salen del backend o de datos backend ya resueltos  
* el frontend no calcula estados críticos  
* el feed reciente integra scoring de partidos y macro scoring  
* `leagueSummary` refleja standings materializados, no ranking calculado en cliente  
* la home soporta empty / loading / partial / locked / scored  
* el payload se mantiene pequeño y estable  
* hay cobertura de tests de dominio  
* hay tests de integración API  
* hay tests de materialización / refresh del read model  
* hay tests UI mínimos mobile-first  
* CI pasa con lint \+ typecheck \+ test.

---

# **8\. Diseño funcional y read model de Home**

---

## **8.1 Principio**

La home no debe ser un agregado improvisado en runtime con múltiples consultas profundas.  
Debe servirse como **read model simple, rápido y consistente**, armado desde backend, reutilizando snapshots persistidos y derivados ya existentes. El frontend solo renderiza.

---

## **8.2 Read model oficial propuesto**

### **Collection**

`homeSnapshots/{userId}`

### **Shape canónico**

type HomeSnapshot \= {  
  userId: string

  priorityCard: HomePriorityCard | null

  actionableMatches: HomeMatchCard\[\]  
  recentPointsSummary: HomeRecentPointsSummary  
  recentPointsFeed: HomeRecentPointsItem\[\]

  leagueSummary: HomeLeagueSummary  
  macroSummary: HomeMacroSummary

  adSlots: HomeAdSlot\[\]

  generatedAt: string  
  sourceVersions: {  
    userUpdatedAt: string | null  
    latestPredictionUpdatedAt: string | null  
    latestMacroUpdatedAt: string | null  
    latestLeagueStandingUpdatedAt: string | null  
    latestScoringEventAt: string | null  
  }  
}

### **Notas obligatorias**

* `homeSnapshots/{userId}` es un **read model**, no una nueva fuente de verdad de scoring.  
* si por simplicidad inicial se decide no persistir snapshot físico para todos los casos, igual debe existir un **assembler de dominio Home** con contrato estable que permita evolucionar luego a materialización persistida sin cambiar API.  
* la API pública de Home debe mantenerse idéntica tanto si el snapshot se genera on-read con caché corta como si se sirve desde documento materializado.  
* para MVP, la decisión recomendada es:  
  * materializar parcialmente  
  * reconstruir idempotentemente  
  * evitar joins costosos en cada request.

---

## **8.3 DTO público de `GET /api/v1/home`**

Se mantiene alineado con API Spec existente y se extiende sin romper compatibilidad.

type GetHomeResponse \= {  
  ok: true  
  data: {  
    priorityCard: HomePriorityCard | null

    todayMatches: HomeMatchCard\[\]

    recentPointsSummary: {  
      hasRecentScoring: boolean  
      recentPoints: number  
      recentMatchesScored: number  
      recentMacroScored: boolean  
      ctaLabel: string  
      ctaRoute: string  
    }

    recentPointsFeed: HomeRecentPointsItem\[\]

    leagueSummary: {  
      hasLeagues: boolean  
      primaryLeague: HomeLeagueMini | null  
      secondaryLeaguesCount: number  
      ctaLabel: string  
      ctaRoute: string  
    }

    macroSummary: {  
      status: HomeMacroStatus  
      completionPercent: number | null  
      adjustmentAvailable: boolean  
      deadlineAt: string | null  
      lastScoredAt: string | null  
      ctaLabel: string  
      ctaRoute: string  
    }

    adSlots: HomeAdSlot\[\]  
    generatedAt: string  
  }  
}

---

## **8.4 Tipos internos de Home**

type HomePriorityCardType \=  
  | 'pending\_matches'  
  | 'today\_matches'  
  | 'macro\_incomplete'  
  | 'macro\_adjustment\_available'  
  | 'recent\_points'  
  | 'league\_movement'  
  | 'no\_leagues'  
  | 'empty\_start'

type HomePriorityCard \= {  
  type: HomePriorityCardType  
  title: string  
  subtitle: string | null  
  ctaLabel: string  
  ctaRoute: string  
  deadlineAt: string | null  
}

type HomeMatchCard \= {  
  matchId: string  
  stage: 'group' | 'R16' | 'QF' | 'SF' | 'FINAL'  
  groupId: string | null  
  homeTeam: TeamSummary  
  awayTeam: TeamSummary  
  kickoffAt: string  
  deadlineAt: string  
  status: 'scheduled' | 'live' | 'finished' | 'void'  
  predictionStatus: 'empty' | 'saved\_editable' | 'locked\_unscored' | 'scored' | 'void'  
  userPredictionSummary: string | null  
  isEditable: boolean  
  isLocked: boolean  
  isScored: boolean  
  pointsAwarded: number | null  
  ctaLabel: string  
  ctaRoute: string  
}

type HomeRecentPointsItem \= {  
  itemType: 'match' | 'macro'  
  itemId: string  
  title: string  
  subtitle: string | null  
  pointsAwarded: number  
  scoredAt: string  
  leagueImpact: {  
    primaryLeagueId: string | null  
    primaryLeagueName: string | null  
    positionBefore: number | null  
    positionAfter: number | null  
    delta: number | null  
  } | null  
  ctaLabel: string  
  ctaRoute: string  
}

type HomeLeagueMini \= {  
  leagueId: string  
  name: string  
  position: number | null  
  previousPosition: number | null  
  positionDelta: number | null  
  totalMembers: number  
  points: number  
  isActive: boolean  
}

type HomeLeagueSummary \= {  
  hasLeagues: boolean  
  primaryLeague: HomeLeagueMini | null  
  secondaryLeaguesCount: number  
  ctaLabel: string  
  ctaRoute: string  
}

type HomeMacroStatus \=  
  | 'empty'  
  | 'draft\_editable'  
  | 'submitted\_editable'  
  | 'locked\_original'  
  | 'adjustment\_available'  
  | 'adjusted\_locked'  
  | 'scored\_final'

type HomeAdSlot \= {  
  slotId: string  
  placement: 'inline\_secondary'  
}

---

## **8.5 Regla de compatibilidad**

`todayMatches` puede seguir llamándose así en API pública por continuidad con el spec, pero a nivel dominio interno la lista debe modelarse como **`actionableMatches`**.  
La lista puede contener:

* partidos del día  
* próximos partidos con acción pendiente  
* partidos ya puntuados recientes solo si la prioridad UX lo justifica

**Regla oficial:**  
máximo 5 items en home, priorizando acción útil inmediata antes que completitud histórica. El histórico completo vive en `/matches` y `/points`. Esta limitación protege payload, claridad y mobile UX. Esto es consistente con la filosofía de tablero de acción y lectura optimizada.

---

# **9\. Reglas de agregación de Home**

---

## **9.1 Fuente de datos por bloque**

### **Bloque partidos**

Fuente principal:

* `matches`  
* `predictions`

Campos derivados reutilizados:

* `predictionStatus`  
* `isEditable`  
* `isLocked`  
* `deadlineAt`  
* `ctaLabel`

No recalcular en frontend.

### **Bloque puntos recientes**

Fuente principal:

* `matchScoringLogs`  
* `macroScoringLogs`  
* `users`  
* `predictions` ya puntuadas cuando haga falta enrich

### **Bloque liga**

Fuente principal:

* `leagueStandings`  
* `leagueMembers`  
* `leagues`

Preferencia de resumen:

* una liga principal  
* contador de ligas adicionales

### **Bloque macro**

Fuente principal:

* `macroPredictions`  
* flags derivados de ventana y estado  
* opcionalmente `macroScoringLogs` para `lastScoredAt`

---

## **9.2 Selección de `primaryLeague`**

Regla oficial para MVP:

1. priorizar ligas activas  
2. dentro de activas, priorizar la de mejor señal competitiva reciente:  
   * si existe `positionDelta != 0`, elegir la que tuvo movimiento más reciente  
3. si ninguna tuvo movimiento reciente:  
   * elegir la liga con mejor posición del usuario  
4. empate:  
   * menor `position`  
   * mayor `totalMembers`  
   * `leagueId ASC` como fallback técnico estable

No introducir heurísticas avanzadas ni personalización.  
Objetivo: mostrar una sola liga relevante, evitando clutter.  
El acceso al resto vive en `/leagues`. Esto sigue la lógica social centrada en ligas, sin ranking global.

---

## **9.3 Selección de `recentPointsFeed`**

Regla oficial:

* ordenar por `scoredAt DESC`  
* mezclar items de tipo `match` y `macro`  
* máximo 5 items  
* incluir solo items con `pointsAwarded > 0` o `pointsAwarded = 0` si fueron scored y el evento es reciente y relevante para explicar estado competitivo

### **Recomendación exacta para MVP**

* incluir puntos positivos siempre  
* incluir ceros solo si:  
  * el usuario no tiene otros items recientes  
  * o el bloque quedaría vacío pese a haber scoring reciente real  
* nunca incluir items negativos porque no existen en scoring de usuario del MVP  
* la penalización macro no es “puntos negativos”, sino menor potencial o menor awarded según reglas ya definidas en scoring macro; la home debe reflejar el resultado final, no explicar mecánica nueva.

---

## **9.4 Integración de scoring match \+ macro**

La home debe consumir ambos mundos dentro del mismo feed, pero sin fusionar semánticamente reglas distintas.

### **Item tipo `match`**

Debe mostrar:

* título del partido  
* puntos obtenidos  
* timestamp de scoring  
* impacto en liga si disponible  
* CTA a `/points` o detalle del partido

### **Item tipo `macro`**

Debe mostrar:

* título contextual:  
  * `Se puntuaron tus picks macro`  
  * o `Se actualizó tu puntaje macro`  
* puntos obtenidos  
* timestamp  
* impacto de liga si disponible  
* CTA a `/macro-picks` o `/points`

Esto sostiene el loop diario completo sin introducir pantalla nueva.

---

## **9.5 Regla de `priorityCard`**

La home debe tener **una sola prioridad principal**.  
Orden oficial de precedencia:

1. partidos pendientes con deadline cercana  
2. partidos del día sin predecir  
3. macro incompleto editable antes de cierre inicial  
4. ajuste macro disponible  
5. puntos recientes sin revisar  
6. cambio reciente en liga relevante  
7. usuario sin ligas  
8. estado vacío inicial

### **Justificación**

Respeta el canon:

* tablero de acción  
* un CTA principal por bloque  
* prioridad a retorno diario y acción crítica.

---

## **9.6 Reglas de deadlines visibles**

### **Partidos**

Siempre mostrar `deadlineAt = kickoffAt`

### **Macro inicial**

Mostrar `deadlineAt = tournamentKickoffAt` cuando `status` sea:

* `empty`  
* `draft_editable`  
* `submitted_editable`

### **Ajuste macro**

Mostrar `deadlineAt = firstR16KickoffAt` cuando:

* `adjustmentAvailable = true`

### **Puntos recientes**

No tienen deadline; muestran `scoredAt`

### **Liga**

No tiene deadline; puede mostrar cambio de posición o estado activo

**Regla UI obligatoria:** no inventar countdown crítico client-side como fuente de verdad.  
El frontend puede renderizar tiempo relativo para UX, pero el estado editable/locked debe seguir viniendo resuelto por backend.

---

# **10\. Estados UX completos**

---

## **10.1 Home loading**

Mostrar skeleton por bloques:

* priority card skeleton  
* 2–3 match row skeletons  
* recent points skeleton  
* league card skeleton  
* macro card skeleton

No mostrar loaders globales invasivos si ya existe shell autenticado.  
La navegación bottom nav debe permanecer operativa. Esto sigue el patrón de Epic 1\.

---

## **10.2 Home empty**

Aplica cuando el usuario:

* no tiene ligas  
* no tiene macro picks  
* no recibió puntos aún  
* no tiene partidos pendientes inmediatos útiles para mostrar

La home igual debe renderizar:

* `priorityCard.type = empty_start`  
* bloque partidos con próximos partidos si existen  
* bloque macro vacío con CTA `Completar picks`  
* bloque ligas vacío con CTA `Crear liga`  
* bloque puntos vacío con CTA `Ver reglas y puntos` o `Ver mis puntos` si la ruta existe pero sin contenido

Nunca mostrar una home “vacía total”.  
Siempre debe existir una siguiente acción clara.

---

## **10.3 Home partial**

Aplica cuando una o más fuentes están disponibles y otras no.

Ejemplos:

* hay partidos pero no ligas  
* hay ligas pero no scoring reciente  
* hay macro guardado pero aún no puntuado

Regla:

* cada bloque se resuelve de forma independiente  
* la API no falla toda la home por ausencia natural de un dominio  
* solo error sistémico real debe romper `GET /home`

La ausencia funcional esperada se expresa con `hasLeagues = false`, arrays vacíos, `nulls` explícitos y estados conocidos, no con errores.

---

## **10.4 Home locked**

Home debe comunicar bloqueo cuando corresponda:

### **Partido locked**

* `predictionStatus = locked_unscored`  
* CTA: `Ver partido` o `Bloqueado` según diseño final del dominio matches  
* deadline visible como ya vencido

### **Macro locked**

* `status = locked_original` o `adjusted_locked`  
* CTA: `Ver picks`

Locked no implica ocultar el bloque; implica estado visible y consistente.  
Esto es obligatorio según canon.

---

## **10.5 Home scored**

Home debe comunicar cuando ya hubo scoring:

### **Partidos**

* `predictionStatus = scored`  
* `pointsAwarded != null`  
* CTA: `Ver puntos` o `Ver resultado`

### **Macro**

* `status = scored_final` solo para home si el scoring macro ya impactó y no hace falta seguir empujando edición o ajuste

### **Puntos recientes**

* `hasRecentScoring = true`

Esto refuerza el retorno diario y visibilidad de recompensa.

---

# **11\. Endpoint y contratos necesarios**

---

## **11.1 GET /api/v1/home**

### **Objetivo**

Servir la home autenticada como tablero de acción con payload único y UX-ready. Esto ya está definido a nivel base en API Spec y esta épica lo baja a implementación completa.

### **Request**

Sin body.

### **Auth**

Bearer Firebase token obligatorio.

### **Response final recomendada**

{  
  "ok": true,  
  "data": {  
    "priorityCard": {  
      "type": "pending\_matches",  
      "title": "Te faltan 3 partidos por predecir",  
      "subtitle": "El próximo cierra hoy a las 19:00",  
      "ctaLabel": "Ver partidos",  
      "ctaRoute": "/matches?filter=pending",  
      "deadlineAt": "2026-06-12T19:00:00Z"  
    },  
    "todayMatches": \[  
      {  
        "matchId": "m\_010",  
        "stage": "group",  
        "groupId": "A",  
        "homeTeam": { "teamId": "BRA", "name": "Brasil", "flagUrl": "/flags/bra.svg" },  
        "awayTeam": { "teamId": "JPN", "name": "Japón", "flagUrl": "/flags/jpn.svg" },  
        "kickoffAt": "2026-06-12T16:00:00Z",  
        "deadlineAt": "2026-06-12T16:00:00Z",  
        "status": "scheduled",  
        "predictionStatus": "saved\_editable",  
        "userPredictionSummary": "2-0",  
        "isEditable": true,  
        "isLocked": false,  
        "isScored": false,  
        "pointsAwarded": null,  
        "ctaLabel": "Editar predicción",  
        "ctaRoute": "/matches/m\_010"  
      }  
    \],  
    "recentPointsSummary": {  
      "hasRecentScoring": true,  
      "recentPoints": 8,  
      "recentMatchesScored": 2,  
      "recentMacroScored": false,  
      "ctaLabel": "Ver mis puntos",  
      "ctaRoute": "/points"  
    },  
    "recentPointsFeed": \[  
      {  
        "itemType": "match",  
        "itemId": "m\_001",  
        "title": "Argentina vs Canadá",  
        "subtitle": "Sumaste puntos por este partido",  
        "pointsAwarded": 5,  
        "scoredAt": "2026-06-11T22:10:00Z",  
        "leagueImpact": {  
          "primaryLeagueId": "lg\_123",  
          "primaryLeagueName": "Liga Oficina Madrid",  
          "positionBefore": 3,  
          "positionAfter": 2,  
          "delta": 1  
        },  
        "ctaLabel": "Ver mis puntos",  
        "ctaRoute": "/points"  
      }  
    \],  
    "leagueSummary": {  
      "hasLeagues": true,  
      "primaryLeague": {  
        "leagueId": "lg\_123",  
        "name": "Liga Oficina Madrid",  
        "position": 2,  
        "previousPosition": 3,  
        "positionDelta": 1,  
        "totalMembers": 12,  
        "points": 74,  
        "isActive": true  
      },  
      "secondaryLeaguesCount": 2,  
      "ctaLabel": "Ver liga",  
      "ctaRoute": "/leagues/lg\_123"  
    },  
    "macroSummary": {  
      "status": "submitted\_editable",  
      "completionPercent": 100,  
      "adjustmentAvailable": false,  
      "deadlineAt": "2026-06-11T19:00:00Z",  
      "lastScoredAt": null,  
      "ctaLabel": "Ver picks macro",  
      "ctaRoute": "/macro-picks"  
    },  
    "adSlots": \[  
      {  
        "slotId": "home\_inline\_1",  
        "placement": "inline\_secondary"  
      }  
    \],  
    "generatedAt": "2026-06-12T09:30:00Z"  
  }  
}

---

## **11.2 Reglas de error**

Errores estándar:

* `UNAUTHENTICATED`  
* `INVALID_TOKEN`  
* `INTERNAL_ERROR`  
* `DEPENDENCY_ERROR`

**Regla importante:**  
faltantes funcionales normales no son error.  
Solo problemas sistémicos reales deben devolver `ok: false`.

---

## **11.3 No se agregan endpoints extra obligatorios para Home**

Esta épica puede implementarse solo con:

* `GET /api/v1/home`

y reutilizando upstream ya existentes:

* `/matches`  
* `/points`  
* `/macro-picks`  
* `/leagues`  
* `/leagues/:leagueId`  
* `/leagues/:leagueId/standings`

Se pueden agregar endpoints internos/admin para refresh de snapshot, pero no son obligatorios como API pública del MVP. Esto respeta que **debe bastar con GET /home**.

---

# **12\. Materialización y jobs**

---

## **12.1 Estrategia oficial recomendada**

Para MVP, usar enfoque híbrido:

### **On-write / on-event refresh**

Actualizar `homeSnapshots/{userId}` cuando ocurra alguno de estos eventos:

* guardado o edición de predicción match  
* cambio de lock efectivo al pasar kickoff si afecta bloque visible  
* scoring de match  
* guardado inicial de macro picks  
* ajuste macro confirmado  
* scoring macro  
* creación de liga  
* join a liga  
* rebuild standings que afecte posición del usuario

### **On-read fallback**

Si no existe snapshot o está stale, `GET /home` puede reconstruirlo en request y persistirlo best-effort.

Esto da robustez sin complejidad excesiva y sigue el principio read-optimized.

---

## **12.2 Jobs si aplican**

### **Job A — Refresh User Home Snapshot**

**Objetivo:** reconstruir home para un usuario puntual.

**Inputs**

* `userId`  
* `reason`  
  * `prediction_saved`  
  * `match_scored`  
  * `macro_saved`  
  * `macro_adjusted`  
  * `macro_scored`  
  * `league_joined`  
  * `standings_rebuilt`  
  * `manual_rebuild`

**Output**

* upsert de `homeSnapshots/{userId}`

### **Job B — Batch Refresh Homes for Affected League Members**

**Objetivo:** refrescar home de todos los miembros de ligas afectadas por un rebuild de standings.

**Inputs**

* `leagueId[]`

**Output**

* refresh por usuario miembro

### **Job C — Sweep Expired Actionability**

Opcional y liviano.

**Objetivo:** recalcular snapshots cuyo `priorityCard` quedó desactualizado por paso de tiempo.

**Frecuencia**

* cada 5–10 min durante torneo  
* solo sobre usuarios afectados o snapshots próximos a vencer

**Nota**  
No reemplaza la verdad de locking.  
Solo mantiene la home visualmente fresca.  
La verdad sigue viniendo de matches/macro state backend.

---

## **12.3 Regla de idempotencia**

Todos los refresh jobs deben ser idempotentes:

* reconstruir desde fuentes de verdad  
* no acumular deltas ciegamente  
* sobreescribir snapshot completo o por bloques con versionado claro  
* no duplicar items en `recentPointsFeed`

La home es un read model derivado y debe poder recomponerse sin drift.

---

# **13\. Cards ejecutables**

---

## **CARD 1 — Shared Domain Contracts for Home**

### **Objetivo**

Crear en `packages/shared` todos los contratos públicos e internos mínimos del dominio Home.

### **Alcance**

* tipos públicos de `GET /api/v1/home`  
* enums/unions de bloques y estados  
* schemas de validación response  
* helpers de typing compartidos con web/api/jobs

### **Tasks**

#### **Task 1.1**

Crear `packages/shared/src/domains/home/types.ts`.

#### **Task 1.2**

Definir:

* `HomePriorityCardType`  
* `HomePriorityCard`  
* `HomeMatchCard`  
* `HomeRecentPointsSummary`  
* `HomeRecentPointsItem`  
* `HomeLeagueMini`  
* `HomeLeagueSummary`  
* `HomeMacroStatus`  
* `HomeMacroSummary`  
* `HomeAdSlot`  
* `HomeSnapshot`  
* `GetHomeResponseData`

#### **Task 1.3**

Definir unions cerradas para:

* priority card type  
* recent points item type  
* macro status

#### **Task 1.4**

Crear schema runtime para response de `GET /api/v1/home`.

#### **Task 1.5**

Agregar export central desde `packages/shared`.

### **Acceptance Criteria**

* frontend/backend/jobs usan exactamente los mismos tipos  
* no hay duplicación de contratos Home fuera de `packages/shared`  
* el tipo público es suficiente para renderizar la pantalla completa sin inferencias client-side

---

## **CARD 2 — Home Domain Rules & Prioritization Engine**

### **Objetivo**

Implementar reglas puras de negocio para construir Home desde fuentes ya resueltas.

### **Alcance**

* priorización de `priorityCard`  
* selección de partidos accionables  
* selección de liga principal  
* armado de recent points summary y feed  
* derivación de CTAs contextuales

### **Tasks**

#### **Task 2.1**

Crear `apps/api/src/domains/home/domain/home-priority.ts`.

#### **Task 2.2**

Implementar función pura:

selectHomePriorityCard(input): HomePriorityCard | null

#### **Task 2.3**

Implementar orden oficial de prioridad:

1. pending\_matches  
2. today\_matches  
3. macro\_incomplete  
4. macro\_adjustment\_available  
5. recent\_points  
6. league\_movement  
7. no\_leagues  
8. empty\_start

#### **Task 2.4**

Crear `selectActionableMatches(input): HomeMatchCard[]` con máximo 5 items.

#### **Task 2.5**

Crear `selectPrimaryLeague(input): HomeLeagueMini | null`.

#### **Task 2.6**

Crear `buildRecentPointsSummary(input)`.

#### **Task 2.7**

Crear `buildRecentPointsFeed(input)` mezclando match \+ macro.

#### **Task 2.8**

Centralizar derivación de CTAs:

* partidos  
* macro  
* puntos  
* ligas  
* priority card

### **Acceptance Criteria**

* todas las reglas son funciones puras y testeables  
* no dependen de Express/HTTP/Firestore  
* el orden de precedencia queda congelado  
* cada bloque devuelve CTA inequívoco

---

## **CARD 3 — Home Snapshot Repository & Persistence Model**

### **Objetivo**

Crear persistencia del read model Home.

### **Alcance**

* colección `homeSnapshots`  
* repositorio de lectura/escritura  
* versionado básico de freshness

### **Tasks**

#### **Task 3.1**

Crear `apps/api/src/domains/home/repositories/home-snapshots.repository.ts`.

#### **Task 3.2**

Definir shape persistida:

* `userId`  
* bloques home  
* `generatedAt`  
* `sourceVersions`

#### **Task 3.3**

Implementar:

* `getByUserId`  
* `upsert`  
* `delete`  
* `isStale`

#### **Task 3.4**

Agregar mapper Firestore ↔ domain.

#### **Task 3.5**

Agregar índices/convenciones mínimas necesarias para lectura directa por `userId`.

### **Acceptance Criteria**

* existe un documento por usuario como máximo  
* la persistencia es simple y directa  
* el snapshot puede sobreescribirse completo sin merges peligrosos

---

## **CARD 4 — Home Data Assembly Service**

### **Objetivo**

Construir el assembler principal que arma Home a partir de fuentes de verdad y snapshots existentes.

### **Alcance**

* lectura desde users, predictions, matches, macroPredictions, leagueStandings, leagues, scoringLogs  
* fallback rebuild  
* upsert del snapshot

### **Tasks**

#### **Task 4.1**

Crear `apps/api/src/domains/home/services/build-home-snapshot.service.ts`.

#### **Task 4.2**

Leer aggregates del usuario:

* `totalPoints`  
* `macroPoints`  
* `exactHits`  
* `correctSigns`

#### **Task 4.3**

Traer partidos candidatos para home:

* pendientes  
* del día  
* recientemente puntuados si aplican

#### **Task 4.4**

Traer macro prediction del usuario y resolver summary.

#### **Task 4.5**

Traer memberships del usuario y standings resumidos.

#### **Task 4.6**

Traer scoring logs recientes:

* match  
* macro

#### **Task 4.7**

Construir:

* `priorityCard`  
* `todayMatches`  
* `recentPointsSummary`  
* `recentPointsFeed`  
* `leagueSummary`  
* `macroSummary`

#### **Task 4.8**

Persistir snapshot reconstruido.

### **Acceptance Criteria**

* el servicio puede reconstruir Home completa desde cero  
* el servicio no necesita lógica del frontend  
* la salida coincide con contrato API

---

## **CARD 5 — API Endpoint GET /api/v1/home**

### **Objetivo**

Exponer Home como endpoint autenticado único y UX-ready.

### **Alcance**

* controller  
* use case  
* auth  
* serialización pública  
* envelope estándar

### **Tasks**

#### **Task 5.1**

Crear route/controller en dominio Home.

#### **Task 5.2**

Implementar `GET /api/v1/home`.

#### **Task 5.3**

Flow:

1. validar auth  
2. intentar leer snapshot  
3. si snapshot válido → responder  
4. si snapshot ausente/stale → reconstruir y responder

#### **Task 5.4**

Agregar serializer público camelCase.

#### **Task 5.5**

Agregar manejo de errores estándar.

### **Acceptance Criteria**

* con un único request el frontend puede renderizar la home  
* la respuesta cumple envelope estándar  
* sin auth responde `UNAUTHENTICATED`  
* no requiere joins extra obligatorios del lado cliente

---

## **CARD 6 — Integration with Match Scoring Events**

### **Objetivo**

Conectar Home con scoring de partidos ya existente sin modificar reglas cerradas de EPIC 3\.

### **Alcance**

* trigger/refresco post scoring match  
* recent points feed tipo match  
* prioridad por puntos recientes si aplica

### **Tasks**

#### **Task 6.1**

Ubicar en flujo de scoring match el punto exacto post-update de:

* predictions  
* users  
* standings

#### **Task 6.2**

Emitir refresh de Home para:

* usuario puntuado  
* usuarios afectados en standings si corresponde

#### **Task 6.3**

Construir mapper `matchScoringLog -> HomeRecentPointsItem`.

#### **Task 6.4**

Persistir/actualizar `recentPointsSummary`.

### **Acceptance Criteria**

* luego de score-match, Home refleja puntos recientes  
* no se duplican eventos al re-ejecutar scoring  
* la home muestra impacto competitivo actualizado

---

## **CARD 7 — Integration with Macro Scoring Events**

### **Objetivo**

Conectar Home con EPIC 6 sin tocar su definición.

### **Alcance**

* refresh post macro scoring  
* item tipo macro en recent points feed  
* actualización de macroSummary si ya quedó puntuado

### **Tasks**

#### **Task 7.1**

Ubicar hook post macro scoring.

#### **Task 7.2**

Emitir refresh de Home para usuarios afectados.

#### **Task 7.3**

Construir mapper `macroScoringLog -> HomeRecentPointsItem`.

#### **Task 7.4**

Actualizar `macroSummary.lastScoredAt`.

#### **Task 7.5**

Definir transición de `HomeMacroStatus` a `scored_final` solo para la home cuando:

* no hay más acción editable  
* el scoring macro ya ocurrió

### **Acceptance Criteria**

* luego de macro scoring, la home refleja puntos macro recientes  
* no se altera EPIC 6  
* la home no inventa nueva lógica de scoring

---

## **CARD 8 — League Summary & Position Change Integration**

### **Objetivo**

Hacer visible en Home el impacto competitivo de ligas usando standings ya materializados.

### **Alcance**

* primary league selection  
* position delta  
* CTA a liga o ranking  
* consistencia con standings

### **Tasks**

#### **Task 8.1**

Extender o reutilizar repo de standings para obtener:

* posición actual  
* puntos  
* total miembros

#### **Task 8.2**

Definir forma de obtener `previousPosition`:

* desde snapshot previo de home  
* o desde persistencia auxiliar liviana en standing row si ya existe  
* sin introducir recomputación compleja

#### **Task 8.3**

Calcular `positionDelta`:

* `previousPosition - currentPosition`  
* positivo \= subió  
* negativo \= bajó  
* cero \= sin cambio

#### **Task 8.4**

Construir `leagueSummary`:

* `hasLeagues`  
* `primaryLeague`  
* `secondaryLeaguesCount`  
* CTA contextual

#### **Task 8.5**

Definir CTA:

* `Ver liga` cuando hay primary league  
* `Ver mis ligas` cuando hay varias y no conviene profundizar una sola  
* `Crear liga` cuando no hay ligas

### **Acceptance Criteria**

* la posición de Home coincide con standings materializados  
* no existe ranking global ni referencias globales  
* el usuario ve rápido su situación social

---

## **CARD 9 — Macro Summary on Home**

### **Objetivo**

Terminar la integración Home del módulo macro usando el trabajo de EPIC 5\.

### **Alcance**

* summary macro final  
* CTA contextual  
* deadline visible  
* estado consistente con `/macro-picks`

### **Tasks**

#### **Task 9.1**

Reutilizar estados de macro ya definidos:

* `empty`  
* `draft_editable`  
* `submitted_editable`  
* `locked_original`  
* `adjustment_available`  
* `adjusted_locked`

#### **Task 9.2**

Agregar `scored_final` como estado de presentación Home si aplica.

#### **Task 9.3**

Mapear CTA:

* `Completar picks`  
* `Editar picks`  
* `Ver picks`  
* `Ajustar picks`

#### **Task 9.4**

Mostrar `completionPercent` solo si aporta acción real.

#### **Task 9.5**

Mostrar deadline visible cuando el estado sea accionable.

### **Acceptance Criteria**

* Home y `/macro-picks` muestran el mismo estado base  
* Home no recalcula lógica de macro  
* el usuario entiende qué puede hacer ahora

---

## **CARD 10 — Home UI Screen**

### **Objetivo**

Construir la pantalla `/home` definitiva en `apps/web` mobile-first, simple y accionable.

### **Alcance**

* screen principal  
* bloques Home  
* skeletons  
* empty/partial states  
* CTAs  
* inline ad slot no invasivo

### **Tasks**

#### **Task 10.1**

Crear dominio `apps/web/src/domains/home`.

#### **Task 10.2**

Implementar `home-screen.tsx`.

#### **Task 10.3**

Renderizar orden recomendado:

1. priority card  
2. actionable matches  
3. recent points  
4. macro summary  
5. league summary  
6. ad slot inline secundario

#### **Task 10.4**

Asegurar un CTA principal por bloque.

#### **Task 10.5**

Renderizar deadlines visibles con formato local amigable.

#### **Task 10.6**

No agregar lógica crítica en cliente:

* no recalcular lock  
* no recalcular scoring  
* no recalcular posición

#### **Task 10.7**

Agregar empty/partial states por bloque.

### **Acceptance Criteria**

* la home se entiende en segundos  
* el CTA principal global es obvio  
* mobile-first real  
* sin elementos decorativos innecesarios  
* ads fuera del momento crítico

---

## **CARD 11 — Home Fetching, Cache & Refresh UX**

### **Objetivo**

Resolver fetching y refresh de Home en web sin duplicar requests ni generar parpadeos innecesarios.

### **Alcance**

* hook de query  
* refresh manual  
* revalidación  
* optimistic UI prohibida para lógica crítica

### **Tasks**

#### **Task 11.1**

Crear hook `useHomeQuery`.

#### **Task 11.2**

Configurar staleTime corto/razonable.

#### **Task 11.3**

Permitir pull-to-refresh o refresh explícito simple si la librería/UI lo soporta.

#### **Task 11.4**

Asegurar re-fetch al volver a foco si conviene.

#### **Task 11.5**

Prohibir optimistic updates críticas en Home.

### **Acceptance Criteria**

* la home no hace cascadas innecesarias de requests  
* refresh actualiza la pantalla sin romper navegación  
* el usuario no ve estados imposibles

---

## **CARD 12 — Refresh Jobs & Event Wiring**

### **Objetivo**

Conectar Home con jobs y eventos relevantes del sistema.

### **Alcance**

* dispatcher de refresh  
* deduplicación  
* razones de refresh  
* batch por usuario / liga

### **Tasks**

#### **Task 12.1**

Crear `home-refresh.dispatcher.ts`.

#### **Task 12.2**

Agregar razones de refresh estandarizadas.

#### **Task 12.3**

Conectar dispatcher a:

* save prediction  
* score match  
* save macro  
* confirm adjustment  
* score macro  
* create league  
* join league  
* rebuild standings

#### **Task 12.4**

Agregar deduplicación básica por `userId + reason + time window`.

#### **Task 12.5**

Agregar logs operativos mínimos.

### **Acceptance Criteria**

* Home se refresca al cambiar estados relevantes  
* no hay tormenta de jobs por eventos duplicados  
* la trazabilidad es suficiente para soporte MVP

---

## **CARD 13 — Tests: Domain, Integration, Read Models & UI**

### **Objetivo**

Cubrir la épica end-to-end para que Codex implemente sin ambigüedad y sin regresiones silenciosas.

### **Alcance**

* unit tests  
* integration tests  
* read model tests  
* UI tests

### **Tasks**

#### **Task 13.1 — Unit tests de prioridad**

Cubrir:

* pending matches \> macro incomplete  
* macro adjustment \> recent points  
* recent points \> no leagues  
* no leagues \> empty start

#### **Task 13.2 — Unit tests de league summary**

Cubrir:

* usuario con 0 ligas  
* 1 liga  
* múltiples ligas  
* cambio de posición positivo, negativo y cero

#### **Task 13.3 — Unit tests de recent points feed**

Cubrir:

* solo matches  
* solo macro  
* mezcla ordenada por `scoredAt DESC`  
* no duplicación al recomponer snapshot

#### **Task 13.4 — Unit tests de macro summary**

Cubrir:

* empty  
* draft\_editable  
* submitted\_editable  
* locked\_original  
* adjustment\_available  
* adjusted\_locked  
* scored\_final

#### **Task 13.5 — Integration tests API**

Cubrir:

* `GET /api/v1/home` con usuario nuevo  
* `GET /api/v1/home` con partidos pendientes  
* `GET /api/v1/home` con scoring reciente  
* `GET /api/v1/home` con ligas  
* `GET /api/v1/home` con snapshot stale y rebuild

#### **Task 13.6 — Integration tests de refresh**

Cubrir:

* refresh post save prediction  
* refresh post score match  
* refresh post score macro  
* refresh post join league

#### **Task 13.7 — UI tests mínimos**

Verificar:

* priority card visible  
* CTA por bloque  
* deadline visible en partidos/macro  
* recent points feed visible  
* state partial no rompe pantalla  
* no aparecen referencias a ranking global

### **Acceptance Criteria**

* reglas críticas cubiertas  
* `GET /home` estable  
* snapshot rebuild idempotente  
* estados UX principales cubiertos  
* CI pasa

---

# **14\. Acceptance criteria consolidados de la épica**

* Home se construye con un único endpoint principal  
* El backend entrega estados listos para render  
* Existe `recentPointsFeed` que integra scoring match y macro  
* Existe `leagueSummary` con posición y cambios  
* Existe `macroSummary` con CTA contextual y deadline  
* Existe `priorityCard` con precedencia cerrada  
* Los deadlines son visibles y consistentes  
* No hay lógica crítica en frontend  
* No existe ranking global  
* El payload es pequeño, estable y mobile-first  
* Home soporta empty / loading / partial / locked / scored  
* Los refresh jobs son idempotentes  
* Tests de dominio, integración, read models y UI están implementados

---

# **15\. Riesgos principales**

## **Riesgo 1 — Drift entre home y pantallas fuente**

Si Home deriva estados distintos de `/matches`, `/macro-picks` o `/leagues`, la UX pierde confianza.

### **Mitigación**

Reutilizar exactamente los mismos resolvers/mappers de estado ya cerrados en los dominios fuente.

---

## **Riesgo 2 — Snapshot stale en momentos de kickoff**

La home puede quedar visualmente vieja si no refresca cerca de deadlines.

### **Mitigación**

* on-read fallback rebuild  
* sweep liviano para snapshots cercanos a deadline  
* no confiar únicamente en materialización asíncrona

---

## **Riesgo 3 — Payload inflado**

Si la home intenta reemplazar matches, points y leagues completos, pierde claridad.

### **Mitigación**

* máximo 5 items por lista  
* una sola liga principal  
* resumen, no detalle exhaustivo

---

## **Riesgo 4 — Duplicación de eventos en recent points**

Rebuilds o re-scoring pueden duplicar entries del feed.

### **Mitigación**

Clave estable por:

* `itemType`  
* `itemId`  
* `scoredAt`  
  o equivalente determinístico derivado del log fuente.

---

## **Riesgo 5 — Cálculo client-side accidental**

El frontend puede intentar inferir CTAs, deadlines o posición.

### **Mitigación**

No exponer campos ambiguos.  
Siempre devolver:

* `ctaLabel`  
* `ctaRoute`  
* `status`  
* `isEditable`  
* `isLocked`  
* `positionDelta` ya resuelto

---

# **16\. Entregables concretos**

Al cerrar esta épica deben existir, como mínimo:

### **Backend / Shared**

* contratos `home` en `packages/shared`  
* repositorio `homeSnapshots`  
* servicio `buildHomeSnapshot`  
* engine de prioridad Home  
* `GET /api/v1/home`  
* wiring de refresh por eventos  
* tests unitarios e integración

### **Jobs**

* refresh job por usuario  
* refresh batch para ligas afectadas  
* opcional sweep de freshness

### **Frontend**

* dominio `home`  
* `home-screen.tsx`  
* componentes por bloque:  
  * priority card  
  * actionable matches block  
  * recent points block  
  * macro summary block  
  * league summary block  
* skeletons y empty states  
* tests UI mínimos

### **Documentación interna**

* contrato final de `GET /api/v1/home`  
* notas operativas de refresh  
* lista de razones de invalidación del snapshot