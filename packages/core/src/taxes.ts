// Taxes du Québec — miroir côté client de la logique SQL `quote_shipment`.

/** TPS (taxe fédérale sur les produits et services). */
export const GST_RATE = 0.05;

/** TVQ (taxe de vente du Québec). */
export const QST_RATE = 0.09975;

export interface TaxBreakdown {
  subtotal: number;
  gst: number;
  qst: number;
  total: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Applique TPS + TVQ sur un sous-total.
 * NOTE : la source de vérité reste la fonction SQL `quote_shipment` ;
 * cette fonction sert à l'affichage et aux estimations côté client.
 */
export function applyQuebecTaxes(subtotal: number): TaxBreakdown {
  const s = round2(subtotal);
  const gst = round2(s * GST_RATE);
  const qst = round2(s * QST_RATE);
  return { subtotal: s, gst, qst, total: round2(s + gst + qst) };
}
