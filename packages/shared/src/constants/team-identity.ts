export type StaticTeamIdentity = {
  fifaCode: string;
  iso2: string;
  iso3: string;
  flagAsset: string;
};

const TEAM_IDENTITY_BY_FIFA_CODE: Record<string, StaticTeamIdentity> = {
  ALG: { fifaCode: "ALG", iso2: "dz", iso3: "dza", flagAsset: "/flags/dz.svg" },
  ARG: { fifaCode: "ARG", iso2: "ar", iso3: "arg", flagAsset: "/flags/ar.svg" },
  AUS: { fifaCode: "AUS", iso2: "au", iso3: "aus", flagAsset: "/flags/au.svg" },
  AUT: { fifaCode: "AUT", iso2: "at", iso3: "aut", flagAsset: "/flags/at.svg" },
  BEL: { fifaCode: "BEL", iso2: "be", iso3: "bel", flagAsset: "/flags/be.svg" },
  BIH: { fifaCode: "BIH", iso2: "ba", iso3: "bih", flagAsset: "/flags/ba.svg" },
  BRA: { fifaCode: "BRA", iso2: "br", iso3: "bra", flagAsset: "/flags/br.svg" },
  CAN: { fifaCode: "CAN", iso2: "ca", iso3: "can", flagAsset: "/flags/ca.svg" },
  CIV: { fifaCode: "CIV", iso2: "ci", iso3: "civ", flagAsset: "/flags/ci.svg" },
  COD: { fifaCode: "COD", iso2: "cd", iso3: "cod", flagAsset: "/flags/cd.svg" },
  COL: { fifaCode: "COL", iso2: "co", iso3: "col", flagAsset: "/flags/co.svg" },
  CPV: { fifaCode: "CPV", iso2: "cv", iso3: "cpv", flagAsset: "/flags/cv.svg" },
  CRO: { fifaCode: "CRO", iso2: "hr", iso3: "hrv", flagAsset: "/flags/hr.svg" },
  CUW: { fifaCode: "CUW", iso2: "cw", iso3: "cuw", flagAsset: "/flags/cw.svg" },
  CZE: { fifaCode: "CZE", iso2: "cz", iso3: "cze", flagAsset: "/flags/cz.svg" },
  ECU: { fifaCode: "ECU", iso2: "ec", iso3: "ecu", flagAsset: "/flags/ec.svg" },
  EGY: { fifaCode: "EGY", iso2: "eg", iso3: "egy", flagAsset: "/flags/eg.svg" },
  ENG: { fifaCode: "ENG", iso2: "gb", iso3: "gbr", flagAsset: "/flags/gb-eng.svg" },
  ESP: { fifaCode: "ESP", iso2: "es", iso3: "esp", flagAsset: "/flags/es.svg" },
  FRA: { fifaCode: "FRA", iso2: "fr", iso3: "fra", flagAsset: "/flags/fr.svg" },
  GER: { fifaCode: "GER", iso2: "de", iso3: "deu", flagAsset: "/flags/de.svg" },
  GHA: { fifaCode: "GHA", iso2: "gh", iso3: "gha", flagAsset: "/flags/gh.svg" },
  HAI: { fifaCode: "HAI", iso2: "ht", iso3: "hti", flagAsset: "/flags/ht.svg" },
  IRN: { fifaCode: "IRN", iso2: "ir", iso3: "irn", flagAsset: "/flags/ir.svg" },
  IRQ: { fifaCode: "IRQ", iso2: "iq", iso3: "irq", flagAsset: "/flags/iq.svg" },
  JOR: { fifaCode: "JOR", iso2: "jo", iso3: "jor", flagAsset: "/flags/jo.svg" },
  JPN: { fifaCode: "JPN", iso2: "jp", iso3: "jpn", flagAsset: "/flags/jp.svg" },
  KOR: { fifaCode: "KOR", iso2: "kr", iso3: "kor", flagAsset: "/flags/kr.svg" },
  KSA: { fifaCode: "KSA", iso2: "sa", iso3: "sau", flagAsset: "/flags/sa.svg" },
  MAR: { fifaCode: "MAR", iso2: "ma", iso3: "mar", flagAsset: "/flags/ma.svg" },
  MEX: { fifaCode: "MEX", iso2: "mx", iso3: "mex", flagAsset: "/flags/mx.svg" },
  NED: { fifaCode: "NED", iso2: "nl", iso3: "nld", flagAsset: "/flags/nl.svg" },
  NOR: { fifaCode: "NOR", iso2: "no", iso3: "nor", flagAsset: "/flags/no.svg" },
  NZL: { fifaCode: "NZL", iso2: "nz", iso3: "nzl", flagAsset: "/flags/nz.svg" },
  PAN: { fifaCode: "PAN", iso2: "pa", iso3: "pan", flagAsset: "/flags/pa.svg" },
  PAR: { fifaCode: "PAR", iso2: "py", iso3: "pry", flagAsset: "/flags/py.svg" },
  POR: { fifaCode: "POR", iso2: "pt", iso3: "prt", flagAsset: "/flags/pt.svg" },
  QAT: { fifaCode: "QAT", iso2: "qa", iso3: "qat", flagAsset: "/flags/qa.svg" },
  RSA: { fifaCode: "RSA", iso2: "za", iso3: "zaf", flagAsset: "/flags/za.svg" },
  SCO: { fifaCode: "SCO", iso2: "gb", iso3: "gbr", flagAsset: "/flags/gb-sct.svg" },
  SEN: { fifaCode: "SEN", iso2: "sn", iso3: "sen", flagAsset: "/flags/sn.svg" },
  SUI: { fifaCode: "SUI", iso2: "ch", iso3: "che", flagAsset: "/flags/ch.svg" },
  SWE: { fifaCode: "SWE", iso2: "se", iso3: "swe", flagAsset: "/flags/se.svg" },
  TUN: { fifaCode: "TUN", iso2: "tn", iso3: "tun", flagAsset: "/flags/tn.svg" },
  TUR: { fifaCode: "TUR", iso2: "tr", iso3: "tur", flagAsset: "/flags/tr.svg" },
  URU: { fifaCode: "URU", iso2: "uy", iso3: "ury", flagAsset: "/flags/uy.svg" },
  USA: { fifaCode: "USA", iso2: "us", iso3: "usa", flagAsset: "/flags/us.svg" },
  UZB: { fifaCode: "UZB", iso2: "uz", iso3: "uzb", flagAsset: "/flags/uz.svg" }
};

export type ResolvedTeamIdentity = {
  fifaCode: string | null;
  iso2: string | null;
  iso3: string | null;
  flagAsset: string | null;
  flagUrl: string | null;
};

export function getTeamIdentityByFifaCode(fifaCode: string | null | undefined): StaticTeamIdentity | null {
  if (!fifaCode) {
    return null;
  }

  return TEAM_IDENTITY_BY_FIFA_CODE[fifaCode] ?? null;
}

export function resolveTeamIdentity(
  fifaCode: string | null | undefined,
  flagUrl: string | null | undefined = null
): ResolvedTeamIdentity {
  const identity = getTeamIdentityByFifaCode(fifaCode);

  return {
    fifaCode: identity?.fifaCode ?? fifaCode ?? null,
    iso2: identity?.iso2 ?? null,
    iso3: identity?.iso3 ?? null,
    flagAsset: identity?.flagAsset ?? null,
    flagUrl: flagUrl ?? null
  };
}

export function resolveTeamFlagSrc(identity: Pick<ResolvedTeamIdentity, "flagAsset" | "flagUrl">) {
  return identity.flagAsset ?? identity.flagUrl ?? null;
}
