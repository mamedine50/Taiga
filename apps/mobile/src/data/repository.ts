// Repository : l'UNIQUE porte des écrans vers les données.
// Lectures = SQLite. Écritures = outbox (jamais Supabase directement).
import { getDb } from "./db";
import { enqueue } from "./outbox";
import type { MissionWithShipments, PodPayload, ShipmentLocal, StatusPayload } from "./types";

type MissionRow = {
  id: string;
  status: string;
  carrier_payout: number;
  departure_id: string | null;
};
type ShipmentRow = {
  id: string;
  mission_id: string;
  ref: string;
  status: string;
  origin_address: string;
  origin_city: string;
  dest_address: string;
  dest_city: string;
  chargeable_weight_kg: number | null;
};

function mapShipment(r: ShipmentRow): ShipmentLocal {
  return {
    id: r.id,
    missionId: r.mission_id,
    ref: r.ref,
    status: r.status,
    originAddress: r.origin_address,
    originCity: r.origin_city,
    destAddress: r.dest_address,
    destCity: r.dest_city,
    chargeableWeightKg: r.chargeable_weight_kg,
  };
}

export async function getMissions(): Promise<MissionWithShipments[]> {
  const db = await getDb();
  const missions = await db.getAllAsync<MissionRow>("SELECT * FROM missions ORDER BY id");
  const ships = await db.getAllAsync<ShipmentRow>("SELECT * FROM shipments");
  return missions.map((m) => ({
    id: m.id,
    status: m.status,
    carrierPayout: m.carrier_payout,
    departureId: m.departure_id,
    shipments: ships.filter((s) => s.mission_id === m.id).map(mapShipment),
  }));
}

export async function getMission(id: string): Promise<MissionWithShipments | null> {
  const all = await getMissions();
  return all.find((m) => m.id === id) ?? null;
}

/** Met à jour le statut d'une expédition : optimiste en local + enfile l'action. */
export async function markStatus(p: StatusPayload): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE shipments SET status = ? WHERE id = ?", p.status, p.shipmentId);
  await enqueue("status", p);
}

/** Preuve de livraison : marque livré en local + enfile l'action (upload + insert). */
export async function submitPod(p: PodPayload): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE shipments SET status = 'livre' WHERE id = ?", p.shipmentId);
  await enqueue("pod", p);
}
