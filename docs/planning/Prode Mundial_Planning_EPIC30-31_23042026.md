# Prode Mundial — Sesión de Planning (EPIC 30 + 31 + Reordenamiento)

**Fecha:** 23/04/2026
**Tipo:** Sesión de estrategia / replanning (no WS de código)
**Output:** Roadmap actualizado, 2 EPICs nuevas creadas (30 y 31), plan canónico reescrito.

---

## Contexto de entrada

- EPIC 26 (PWA Install Flow) cerrada el 22/04/2026 (merge `0beffe8`, PR #4).
- Main limpio, sin commits pendientes.
- Próximo arranque ambiguo en memoria: "EPIC 27 Data Dummy Cleanup o EPIC 28 Ads (decisión pendiente)".

## Decisiones tomadas en esta sesión

### 1. Reordenamiento: 27 al final

**Original:** 27 (cleanup) → 28 (ads) → 29 (stripe).

**Nuevo:** 28 → 29 → 31 → **27 al final**.

**Motivo:** mantener data dummy como red de seguridad durante Ads, Gold y B2B. Limpiar al final garantiza que ninguna feature nueva rompió algo invisible que solo se vería con usuarios reales.

### 2. Nueva EPIC 30 — Dominio + Landing + AdSense setup

Se descubrió que AdSense requiere dominio propio con páginas About/Privacy/Terms/Contact para approval, y que Tomás no tiene el dominio comprado. Eso abre la oportunidad de adelantar la estrategia de landing y B2B.

**Arquitectura de dominios acordada:**
- `prodemundial.org` → landing marketing + B2B (repo nuevo, deploy Vercel)
- `app.prodemundial.org` → app actual (Firebase App Hosting custom domain)

**Registrar:** Cloudflare Registrar (no GoDaddy).
- Motivos: precio al costo mayorista (~$10/año .org), WHOIS privacy gratis, DNS integrado, sin upsells.

### 3. Nueva EPIC 31 — B2B flow + páginas `/[empresa]`

**Scope:**
- Páginas dinámicas `prodemundial.org/[empresa]` con branding custom (ej: `/renault`)
- Lead capture B2B + auto-onboarding de empleados a liga privada via email corporativo
- Vive en el **mismo repo de landing** (no en la app)

**Fuera de scope (se difiere):**
- Dashboard B2B admin (HR ve standings internos, export, premios) → repo app o repo aparte, EPIC futura post-Mundial

### 4. Ads: solo en app, no en landing

**Aprobación AdSense:** se pide para dominio raíz `prodemundial.org` (cubre subdominios automáticamente).

**Renderizado:** únicamente en `app.prodemundial.org`. Landing queda sin ads en v1 para maximizar conversion (B2C signup + B2B lead).

### 5. Límite de 3 ligas free → a EPIC 29

**Diagnóstico:** no implementado en backend (`apps/api/src/domains/leagues/use-cases/create-league.ts` sin guard). Solo existe `LEAGUE_MEMBER_LIMIT` (miembros por liga, ≠ ligas por usuario).

**Implementación en EPIC 29:** `MAX_LEAGUES_FREE = 3` con bypass si `user.plan === 'gold'`.

### 6. AdSense vs Ezoic/Mediavine (educativo)

- **AdSense:** eCPM $1-3, approval días, requisitos bajos. Correcto para tráfico pre-Mundial.
- **Ezoic/Mediavine:** eCPM $8-15 (2-4x) pero exige volumen (Mediavine 50k sesiones/mes). Migración post-Mundial si se pega volumen (~1 día de trabajo).

---

## Orden final de ejecución

| # | EPIC | Duración | Status |
|---|---|---|---|
| 1 | **30** Dominio + Landing + AdSense submit | 1 sem + approval async 1-2 sem | ⏳ ARRANCA WS1 en próxima sesión |
| 2 | **29** Gold/Stripe + límite 3 ligas + isGold + bypass ads | 1 sem | Paralelo mientras espera AdSense approval |
| 3 | **28** Ads integration (consume AdSense aprobado) | 3-4 días | Pausa EPIC 29 cuando approval llega |
| 4 | **31** B2B flow `/[empresa]` + lead capture | 2-3 sem | Después de ads vivos |
| 5 | **27** Data dummy cleanup | 2 días | Pre-launch |

---

## Diagnóstico de placements actuales (AdSlotCard placeholder)

Relevado en esta sesión vía grep `AdSlotCard`:

- ✅ `/home` (pre + in-tournament) — 1 slot
- ✅ `/world-cup` — 1 slot
- ✅ `/tournament` — N slots chunked entre matches
- ✅ `/leagues` — 2 slots (revisar densidad en WS3 de EPIC 28)
- ❌ `/leagues/[leagueId]` — falta
- ❌ `/matches` — falta
- ❌ `/rankings` — falta
- 🔒 `/matches/[matchId]`, `/picks`, `/macro-picks/*`, `/profile` — sin ads intencionalmente (formularios críticos)

`AdSlotCard` actual es solo un placeholder visual (card con texto "Espacio reservado para patrocinio nativo"). EPIC 28 WS2 lo reemplaza por componente real con `<ins class="adsbygoogle">`.

---

## Artefactos actualizados

- `~/.claude/projects/.../memory/project_prode_closing_plan.md` → plan canónico reescrito
- `~/.claude/projects/.../memory/MEMORY.md` → próximo arranque, arquitectura dominios, política ads, gap límite ligas

---

## Próxima sesión

**EPIC 30 WS1 — Compra del dominio en Cloudflare + DNS setup básico.**

Pre-requisito: Tomás compra `prodemundial.org` en Cloudflare Registrar antes de arrancar la sesión. Si ya lo compró en GoDaddy (plan B), arrancamos con transfer a Cloudflare que toma ~7 días.

**Deliverable de la sesión:** dominio comprado, DNS configurado con CNAMEs placeholder listos para WS2 (custom domain en Firebase App Hosting).
