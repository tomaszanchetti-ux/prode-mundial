# Deuda técnica — EPIC 11 (UX Fixes Wave 1)

> Creado: WS40 — 15/04/2026
> Estado: abierto
> Revisión: al final del plan UX/UI (post WS5) — decidir si se resolvió solo o requiere fix específico

---

## Contexto

Durante el smoke test manual de `epic/11-ux-fixes-wave-1` (tras Fix #1 Marathon Lock + Fix #2 Nav) se validó:

✅ **Funcionan correctamente:**
- Tu Mundial en bottom-nav posición #3
- Profile movido al header con avatar 44×44 + iniciales

❌ **Pendiente de resolver:**

### 1. Marathon Mode — CTAs inconsistentes
- Algunos CTAs del flujo marathon funcionan, otros no
- No hay patrón claro de cuáles fallan (requiere repro detallado)
- **Hipótesis:** puede estar relacionado con estados derivados del payload (`isEditable`, `predictionOpensAt`, `deadlineAt`) que quedaron con semántica ambigua tras eliminar `SCHEDULED_WAITING_WINDOW`

### 2. Marathon Modal — overflow de viewport
- El modal no entra en pantalla (se sale del viewport vertical)
- Componente: `apps/web/src/components/matches/marathon-prediction-modal.tsx` (474 líneas — ya marcado como candidato a split en WS4)
- **Hipótesis:** layout no mobile-first real, probablemente usa alturas fijas o falta `max-h-screen` + scroll interno

### 3. Marathon Modal — color scheme roto
- El modal sigue renderizándose con fondo azul oscuro
- Debería ser claro (coherente con la migración Stadium Light de FASE 1C / WS35-37)
- **Hipótesis:** tokens hardcodeados o clases CSS legacy que no se migraron en la transición dark → light

---

## Plan de resolución

**No resolver inmediatamente.** Trabajar primero el plan completo de UX/UI (WS1–WS5) en esta misma EPIC:

- **WS1 Foundation** toca tokens, superficies, tipografía → probable que resuelva #3 (color scheme)
- **WS3 Home + Prediction Flow** refactoriza el modal de predicción + score picker → probable que resuelva #2 (overflow) y parte de #1 (CTAs)
- **WS4 Scannability** hace split de `marathon-prediction-modal.tsx` (474 líneas) → probable que clarifique lógica de CTAs (#1)

**Decisión diferida:** al cerrar WS5, hacer smoke test manual nuevamente.
- Si los 3 issues se resolvieron → cerrar deuda
- Si queda algún issue → abrir card específica con repro exacto antes de mergear EPIC 11 a main

---

## Repro steps sugeridos (cuando se revise)

1. Login con usuario de prueba
2. Desde home, abrir Marathon Mode
3. Capturar screenshots de:
   - Modal en primer render (viewport mobile 375×812)
   - Cada CTA del modal (save, next, prev, close) con estado pre/post-click
   - Console logs de errores si los hay
4. Inspeccionar computed styles del modal overlay + container para detectar origen del color oscuro

---

## Referencias

- Branch: `epic/11-ux-fixes-wave-1`
- Commits base: `e1c5669` (marathon lock), `99e8b10` (nav)
- Auditoría previa: agentes Explore que identificaron el marathon modal como componente >150 líneas candidato a split
