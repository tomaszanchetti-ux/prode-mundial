# Templates de WhatsApp para Launch V1 Free

**Fecha:** 2026-05-03 · **Para:** círculo de amigos cercanos (10-20 personas)

---

## Pre-launch checklist (antes de mandar)

- [ ] Confirmar que app responde OK en https://app.prodemundial.org
- [ ] Confirmar que magic link llega al inbox (test rápido con tu cuenta)
- [ ] Tener tu liga "asado mundial" o como la quieras llamar **YA CREADA** + código copiado a mano
- [ ] Tener el invite link de TU liga listo para pegar (no solo el link genérico)

---

## Opción A — Casual / amigos cercanos (recomendado para arrancar)

Mandar a amigo individual o grupo chico de 3-5:

```
Eh che, armé un prode para el Mundial 2026 ⚽

Pronosticás los partidos, sumás puntos, competimos en una liga privada (somos hasta 20 por liga).

Te metés acá: https://app.prodemundial.org/leagues/join?token=XXXXXXXXXX

Es gratis. Anda en el celu (instalable como app desde el Chrome). Si te trabás avisame.
```

**Notas:**
- Reemplazar `XXXXXXXXXX` por el token real de tu liga
- El link directo te mete a tu liga sin que tengan que copiar código
- Tono casual, sin overselling

---

## Opción B — Para grupo más grande / menos contexto

Si lo mandás a un grupo donde no todos te conocen igual o que necesite más explicación:

```
Buenas! 🏆 Para el Mundial 2026 armé una app de pronósticos:

→ Predecís los 104 partidos (resultado exacto y/o ganador)
→ Sumás puntos según aciertes
→ Competís contra mí y los pibes en la liga privada
→ También elegís quién va a ser campeón, sub, mejor jugador

Es 100% gratis y mobile-first. Se puede instalar como app.

Sumate a la liga: https://app.prodemundial.org/leagues/join?token=XXXXXXXXXX

Reglas completas: https://app.prodemundial.org/rules
```

---

## Opción C — Si querés tease un partido específico

Cuando se acerque el primer kickoff (México vs Sudáfrica, jue 11 jun 21:00 ARG):

```
Falta 1 día para el primer partido del Mundial 🇲🇽 vs 🇿🇦

Última chance de sumarte al prode antes que cierre la primera predicción:
https://app.prodemundial.org/leagues/join?token=XXXXXXXXXX
```

---

## Tips de envío

1. **Mandá de a tandas pequeñas** (3-5 amigos por vez), no a un grupo grande de 20. Razones:
   - Te permite atender dudas individualmente sin que sea caótico
   - Si rompe algo, lo descubrís con poca gente afectada
   - Genera más conversión (mensaje 1-a-1 > mensaje grupal)

2. **Esperá 30 min entre tandas** los primeros 1-2 días — así monitoreás si algo se rompe

3. **Tené listo un mensaje de fallback** si algún amigo dice "no me anda":
   ```
   ¿Qué te aparece? Mandame screenshot. Si no llega el mail, fijate en spam (sender: noreply@prodemundial.org). Si tampoco está, decime y te mando un link directo de invite.
   ```

4. **Pediles feedback explícito** después de 24h:
   ```
   Che, ¿funcó todo? ¿Algo se vio raro? Quiero sacar bugs antes que arranque el Mundial.
   ```
   Esto es ORO — son tus primeros usuarios reales.

---

## Métricas a trackear las primeras 48h

Yo (Claude) puedo monitorearte logs de Cloud Run + errores en console del browser. Decime qué ventana de monitoreo querés:
- Pasivo: te aviso solo si veo errores críticos
- Activo cada 4h: te paso un resumen de "X requests, Y errores, Z signups nuevos"

Sugiero el activo las primeras 24h, después pasivo.

---

## Mensaje para vos mismo (post-launch)

Después de mandar los WhatsApps, escribí en tu Notion / log personal:
- Hora exacta de envío
- A cuántos amigos llegó
- Quién respondió "ok ya entré"
- Quién reportó algún bug
- Cualquier cosa que vos como user notes mientras los amigos lo usan

Esto se vuelve la "fase A.5 launch retro" del proyecto y queda como input para EPIC 28-29 (Gold/Ads/B2B).
