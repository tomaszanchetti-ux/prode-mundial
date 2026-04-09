# **Prode Mundial \- TECH DECISIONS.md**

## **1\. Propósito del documento**

Este documento congela las **decisiones técnicas oficiales** del MVP de Prode Mundial.

Su objetivo es:

* evitar que Codex infiera arquitectura durante la implementación  
* transformar supuestos técnicos en definiciones explícitas  
* alinear frontend, backend, jobs, admin e infraestructura  
* reducir retrabajo, forks técnicos innecesarios y deuda por decisiones implícitas

Este documento es **binding** para toda implementación del MVP.

---

## **2\. Principios técnicos rectores**

### **2.1 Simplicidad operativa primero**

El MVP debe usar una arquitectura suficientemente sólida, pero sin introducir complejidad enterprise innecesaria.

### **2.2 Backend como fuente de verdad**

Toda lógica crítica de negocio vive en backend/jobs, no en frontend.

### **2.3 Read models simples**

El sistema debe privilegiar lecturas rápidas y payloads claros, aunque eso implique persistir datos precomputados.

### **2.4 Event-driven por hitos**

El sistema reacciona a eventos relevantes:

* kickoff  
* fin de partido  
* cierre de fase  
* ajustes  
* recálculos admin

No se busca realtime continuo.

### **2.5 Idempotencia obligatoria**

Todo proceso batch o recálculo debe poder re-ejecutarse sin corromper datos.

### **2.6 Mobile-first real**

Las decisiones técnicas del frontend deben priorizar rendimiento, claridad y velocidad de interacción en móvil.

### **2.7 Contratos antes que implementación**

API contracts, estados y modelos compartidos deben definirse primero y respetarse durante el código.

---

## **3\. Arquitectura oficial del MVP**

La arquitectura oficial del MVP es:

* **Frontend web app:** Next.js  
* **Backend API:** Node.js \+ TypeScript sobre Cloud Run  
* **Jobs batch/event-driven:** Node.js \+ TypeScript sobre Cloud Run Jobs  
* **Base de datos:** Firestore  
* **Autenticación:** Firebase Auth  
* **Scheduler:** Cloud Scheduler  
* **Hosting web:** Vercel  
* **Storage/ops auxiliares si hiciera falta:** GCP

Esta dirección es consistente con el modelo ya definido en el spec técnico de datos/backend.

---

## **4\. Decisiones oficiales por capa**

# **4.1 Frontend**

## **Framework**

**Next.js** como framework principal de la app web.

## **Razones**

* velocidad de ejecución para MVP  
* excelente ergonomía con React \+ TypeScript  
* buen soporte para rutas públicas y protegidas  
* simple despliegue en Vercel  
* ecosistema sólido para mobile-first web app

## **Modo de producto**

* web app responsive  
* no app nativa en MVP  
* no PWA compleja obligatoria en v1  
* se puede dejar base preparada para futura evolución

## **Decisión de rendering**

Usar estrategia híbrida:

* páginas públicas: SSR/SSG según convenga  
* páginas autenticadas: client-driven o server-assisted según necesidad  
* no sobre-optimizar SSR en flujos internos si agrega complejidad innecesaria

## **Regla**

La elección de rendering debe obedecer a UX, auth y simplicidad, no a perfeccionismo técnico.

---

# **4.2 Backend API**

## **Runtime**

Node.js \+ TypeScript

## **Forma**

API REST JSON bajo `/api/v1`

## **Hosting**

Cloud Run

## **Razones**

* despliegue simple  
* stateless  
* buen encaje con jobs y servicios GCP  
* facilidad de evolución  
* consistencia con modelo event-driven del backend

## **Regla**

No construir backend “serverless fragmentado” tipo muchas funciones pequeñas si eso complica trazabilidad y testing del MVP.

---

# **4.3 Jobs**

## **Runtime**

Node.js \+ TypeScript

## **Ejecución**

Cloud Run Jobs \+ Cloud Scheduler \+ disparos controlados por backend/admin

## **Responsabilidades**

* lock de predicciones por kickoff  
* scoring de partidos  
* scoring macro  
* rebuild de standings  
* recálculos manuales  
* reparaciones controladas

## **Regla**

Jobs separados de la API.  
No mezclar lógica batch dentro de handlers HTTP.

---

# **4.4 Base de datos**

## **Base oficial**

**Firestore**

## **Modelo**

NoSQL document-oriented con read models materializados.

## **Razones**

