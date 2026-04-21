/**
 * Mock roster de candidatos a Balón de Oro del Mundial 2026.
 *
 * ~40 jugadores estrella con cobertura de los equipos favoritos. Es la fuente
 * de verdad del front y backend hasta que FIFA publique el roster oficial
 * post 15/05/2026. En ese momento se hace un swap (data-only) sin tocar
 * infra.
 *
 * Reglas:
 *   - `playerId` es un slug estable — no renombrar una vez en prod sin plan
 *     de migración (picks huérfanos).
 *   - `teamId` sigue el fifaCode existente en `team-identity.ts` /
 *     `world-cup-2026.ts`.
 *   - `position` es informativa para la UI (chip).
 *   - Se excluye Italia (no clasificada a FIFA 2026) y cualquier equipo no
 *     presente en los grupos A..L.
 */

export type BestPlayerPosition = "GK" | "DEF" | "MID" | "FWD";

export type BestPlayerRosterEntry = {
  playerId: string;
  name: string;
  teamId: string;
  position: BestPlayerPosition;
  club: string;
};

export const BEST_PLAYER_ROSTER: readonly BestPlayerRosterEntry[] = [
  // Argentina
  { playerId: "ply-messi", name: "Lionel Messi", teamId: "ARG", position: "FWD", club: "Inter Miami" },
  { playerId: "ply-julian-alvarez", name: "Julián Álvarez", teamId: "ARG", position: "FWD", club: "Atlético Madrid" },
  { playerId: "ply-lautaro-martinez", name: "Lautaro Martínez", teamId: "ARG", position: "FWD", club: "Inter" },
  { playerId: "ply-enzo-fernandez", name: "Enzo Fernández", teamId: "ARG", position: "MID", club: "Chelsea" },

  // Brasil
  { playerId: "ply-vinicius-jr", name: "Vinícius Jr", teamId: "BRA", position: "FWD", club: "Real Madrid" },
  { playerId: "ply-rodrygo", name: "Rodrygo", teamId: "BRA", position: "FWD", club: "Real Madrid" },
  { playerId: "ply-neymar", name: "Neymar", teamId: "BRA", position: "FWD", club: "Santos" },

  // Francia
  { playerId: "ply-mbappe", name: "Kylian Mbappé", teamId: "FRA", position: "FWD", club: "Real Madrid" },
  { playerId: "ply-griezmann", name: "Antoine Griezmann", teamId: "FRA", position: "FWD", club: "Atlético Madrid" },
  { playerId: "ply-tchouameni", name: "Aurélien Tchouaméni", teamId: "FRA", position: "MID", club: "Real Madrid" },

  // España
  { playerId: "ply-lamine-yamal", name: "Lamine Yamal", teamId: "ESP", position: "FWD", club: "Barcelona" },
  { playerId: "ply-rodri", name: "Rodri", teamId: "ESP", position: "MID", club: "Manchester City" },
  { playerId: "ply-pedri", name: "Pedri", teamId: "ESP", position: "MID", club: "Barcelona" },
  { playerId: "ply-nico-williams", name: "Nico Williams", teamId: "ESP", position: "FWD", club: "Athletic Club" },

  // Inglaterra
  { playerId: "ply-bellingham", name: "Jude Bellingham", teamId: "ENG", position: "MID", club: "Real Madrid" },
  { playerId: "ply-kane", name: "Harry Kane", teamId: "ENG", position: "FWD", club: "Bayern Munich" },
  { playerId: "ply-foden", name: "Phil Foden", teamId: "ENG", position: "MID", club: "Manchester City" },

  // Alemania
  { playerId: "ply-wirtz", name: "Florian Wirtz", teamId: "GER", position: "MID", club: "Bayer Leverkusen" },
  { playerId: "ply-musiala", name: "Jamal Musiala", teamId: "GER", position: "MID", club: "Bayern Munich" },
  { playerId: "ply-havertz", name: "Kai Havertz", teamId: "GER", position: "FWD", club: "Arsenal" },

  // Portugal
  { playerId: "ply-ronaldo", name: "Cristiano Ronaldo", teamId: "POR", position: "FWD", club: "Al Nassr" },
  { playerId: "ply-bruno-fernandes", name: "Bruno Fernandes", teamId: "POR", position: "MID", club: "Manchester United" },
  { playerId: "ply-rafael-leao", name: "Rafael Leão", teamId: "POR", position: "FWD", club: "Milan" },

  // Holanda
  { playerId: "ply-van-dijk", name: "Virgil van Dijk", teamId: "NED", position: "DEF", club: "Liverpool" },
  { playerId: "ply-gakpo", name: "Cody Gakpo", teamId: "NED", position: "FWD", club: "Liverpool" },
  { playerId: "ply-de-jong", name: "Frenkie de Jong", teamId: "NED", position: "MID", club: "Barcelona" },

  // Uruguay
  { playerId: "ply-valverde", name: "Federico Valverde", teamId: "URU", position: "MID", club: "Real Madrid" },
  { playerId: "ply-darwin-nunez", name: "Darwin Núñez", teamId: "URU", position: "FWD", club: "Liverpool" },

  // Croacia
  { playerId: "ply-modric", name: "Luka Modrić", teamId: "CRO", position: "MID", club: "Real Madrid" },
  { playerId: "ply-gvardiol", name: "Joško Gvardiol", teamId: "CRO", position: "DEF", club: "Manchester City" },

  // Bélgica
  { playerId: "ply-de-bruyne", name: "Kevin De Bruyne", teamId: "BEL", position: "MID", club: "Manchester City" },
  { playerId: "ply-lukaku", name: "Romelu Lukaku", teamId: "BEL", position: "FWD", club: "Napoli" },

  // Colombia
  { playerId: "ply-james-rodriguez", name: "James Rodríguez", teamId: "COL", position: "MID", club: "Rayo Vallecano" },
  { playerId: "ply-luis-diaz", name: "Luis Díaz", teamId: "COL", position: "FWD", club: "Liverpool" },

  // Noruega
  { playerId: "ply-haaland", name: "Erling Haaland", teamId: "NOR", position: "FWD", club: "Manchester City" },

  // África / Asia / Américas
  { playerId: "ply-salah", name: "Mohamed Salah", teamId: "EGY", position: "FWD", club: "Liverpool" },
  { playerId: "ply-hakimi", name: "Achraf Hakimi", teamId: "MAR", position: "DEF", club: "PSG" },
  { playerId: "ply-mane", name: "Sadio Mané", teamId: "SEN", position: "FWD", club: "Al Nassr" },
  { playerId: "ply-son", name: "Son Heung-min", teamId: "KOR", position: "FWD", club: "Tottenham" },
  { playerId: "ply-kubo", name: "Takefusa Kubo", teamId: "JPN", position: "FWD", club: "Real Sociedad" },
  { playerId: "ply-mitoma", name: "Kaoru Mitoma", teamId: "JPN", position: "FWD", club: "Brighton" },
  { playerId: "ply-pulisic", name: "Christian Pulisic", teamId: "USA", position: "FWD", club: "Milan" },
  { playerId: "ply-santi-gimenez", name: "Santiago Giménez", teamId: "MEX", position: "FWD", club: "Milan" }
] as const;

const PLAYER_BY_ID = new Map(BEST_PLAYER_ROSTER.map((p) => [p.playerId, p]));

export function getBestPlayerById(playerId: string): BestPlayerRosterEntry | null {
  return PLAYER_BY_ID.get(playerId) ?? null;
}

export function isValidBestPlayerId(playerId: string): boolean {
  return PLAYER_BY_ID.has(playerId);
}
