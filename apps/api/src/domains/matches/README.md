# Matches Domain

## World Cup 2026 base seed

Usa el fixture canónico en `data/world-cup-2026-canonical-matches.json` como base reproducible para sembrar:

- `teams`
- `groups`
- `matches`

Script:

```bash
pnpm --filter @prode/api seed:wc2026 -- --dry-run
pnpm --filter @prode/api seed:wc2026
```

Notas:

- el script escribe con `merge: true`, así que puede re-ejecutarse sin borrar otros campos ya existentes
- conserva metadata útil para el próximo backend real: `officialMatchNumber`, `venueId`, `homeSlot`, `awaySlot`, `kickoffAtEt`
- materializa una mezcla mínima de estados dev útiles:
  - grupo abierto
  - knockout abierto
  - partido live bloqueado
  - partido finished scored
  - partido finished unscored