* velocidad de ejecución para MVP  
* integración natural con Firebase Auth  
* buen encaje con snapshots y documentos precomputados  
* permite construir rápido sin esquema relacional rígido  
* consistente con el data model ya propuesto.

## **Trade-off asumido**

Se acepta denormalización controlada a cambio de lecturas simples y costo operativo razonable.

---

# **4.5 Autenticación**

## **Proveedor**

**Firebase Auth**

## **Métodos incluidos**

* Google login  
* magic link por email

## **Métodos fuera de MVP**

* Apple  
* Facebook  
* phone auth  
* password-based auth clásico

Esto está alineado con la definición funcional vigente.

## **Regla**

El backend valida Firebase ID tokens enviados como Bearer token.

---

# **4.6 Hosting y despliegue**

## **Web**

**Vercel**

## **API \+ Jobs**

**Google Cloud Run**

## **Scheduler**

**Cloud Scheduler**

## **Observación**

Se acepta una arquitectura mixta Vercel \+ GCP porque optimiza velocidad de desarrollo y despliegue para cada capa.

---

## **5\. Lenguaje, toolchain y monorepo**

### **Lenguaje oficial**

TypeScript

### **Package manager**

pnpm

### **Monorepo**

sí, obligatorio

### **Task runner**

Turborepo o equivalente simple

### **Linting / formatting**

* ESLint  
* Prettier

### **Testing**

* Vitest o Jest para unit/integration  
* Playwright para e2e web si se implementa e2e en MVP

### **Regla**

No introducir múltiples toolchains para resolver problemas menores.

---

## **6\. Política de API**

# **6.1 Estilo**

REST JSON sobre HTTPS.

# **6.2 Base path**

`/api/v1`

# **6.3 Payloads**

camelCase en API pública.

# **6.4 Envelope**

Respuestas exitosas:

{  
  "ok": true,  
  "data": {}  
}

Errores:

{  
  "ok": false,  
  "error": {  
    "code": "SOME\_ERROR",  
    "message": "Mensaje legible",  
    "details": {}  
  }  
}

Esto ya fue definido en la especificación de API.

# **6.5 Reglas**

* frontend no asume lógica implícita  
* API debe devolver estados interpretables  
* contracts estables  
* errores explícitos  
* null cuando un valor no aplica  
* IDs opacos string

---

## **7\. Política de validación**

### **Principio**

Validar en ambos lados cuando mejore UX, pero la validación fuente de verdad vive en backend.

### **Frontend**

Validación de:

* campos requeridos  
* formatos básicos  
* mensajes inmediatos de UX

### **Backend**

Validación obligatoria de:

* auth  
* deadlines  
* ownership  
* integridad de payloads  
* restricciones del dominio  
* locking  
* constraints de macro picks  
* reglas de knockout

### **Regla**

Nunca confiar en validación exclusivamente client-side.

---

## **8\. Política de fechas, horas y timezone**

### **Timezone fuente de verdad**

UTC en backend, DB y contratos internos.

### **Display**

La UI puede convertir a hora local del usuario para visualización.

### **Reglas**

* deadlines se evalúan en backend contra UTC  
* kickoff se considera exacto  
* no hay grace periods  
* no hay tolerancias por latencia de cliente

### **Principio**

La verdad temporal del sistema no depende del reloj del navegador.

Esto es consistente con lo ya definido en functional y API.

---

## **9\. Política de IDs y naming técnico**

### **IDs**

Todos los IDs son strings opacos.

Ejemplos:

* `userId`  
* `matchId`  
* `leagueId`  
* `teamId`  
* `predictionId`

### **Regla**

No exponer semántica innecesaria en los IDs públicos.

### **Naming**

* camelCase en API  
* snake\_case puede existir en persistencia interna si conviene, pero idealmente mantener consistencia por capa  
* kebab-case para archivos  
* PascalCase para tipos/componentes

---

## **10\. Política de datos y persistencia**

# **10.1 Filosofía**

* write optimized  
* read simple  
* denormalización controlada  
* estados derivados críticos persistidos

# **10.2 Qué se persiste**

* predicciones  
* macro picks  
* resultados oficiales  
* puntos otorgados  
* acumulados  
* standings de liga  
* logs de scoring/recalc  
* flags de lock  
* snapshots necesarios

# **10.3 Qué no se recalcula on-demand permanentemente**

* standings completos de ligas  
* acumulados complejos  
* ventanas de ranking  
* scoring histórico completo en cada request

Esto ya está reflejado en el spec de backend/data model.

---

## **11\. Política de scoring y recálculo**

### **Regla central**

El scoring es **post-evento**, no realtime continuo.

