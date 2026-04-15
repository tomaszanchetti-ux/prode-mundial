# FASE 2 — UX/UI Elevation Plan

> Definido: WS40 — 15/04/2026
> Autor: Tomás + Claude Code
> Estado: **APROBADO — Ejecución desde WS41**
> EPIC: 11 — UX/UI Elevation
> Branch: `epic/11-ux-fixes-wave-1`

---

## Contexto

Tras desplegar a producción (WS39 / EPIC 10), la app funciona pero se siente "MVP prolijo / dashboard SaaS lavado". Los 3 docs de UX que escribió Tomás (v2, v3, v4, en `/Users/tzanchetti/Documents/NewCo - Proyectos/Prode Mundial/`) convergen en una tesis única.

### Tesis

La app debe pasar de:
- MVP correcto / dashboard oscuro genérico / producto usable pero no deseable

a:
- Producto mobile-first premium con personalidad deportiva, foco brutal en el próximo partido pendiente, identidad Mundial real, densidad mobile agresiva

### Principio rector

Toda decisión de esta fase responde a:

> **"¿Esto hace que la app se sienta más partido-vivo-ahora y menos dashboard-correcto?"**

Si la respuesta es no, no va.

---

## Wave 0 — Fixes inmediatos ✅ DONE (WS40)

1. ✅ Marathon Lock (backend) — predicciones abiertas desde siempre, lock solo 1h antes del kickoff
2. ✅ Tu Mundial en bottom-nav + Profile al header con avatar
3. 🟡 Imagery del Mundial — pospuesto a WS2 (requiere dirección visual + assets que sube Tomás)

Deuda registrada: ver `docs/engineering/TECH_DEBT_EPIC_11.md`

---

## WS1 — Foundation visual

**Objetivo:** El sistema visual deja de sentirse "lavado/uniforme". Prerrequisito de todo lo demás.

**Cards:**

### WS1-C1 — Tokens de superficie
Definir 4 niveles claramente diferenciados:
- `bg` (app background)
- `surface` (bloques principales)
- `surface-raised` (elementos internos que merecen distinción)
- `surface-highlight` (acciones activas, selección, CTA)

Aumentar distancia perceptual entre niveles importantes. Bajar ruido en secundarios.

### WS1-C2 — Escala tipográfica disciplinada
- Hero title: 32–36 semibold/bold
- Section title: 22–24 semibold
- Card title: 18–22 semibold
- Match name: 20–24 bold (solo si es bloque principal)
- Body: 15–16 regular/medium
- Meta: 12–13 medium
- Eyebrow: 11–12 semibold uppercase con tracking leve

Regla: si el bloque no es acción principal del viewport, no puede usar escala hero.

### WS1-C3 — Sistema de pills + status unificado
Taxonomía única:
- `pendiente` → azul tonal
- `editable` → azul fuerte
- `parcial` → ámbar suave
- `definido` → verde suave
- `cerrado` → gris neutro

Todas comparten altura, radio, peso tipográfico, padding.

### WS1-C4 — Radios + bordes + sombras con jerarquía
- Hero/modal/CTA principal → radio premium consistente
- Cards normales → radio menor
- Pills/estados → radio compacto
- Chips/tabs → radio limpio

Strokes secundarios mucho más sutiles. Sombras con moderación, profundidad por contraste + blur sutil. No look web card library.

### WS1-C5 — Split de monolitos
- `packages/ui/components.tsx` (630 líneas) → 10 archivos separados
- Extraer `Metric` duplicado 3× (leagues/rankings/league-detail) a UI package
- Reducir 35-45% de containers anidados decorativos
- Eliminar las 64 instancias sobrevivientes de `style={{...}}` (excepto safe-area + dinámicos)

### WS1-C6 — Consolidar sistema de notificaciones
De 3 patrones a 2:
- `<Toast />` — transient, sticky top, auto-dismiss
- `<InlineNotification />` — bloqueante, in-flow
- Cero dependencias nuevas (la infra CSS ya existe)

**Criterio de aceptación WS1:** comparación A/B de 2 pantallas debe verse más profundo, menos "inflado en vertical", más editorial.

---

## WS2 — Identidad Mundial

**Objetivo:** La app deja de ser "neutra", empieza a sentirse Mundial 2026.

**Cards:**

### WS2-C1 — TeamIdentity component robusto
```tsx
<TeamIdentity
  team={team}
  size="sm | md | lg"
  showFlag
  showName
  showCode={false}
  emphasis="default | hero | compact"
/>
```

Resuelve bandera + nombre + alineación + truncado + variantes. Reemplaza lógica dispersa en 7+ archivos.

### WS2-C2 — Sistema de banderas robusto
- Auditar cobertura (48 SVGs actuales para 32 selecciones clasificadas)
- Helper central `getTeamFlag(team)` con fallbacks: iso2 → fifaCode → team.id → monograma digno
- NUNCA usar siglas en círculos como solución principal — solo fallback técnico
- Log warning en dev si falla

