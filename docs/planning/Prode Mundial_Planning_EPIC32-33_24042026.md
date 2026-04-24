# Prode Mundial — Planning EPIC 32 + 33

**Fecha:** 2026-04-24
**Contexto:** Tras finalización de EPIC 30 (Dominio + Landing + AdSense submit), antes de retomar EPIC 29 (Gold/Stripe). Tomás pasó la app a un grupo de amigos y recopiló feedback estructurado.

**Supersedes orden previo:** `project_prode_closing_plan.md` (23/04/2026) ponía EPIC 29 como siguiente. Se inserta EPIC 32 + 33 antes para incorporar feedback de usuarios reales y ganar discoverability en Android previo a monetización.

---

## Contexto del feedback

**Input:** `PRODE MUNDIAL — Feedback recibido - PLAN FINAL (QUIRÚRGICO, v1).md` (NewCo - Proyectos).

**Hallazgos clave del feedback:**
- Disonancia visual landing ↔ app ("me llevó a otro lugar"): landing es dark+gold, app es Stadium Light+azul. Plantea alinear ambos al mismo sistema visual.
- Prompts automáticos (notificaciones + PWA install) son invasivos. Sugerencia: reemplazar por card opt-in en Home.
- Modal de predicción: "Saltar" es ambiguo, debería llamarse "Completar después".
- Copy "amigos" posiciona mal para B2B futuro. Preferir "colegas" (ES) / "friends" (EN).
- Label "Grupos" (en Predicciones) confunde. Preferir "Partidos".

**Decisiones Tomás (24/04):**
1. **Espejar landing a app (light), NO la app a dark.** Mantener dorado como accent (no como primary). Primary queda azul `#0052CC`.
2. **Sumar TWA Android a Play Store.** App Store iOS diferido post-Mundial (repo web queda limpio).
3. **NO clonar repo para Enterprise.** Sigue siendo multi-tenancy en el mismo repo cuando arranque EPIC 31.

---

## EPIC 32 — Feedback Pass

**Duración estimada:** 4-5 días
**Branch:** `epic/32-feedback-pass`
**Objetivo:** incorporar feedback quirúrgico + resolver disonancia visual + fix API del modal antes de retomar monetización.

### WS1 — Tokens gold accent

**Scope:**
- Definir hex exacto de gold para light mode (contraste AA legible sobre `#FFFFFF` y `#F0F1F3`). Candidato inicial: `#B8860B` o `#A57C1B`. Validar con contrast checker.
- Agregar token `gold` a Tailwind config en `packages/ui/tailwind/` (o equivalente).
- Documentar regla de uso: gold solo en hero, OG, badges premium. Primary queda `#0052CC`.

**Deliverable:** nuevo token disponible para WS2.

### WS2 — Gold accent en hero + OG + alineación fina

**Scope:**
- Aplicar gold al hero de Home de la app (acento en score, countdown, elementos destacados).
- Regenerar OG image con gold accent (mantener diseño actual).
- Verificar consistencia landing ↔ app: tipografías, estilos de botones, inputs. Fix desvíos menores.

**Deliverable:** hero Home con gold, OG actualizada.

### WS3 — Copy "amigos" → "colegas" (ES only)

**Scope:**
- Grep exhaustivo en `apps/web/src/**/*.tsx`, `apps/web/src/**/*.ts`, meta tags, share previews.
- Replace en ES. EN queda "friends" intocado.
- Landing (`prode-mundial-landing`): mismo pass.
- OG image copy: "con tus amigos" → "con tus colegas".
- Meta descriptions ambos repos.

**Regla crítica:** NO tocar variables internas, keys técnicas, nombres de componentes, URLs.

### WS4 — Label "Grupos" → "Partidos"

**Scope:**
- Cambio de label en pantalla Predicciones únicamente.
- NO tocar backend, estructura de datos, ni naming técnico.

**Deliverable:** 1-2 strings cambiadas.