### **Eventos habilitantes**

* partido finalizado  
* cierre de fase de grupos  
* ajuste confirmado  
* recálculo admin

### **Propiedades obligatorias**

* determinístico  
* idempotente  
* trazable  
* reparable

### **Regla**

Siempre dejar auditabilidad mínima del scoring ejecutado.

---

## **12\. Política de standings y competencia**

### **Decisión oficial**

El MVP no tiene ranking global.

### **Competencia visible**

* standings por liga  
* posición del usuario dentro de cada liga  
* puntos personales  
* resumen de puntos recientes

Esto está alineado con el cambio de lógica costo-eficiente y con el canon del MVP.

### **Regla**

Toda pantalla, endpoint o read model que asuma ranking global queda fuera del MVP.

### **Política adicional de planes de liga**

El MVP operativo trabaja solo con una capacidad fija por liga:

* `memberLimit = 20`

Reglas:

* no hay checkout ni billing runtime en MVP
* no hay upload de logo ni branding premium en MVP
* joins y lecturas derivadas deben respetar capacidad y estado activo/inactivo
* `plus` y `business` quedan documentados como roadmap post-MVP, no como alcance de implementación actual

---

## **13\. Política de frontend state management**

### **Principio**

Usar la solución más simple que funcione.

### **Recomendación**

* server state: TanStack Query o equivalente  
* UI local state: React state / form state local  
* evitar global stores complejos salvo necesidad clara

### **Regla**

No introducir Redux/MobX/Zustand si el caso no lo exige realmente.

### **Criterio**

La mayor parte del estado de producto es:

* remoto  
* derivado de API  
* con lifecycle claro

Por eso conviene un enfoque centrado en server state.

---

## **14\. Política de formularios**

### **Recomendación**

* React Hook Form o solución liviana equivalente  
* schemas compartidos cuando agreguen valor

### **Regla**

La capa de forms debe ser predecible, no excesivamente abstracta.

### **No hacer**

No construir un mega framework interno de formularios para el MVP.

---

## **15\. Política de componentes UI**

### **Principio**

UI simple, reusable y mobile-first.

### **Separación**

* componentes base reutilizables en `packages/ui`  
* componentes de negocio dentro de cada dominio

### **Regla**

No meter lógica de scoring, deadlines o standings en componentes visuales.

---

## **16\. Política de ads**

### **Monetización MVP**

Ads inline no invasivos.

### **Ubicaciones permitidas**

* home  
* rankings/ligas  
* separadores no críticos

### **Ubicaciones prohibidas**

* antes de guardar predicción  
* al abrir input crítico  
* interrupciones en confirmaciones clave

Esto sigue la especificación funcional.

### **Implementación**

La integración de ads debe estar encapsulada en componentes específicos y ser removible/feature-flaggeable si hace falta.

---

## **17\. Política de analytics**

### **Objetivo**

Medir activación, recurrencia y uso core del producto.

### **Eventos mínimos**

* landing viewed  
* login started  
* login completed  
* profile completed  
* match prediction saved  
* macro picks saved  
* adjustment submitted  
* league created  
* league joined  
* home viewed  
* league detail viewed  
* points viewed

### **Regla**

No instrumentar analytics caótico pantalla por pantalla sin taxonomía mínima.

### **Decisión**

Los nombres de eventos y propiedades deben vivir en un módulo compartido o guía específica.

---

## **18\. Política de notificaciones**

### **MVP**

No incluye push nativo obligatorio.

### **Sí incluye**

* recordatorios in-app  
* emails transaccionales mínimos para magic link  
* posibilidad de emails funcionales simples si luego se agrega

### **Regla**

No construir infraestructura avanzada de notificaciones en MVP.

---

## **19\. Política de admin y operaciones**

### **Admin MVP**

Debe ser mínimo pero suficiente.

### **Funciones esperadas**

* corregir fixtures/resultados  
* disparar recálculos  
* revisar estado básico de jobs  
* operar manualmente situaciones excepcionales

### **Regla**

No construir un panel complejo. Solo lo necesario para sostener el torneo con seguridad operativa.

---

## **20\. Política de observabilidad**

### **MVP**

Observabilidad pragmática, no enterprise full stack.

### **Mínimos obligatorios**

* logs estructurados en API y jobs  
* correlation ID o job execution ID cuando aplique  
* logs de errores con contexto suficiente  
* trazabilidad de scoring/recalc

### **Deseable**

* error tracking centralizado  
* métricas simples por job

### **Regla**

No dejar procesos críticos como scoring sin trazabilidad básica.

