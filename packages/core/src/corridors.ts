// Corridors et logique de tarification saisonnière — alignés sur les enums SQL.

export const SEASONS = ["ete", "hiver", "degel"] as const;
export type Season = (typeof SEASONS)[number];

export const SEASON_LABELS_FR: Record<Season, string> = {
  ete: "Été",
  hiver: "Hiver",
  degel: "Dégel",
};

/** Codes des corridors de démarrage (voir seed SQL, section 11). */
export const CORRIDOR_CODES = ["S-01", "S-02", "N-03", "N-04", "N-05"] as const;
export type CorridorCode = (typeof CORRIDOR_CODES)[number];

export const COVERAGE_LEVELS = ["complete", "partielle", "aucune"] as const;
export type CoverageLevel = (typeof COVERAGE_LEVELS)[number];

/** Facteur routier : 1 m³ = 333 kg (base du poids facturable dimensionnel). */
export const ROAD_DIM_FACTOR_KG_PER_CBM = 333;

/** Poids facturable = max(poids réel, volume × facteur dimensionnel). */
export function chargeableWeightKg(realWeightKg: number, cbm: number): number {
  return Math.max(realWeightKg, cbm * ROAD_DIM_FACTOR_KG_PER_CBM);
}
