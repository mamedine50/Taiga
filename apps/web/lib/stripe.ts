import Stripe from "stripe";

// Client Stripe côté serveur, instancié PARESSEUSEMENT (à la requête) : au build,
// STRIPE_SECRET_KEY est absente et Stripe lèverait une erreur si on l'appelait tôt.
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  }
  return client;
}

/** Montant en cents (Stripe travaille en plus petite unité monétaire). */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
