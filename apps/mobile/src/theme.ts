// Design system « Nuit boréale » pour React Native (mode sombre).
export const colors = {
  bg: "#0B121E",
  surface: "#121C2C",
  surface2: "#18243A",
  border: "#22314A",
  text: "#EDF3F8",
  muted: "#8FA1B8",
  tertiary: "#5C6E85",
  action: "#FF7A29",
  live: "#3FD9C2",
  success: "#5BD98A",
  error: "#FF5D5D",
} as const;

export const radius = { card: 12, btn: 9, pill: 100 } as const;

/** Couleur d'un statut d'expédition (mêmes conventions que le web). */
export function statusColor(status: string): string {
  switch (status) {
    case "livre":
    case "complete":
      return colors.success;
    case "en_transit":
    case "ramassage":
    case "assigne":
      return colors.action;
    case "annule":
    case "litige":
      return colors.error;
    default:
      return colors.muted;
  }
}

export const statusLabelFr: Record<string, string> = {
  assigne: "Assigné",
  ramassage: "Ramassage",
  en_transit: "En transit",
  livre: "Livré",
  complete: "Complété",
};
