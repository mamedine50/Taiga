// Rôles et types d'entreprise — alignés sur les enums SQL `user_role` / `company_type`.

export const USER_ROLES = ["shipper", "carrier", "driver", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const COMPANY_TYPES = ["shipper", "carrier"] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

/** Libellés d'affichage (français d'abord). */
export const USER_ROLE_LABELS_FR: Record<UserRole, string> = {
  shipper: "Expéditeur",
  carrier: "Transporteur",
  driver: "Chauffeur",
  admin: "Administrateur",
};