### WS5 — Modal API refactor (3 efectos distintos)

**Contexto técnico:** hoy en `packages/ui/src/prediction-modal.tsx:107-113`, el botón "Saltar" llama a `onClose` — idéntico a la "X" (línea 57-61). No hay diferenciación funcional.

**Scope:**
- Agregar prop opcional `onSkip?: () => void` a `PredictionModalProps` en `packages/ui/src/types.ts`.
- Agregar botón "Completar después" en el modal que dispara `onSkip` (si está definido). Si no, ocultar el botón.
- "X" del header queda solo en `onClose` (efecto: cerrar modal sin avanzar).
- `saveLabel`/`onSubmit` queda igual: guardar + avanzar.
- Actualizar wrapper `apps/web/src/components/matches/quick-prediction-modal.tsx`:
  - Recibir nuevo callback `onSkip` desde el padre.
  - Pasar `onSkip` al `PredictionModal`.
- Padre (lugar donde se usa `QuickPredictionModal`) implementa lógica: "ir al siguiente match pendiente sin guardar".

**Efectos finales:**
| Acción | Callback | Efecto |
|---|---|---|
| "Guardar y seguir" | `onSubmit` → `onSaved` | Guarda + avanza al siguiente |
| "Completar después" (nuevo) | `onSkip` | Avanza al siguiente sin guardar |
| "X" | `onClose` | Cierra modal, NO avanza |

### WS6 — Eliminar prompts automáticos + PermissionCard

**Scope:**
- Identificar dónde se dispara el prompt automático de notificaciones (probablemente en algún effect al login o post-primer-pick).
- Identificar trigger automático de PWA install (memoria menciona WS de EPIC 26 que introdujo `recordPickCompletion` en `pick-install-trigger`).
- Remover triggers automáticos.
- Nuevo component `PermissionCard` (o similar) en Home, arriba de "Próximo partido" o primer scroll.
- 2 variantes con copy exacto del feedback doc:
  - **Notificaciones:** "Activá notificaciones" / "Te avisamos antes de que cierre tu pronóstico." / [Activar] [Ahora no]
  - **Instalación:** "Instalá Prode Mundial" / "Accedé más rápido desde tu pantalla de inicio." / [Instalar] [Más tarde]
- Comportamiento: mostrar solo 1 vez por usuario, persistir decisión en `localStorage`.
- Priorizar cuál mostrar primero si ambas aplican (notif primero si el navegador soporta).

### WS7 — Checklist consistencia visual

**Scope:** pass rápido de UI por:
- Login (Google button)
- Home (hero, cards, modulo "Próximo partido")
- Modal de partido
- Lista de partidos
- Estados vacíos (ej. liga sin ligas, tournament sin picks)
- Cards genéricas
- Botones (primary, ghost, danger)

**Fix:** ajustes menores para que todo "parezca parte del mismo sistema visual". No rediseño.

### WS8 — QA E2E + merge

**Scope:**
- Tomás valida flujo completo en dev.
- QA sub-agente sobre `git diff main` completo.
- Resolver findings.
- Merge a main con aprobación explícita de Tomás.

---

## EPIC 33 — TWA Android (Play Store)

**Duración estimada:** 3-5 días + ~1 semana Google review async
**Repo nuevo:** `prode-mundial-android` (independiente del repo web)
**Ejecutable en paralelo con EPIC 29** (repo aparte, zero conflictos).

**Objetivo:** discoverability en Play Store sin contaminar el repo web. Apple App Store queda diferido post-Mundial.

### Contexto técnico — qué es TWA

Trusted Web Activity: wrapper Android que carga una PWA en pantalla completa sin chrome de navegador. Requiere:
- Dominio verificado vía `assetlinks.json` en `/.well-known/`.
- PWA con manifest válido + HTTPS + Service Worker (ya cumplimos).
- APK/AAB generado con Bubblewrap o template manual en Android Studio.