---

## **21\. Política de errores**

### **Principio**

Errores explícitos, estables y usables por frontend.

### **Categorías**

* auth  
* validación  
* negocio  
* sistema

### **Ejemplos**

* `UNAUTHENTICATED`  
* `FORBIDDEN`  
* `MATCH_LOCKED`  
* `ADJUSTMENT_NOT_AVAILABLE`  
* `LEAGUE_NOT_FOUND`  
* `VALIDATION_ERROR`  
* `INTERNAL_ERROR`

Ya definidos en la API spec.

### **Regla**

No devolver errores genéricos si existe una razón funcional identificable.

---

## **22\. Política de seguridad**

### **Autenticación**

Firebase ID token validado en backend.

### **Autorización**

Siempre chequear ownership y membership del recurso.

### **Principios mínimos**

* no exponer datos privados de otros usuarios  
* no confiar en client-supplied permissions  
* no permitir acciones sobre ligas/recursos ajenos sin validación  
* sanitizar inputs y payloads  
* proteger endpoints admin

### **Regla**

La seguridad MVP debe ser real, aunque la infraestructura no sea compleja.

---

## **23\. Política de seeds, fixtures y datos de prueba**

### **Objetivo**

Permitir desarrollo y testing sin depender siempre de fuentes externas.

### **Debe existir**

* seed de equipos  
* seed de grupos  
* seed de fixtures  
* seed de usuarios/liga demo  
* escenarios de resultados simulados

### **Regla**

Los seeds deben ser reproducibles y controlados por scripts, no cargados manualmente como costumbre.

---

## **24\. Política de fuente de verdad deportiva**

### **Decisión**

Para MVP, la fuente de verdad de fixtures/resultados debe abstraerse detrás de un módulo o proveedor interno.

### **Regla**

Nunca acoplar frontend directamente a un proveedor externo de datos deportivos.

### **Implementación recomendada**

* backend/provider layer  
* posibilidad de ingesta manual/admin como fallback  
* normalización interna del modelo de partido

### **Importante**

Aunque el proveedor exacto pueda definirse luego, el sistema debe diseñarse para que:

* el partido normalizado interno sea la verdad del sistema  
* la fuente externa sea reemplazable  
* el admin pueda corregir inconsistencias

---

## **25\. Política de feature flags**

### **MVP**

Solo usar flags si resuelven una necesidad real:

* ads on/off  
* admin-only experiments  
* módulos no listos para producción

### **Regla**

No llenar el MVP de flags por paranoia.

---

## **26\. Decisiones explícitamente descartadas para MVP**

* no ranking global  
* no realtime WebSocket continuo  
* no native app  
* no microservicios múltiples  
* no arquitectura event bus compleja  
* no base relacional por defecto  
* no panel admin sofisticado  
* no motor de notificaciones avanzado  
* no overengineering de design system  
* no provider lock duro en datos deportivos

---

## **27\. Riesgos asumidos conscientemente**

### **27.1 Firestore implica denormalización**

Aceptado porque acelera MVP y simplifica lecturas.

### **27.2 Arquitectura mixta Vercel \+ GCP**

Aceptada porque optimiza cada capa, aunque agregue un mínimo de coordinación extra.

### **27.3 No hay ranking global**

Aceptado porque reduce complejidad y costo, y la capa social principal vive en ligas.

### **27.4 No hay realtime continuo**

Aceptado porque el loop de producto funciona bien con actualización post-evento.

---

## **28\. Reglas para Codex**

* no cambiar stack sin actualizar este documento  
* no introducir librerías estructurales nuevas sin necesidad real  
* no mover lógica crítica al frontend  
* no asumir ranking global  
* no reemplazar Firestore por otra DB por preferencia técnica  
* no introducir infraestructura compleja no pedida  
* si una task exige romper una decisión aquí definida, primero debe escalarse documentalmente

---

## **29\. Definición técnica de éxito del MVP**

La base técnica del MVP es correcta cuando:

* la web funciona fluida en móvil  
* la API expone contratos estables y claros  
* el backend bloquea, scorea y recalcula correctamente  
* los standings de liga son consistentes  
* el sistema tolera retries y recálculos sin corrupción  
* el admin puede operar el torneo sin fricción grave  
* la arquitectura permite construir rápido sin desorden estructural

---

## **30\. Filosofía final**

**La tecnología del MVP no debe impresionar por sofisticación.**  
**Debe ganar por claridad, velocidad de ejecución y confiabilidad operativa.**

Toda decisión técnica futura debe evaluarse contra esa regla.

---
