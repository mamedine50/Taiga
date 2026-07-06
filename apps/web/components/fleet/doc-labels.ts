export const DOC_TYPES = [
  "assurance_cargo",
  "assurance_responsabilite",
  "pevl",
  "permis_conduire",
  "immatriculation",
  "autre",
] as const;

export const DOC_TYPE_KEY: Record<string, string> = {
  assurance_cargo: "docs.typeAssuranceCargo",
  assurance_responsabilite: "docs.typeAssuranceResp",
  pevl: "docs.typePevl",
  permis_conduire: "docs.typePermis",
  immatriculation: "docs.typeImmat",
  autre: "docs.typeAutre",
};

export const DOC_STATUS_KEY: Record<string, string> = {
  en_attente: "docs.statusEnAttente",
  valide: "docs.statusValide",
  expire: "docs.statusExpire",
  refuse: "docs.statusRefuse",
};

export const DOC_STATUS_CLASS: Record<string, string> = {
  en_attente: "text-tertiary border-tertiary/40 bg-tertiary/10",
  valide: "text-success border-success/40 bg-success/10",
  expire: "text-error border-error/40 bg-error/10",
  refuse: "text-error border-error/40 bg-error/10",
};