**Ventajas:**
- Repo web intocable.
- Updates de la PWA se propagan automáticamente al app (no requiere re-publicar a menos que cambies icon/name/package).
- Costo: $25 one-time Play Console, no recurring.

### WS1 — `assetlinks.json` en dominio

**Scope:**
- Generar SHA-256 fingerprint de la signing key Android (se define en WS2 primero si no existe).
- Publicar `/.well-known/assetlinks.json` en `app.prodemundial.org`:
  ```json
  [{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "org.prodemundial.app",
      "sha256_cert_fingerprints": ["<SHA256>"]
    }
  }]
  ```
- Verificar que Firebase App Hosting sirve el file correctamente (headers, CORS, accesible vía HTTPS).

**Deliverable:** URL pública `https://app.prodemundial.org/.well-known/assetlinks.json` devolviendo el JSON.

### WS2 — Scaffold TWA con Bubblewrap

**Scope:**
- Instalar `@bubblewrap/cli` en nueva máquina local.
- Ejecutar `bubblewrap init --manifest https://app.prodemundial.org/manifest.webmanifest`.
- Configurar:
  - Package name: `org.prodemundial.app` (o similar, hay que verificar disponibilidad en Play).
  - App name: "Prode Mundial"
  - Launch URL: `https://app.prodemundial.org`
  - Orientación, tema, splash colors.
- Icons: reusar del PWA manifest (adaptive icons).
- Generar signing key local (mantener backup seguro — si se pierde, no se puede actualizar el app).
- Repo nuevo `prode-mundial-android` en GitHub personal o en nueva org.

**Deliverable:** proyecto Android Studio compilable localmente.

### WS3 — Build AAB + Play Console setup

**Scope:**
- Generar Android App Bundle firmado con la key de WS2.
- Alta cuenta Google Play Console ($25 one-time, cuenta personal Tomás).
- Crear nuevo app en la consola:
  - Título: "Prode Mundial"
  - Descripción corta + larga (copy TBD).
  - Categoría: Deportes.
  - Content rating: questionnaire IARC.
  - Screenshots: generar 6-8 de la app en móvil.
  - Feature graphic + icon 512x512.
  - Privacy policy URL: reusar de prodemundial.org.
- Upload AAB a Internal Testing track primero (smoke test).
- Promote a Production cuando OK.

### WS4 — Submit review + monitoreo

**Scope:**
- Submit a production review.
- Review async Google (típicamente 3-7 días).
- Si rejection: atender feedback, re-submit.
- Si approval: app live en Play Store.
- Event analítico: `twa_install` (para tracking) — opcional, requiere bridge Bubblewrap.

---

## Roadmap actualizado

| # | EPIC | Estado | Arranca |
|---|---|---|---|
| 1 | **32 — Feedback Pass** ⭐ | ACTIVA | Ahora (24/04/2026) |
| 2 | **33 — TWA Android** | Planeada | Paralelo con 29 (repo aparte) |
| 3 | 29 — Gold/Stripe | Pausada | Post 32 |
| 4 | 28 — Ads integration | Espera AdSense approval | Cuando Google apruebe |
| 5 | 31 — B2B Flow | Planeada | Post 29 |
| 6 | 27 — Data cleanup | Planeada | Pre-launch |
| 7 | 21/22 | Reactivas | Durante Mundial (post 11/06) |
| 8 | iOS App Store (Capacitor) | Diferido | Post-Mundial |

---

## Notas operativas

- EPIC 32 abre branch `epic/32-feedback-pass` en repo principal.
- EPIC 33 abre repo nuevo `prode-mundial-android` (no afecta repo web).
- Merge de EPIC 32 a main requiere QA sub-agente + aprobación Tomás.
- EPIC 29 Gold/Stripe retoma con WS1 (modelo `plan` en Firestore) apenas cerramos 32.
- Pre-WS3 de EPIC 29 sigue pendiente: validar flujo Stripe España → Wise USD USA.