### WS2-C3 — Imagery del Mundial
Tomás sube assets a `apps/web/public/mundial/` o `apps/web/public/brand/`.

Tipos necesarios:
- Hero/splash (1200×800) — landing, home in-tournament
- Background pattern tileable (500×500) — app body
- Team avatars/escudos (64×64, 128×128) — match cards, standings
- Empty state illustrations (400×400) — zero states
- Stadium/field (800×300) — tournament, macro-picks
- Stage badges (60×60) — group / R16 / QF / SF / Final
- PWA splash brandeado (512×512)

**Flag legal:** OK para demo/testing con amigos. Review antes de launch público (FIFA es agresiva con marcas registradas).

### WS2-C4 — Acentos de evento
Sin kitsch, agregar microseñales de torneo:
- Divisores con carácter
- Badges de fase
- Tratamiento especial de cruces/eliminatorias
- Pequeños gestos visuales inspirados en evento internacional (no en panel de gestión)

---

## WS3 — Home hero + prediction flow

**Objetivo:** El próximo partido pendiente domina el primer viewport. El modal de predicción es la joya del producto.

### WS3-C1 — Home hero
`NextMatchHero` único, dominante, banderas grandes, CTA azul full-width inequívoco.

CTAs compitiendo hoy (`Continuar` + `Macro Picks` + `Ver calendario`) → **un solo primario** + 1 ghost.

Progreso baja a `ProgressCompact` (no card gigante con "16/73 partidos").

Macro Picks baja jerarquía (link secundario o acceso dentro de otra sección).

### WS3-C2 — Mini-stat cards con carácter
Cerrados / en juego / pendientes — número protagonista, label corto, color semántico sutil, sin frases largas debajo.

### WS3-C3 — Bloque social en home
`Tu liga hoy`:
- Liga activa
- Posición actual
- Distancia al #1
- CTA `Ver tabla`
- CTA inline `Invitar amigos`

### WS3-C4 — Modal/Sheet de predicción refactor
Jerarquía: contexto del partido → duelo con banderas → score picker → CTA principal → navegación secundaria.

- Fullscreen sheet / bottom sheet enfocada
- Progress bar visible: `Paso 3 de 42 pendientes`
- Feedback de guardado: loading inline en CTA (no toast torpe si hay continuidad)

### WS3-C5 — ScorePicker rediseñado
- Tap target mínimo 88×88
- Número grande, protagonista
- Botones +/- táctiles, no "input utility"
- Cada lado coherente: bandera + país + stepper
- NO parecer calculadora ni formulario

### WS3-C6 — CTA hierarchy en modal
- `Guardar y seguir` → primario absoluto (si hay next pendiente)
- `Guardar predicción` → primario si no hay next
- `Anterior` → secondary outline
- `Saltar por ahora` / `Más tarde` → tertiary ghost

Nunca dos botones compitiendo con peso similar.

### WS3-C7 — Auto-avance post-save
- Guardar actual → feedback breve → abrir siguiente pendiente automáticamente
- No mandar al usuario de vuelta a la lista

---

## WS4 — Scannability full-stack

**Objetivo:** Cada pantalla de lista se escanea rápido. Reducir "peso de dashboard".

### WS4-C1 — Split de componentes grandes
- `matches-screen.tsx` (499 líneas) → Header + FilterBar + Hero + List + States
- `match-detail-screen.tsx` (481 líneas) → Header + Form + Status
- `marathon-prediction-modal.tsx` (474 líneas) → Progress + Header + Form + Controls
- `macro-picks-screen.tsx` (460 líneas) → Hero + MetaInfo
- `leagues-screen.tsx` (400 líneas) → CreateForm + JoinForm + ActionResult + List
- `tournament-screen.tsx` (338 líneas) → Header + GroupTableCards

### WS4-C2 — CompactMatchCard
- Altura 15-20% menor
- Layout más horizontal
- Pick integrado como badge, no subcard separada
- Estado "Disponible pronto" → pill informativa tonal apagada (no pseudo-CTA azul)

### WS4-C3 — Filter pills refinadas
- Más compactas, menos altura
- Active state claro sin parecer segundo CTA primario
- Sticky al scroll
- Scroll horizontal suave con padding lateral correcto

### WS4-C4 — GroupTableCard + Tu Mundial
- Top 2 resaltados (acento lateral + badge `Clasifica`)
- Estado del grupo: `Parcial` / `Definido` / `Abierto`
- Copy: `Así va quedando el Grupo A` en vez de label técnico
- Banderas en cada row

### WS4-C5 — Backend endpoint `/standings/projected`
Server-driven standings proyectados (los docs v2+v3+v4 lo exigen). No cálculos optimistas client-side.

Hoy: `tournament-screen.tsx` carga grupos y proyecta en cliente. Mover a backend: endpoint devuelve ya las standings calculadas según las predicciones del usuario.

