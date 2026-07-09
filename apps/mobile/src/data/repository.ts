// Repository : l'UNIQUE porte des écrans vers les données.
// Lectures = SQLite. Écritures = outbox (jamais Supabase directement).
import * as FileSystem from "expo-file-system";
import { getDb } from "./db";
import { enqueue } from "./outbox";
import type {
  MissionWithShipments,
  PodInput,
  PodPayload,
  ShipmentLocal,
  StatusPayload,
} from "./types";

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
  has_pod: number;
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
    hasPod: (r.has_pod ?? 0) === 1,
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

/**
 * Preuve de livraison :
 *   1. copie les fichiers (photos + signature) dans un dossier LOCAL PERSISTANT
 *      → ils survivent au mode avion / à un redémarrage jusqu'à l'upload.
 *   2. marque « livré » + « POD déposé » en local (optimiste, lecture seule).
 *   3. enfile l'action dans l'outbox (upload déterministe + RPC submit_pod).
 */
export async function submitPod(input: PodInput): Promise<void> {
  const dir = `${FileSystem.documentDirectory}pods/${input.shipmentId}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const photoUris: string[] = [];
  for (let i = 0; i < input.photoUris.length; i++) {
    const dest = `${dir}photo-${i}.jpg`;
    await FileSystem.copyAsync({ from: input.photoUris[i]!, to: dest });
    photoUris.push(dest);
  }

  let signatureUri: string | null = null;
  if (input.signatureBase64) {
    signatureUri = `${dir}signature.png`;
    const b64 = input.signatureBase64.replace(/^data:image\/\w+;base64,/, "");
    await FileSystem.writeAsStringAsync(signatureUri, b64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  const db = await getDb();
  await db.runAsync(
    "UPDATE shipments SET status = 'livre', has_pod = 1 WHERE id = ?",
    input.shipmentId,
  );

  const payload: PodPayload = {
    missionId: input.missionId,
    shipmentId: input.shipmentId,
    photoUris,
    signatureUri,
    signeeName: input.signeeName,
    damages: input.damages,
    notes: input.notes,
    capturedAt: input.capturedAt,
    lat: input.lat,
    lng: input.lng,
  };
  await enqueue("pod", payload);
}