### WS4-C6 — Rankings / Leagues polish
- Copy: `Ranking materializado` → `Tabla de posiciones`
- `LeagueSwitcher` si >2 ligas (pill segmented o dropdown, no botones apilados)
- Detalle social en header de liga: miembros + estado open/closed + código compartible + CTA `Invitar`
- Usuario actual detectable en <1 segundo (highlight elegante, no parche)
- Altura de rows menor, ranking con más fuerza
- Top 3 con sutileza (no circo)

---

## WS5 — Copy cleanup + polish final

### WS5-C1 — Copy surgery
Reemplazos binding:

| Elimina | Reemplaza |
|---|---|
| `Ranking materializado` | `Tabla de posiciones` |
| `Ocultar join` | collapse con chevron |
| `Progreso global` | `Tu avance` o eliminar |
| `Disponible pronto` | `Abre cuando se confirme el cruce` |
| `Parcial` | solo si el sistema lo justifica claramente |
| `Seguís desde acá` | eliminar |
| `Cargando tus ligas...` | skeleton |
| `Tu espacio para competir con amigos` | eliminar |
| `Toca guardar para confirmar tu predicción` | eliminar (el CTA ya lo dice) |

Principio: corto, claro, accionable, deportivo, sin tono interno ni staging.

### WS5-C2 — Skeletons reales
Home, fixtures, rankings, ligas, mis puntos — estructura final reconocible, shimmer sutil. Sin copy dominante "Cargando...".

### WS5-C3 — Microinteracciones
- Apertura/cierre suave del sheet
- Feedback al tocar +/-
- Transición limpia al guardar
- Cambio de estado con sensación de continuidad

Sutiles, no gimmicky.

### WS5-C4 — Error states concretos
- Timeout al guardar predicción
- Fallo de sync de resultado
- Retry flow elegante
- Mensajes sin tono técnico

### WS5-C5 — Perfil en single-column real
Eliminar pseudo-doble-columna mobile. Stack vertical:
1. Header corto
2. Card de identidad
3. Nombre + país + CTA guardar
4. Stats compactas en mini-grid 2×2
5. Card cuenta + logout

### WS5-C6 — Cleanup de flags huérfanas
- `MATCH_PREDICTION_WINDOW_HOURS` de `constants/matches.ts`
- `PRODE_ENABLE_LAB_PREDICTIONS` de env config

### WS5-C7 — Smoke test final + revisión de deuda EPIC 11
Validar los 3 issues de marathon registrados en `TECH_DEBT_EPIC_11.md`:
- CTAs inconsistentes
- Modal fuera de viewport
- Modal azul oscuro

Si están resueltos por el refactor → cerrar deuda. Si queda algo → card específica.

---

## Criterios de aceptación FASE 2

La fase se considera aprobada solo si se cumple todo:

### Home
- Próximo partido domina primer viewport
- CTA principal único e inequívoco
- Macro Picks no compite al mismo nivel
- Progreso con presencia pero sin look dashboard

### Partidos
- Bandera + nombre en todos los teams
- Lista escanea rápido (densidad +15-20%)
- Filter bar liviano
- CTA principal en 1 segundo

### Modal
- Se siente como pieza más refinada del producto
- Score picker táctil, no formulario
- Una sola acción primaria inequívoca
- Continuidad guardar → siguiente

### Tu Mundial / Standings
- Top 2 clasificados se leen instantáneamente
- Banderas en cada row
- Estado de grupo sin esfuerzo
- Backend server-driven

### Leagues / Rankings
- Competencia social, no admin
- Top 3 + usuario actual con mejor jerarquía
- Empty/loading reales (no staging)

### Navigation
- Bottom nav más ligera
- Header discreto
- Más altura útil para contenido

### Copy
- Cero tono interno / técnico / staging
- Orientado a acción
- Deportivo y sobrio

### Sistema general
- Menos cajas, menos ruido
- Más tensión deportiva
- Identidad Mundial visible
- Sensación "producto que quiero abrir todos los días del Mundial"

---

## Orden de ejecución

**WS1 → WS2 → WS3 → WS4 → WS5** (confirmado por Tomás)

No saltar orden. WS1 es base. WS2 agrega identidad. WS3 levanta el core del producto. WS4 pule listados + backend. WS5 es cleanup final.

---

## Post-FASE 2

1. **PoC Champions League** (1F backlog) — beta real con amigos sobre v1 pulida
2. **FASE 3 Pre-launch:** SEO, analytics (Firebase), error boundaries, push notifications (FCM), perf

---

## Mecánica de trabajo

- Una card por turno
- Tomás confirma con "perf" antes de avanzar
- Sin build con dev activo
- Leer solo lo necesario
- Commits atómicos en la branch `epic/11-ux-fixes-wave-1`
- No mergear a main hasta cerrar EPIC completa
- Código en inglés, commits/docs en español

## Estimación

**9-12 sesiones (WS41 a WS52 aproximadamente)**
