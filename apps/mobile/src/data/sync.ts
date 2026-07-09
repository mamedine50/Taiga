// Moteur de synchronisation (PULL) : remplit SQLite depuis Supabase.
// L'UI ne lit JAMAIS Supabase — elle lit SQLite (via le repository).
import { getDb } from "./db";
import { supabase } from "./supabase";

type ShipRow = {
  id: string;
  ref: string;
  status: string | null;
  origin_address: string;
  origin_city: string;
  dest_address: string;
  dest_city: string;
  chargeable_weight_kg: number | null;
};

export async function syncFromServer(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  const companyId = profile?.company_id;
  if (!companyId) return;

  // Identité au niveau entreprise (v1) : missions acceptées / en cours.
  const { data: missions } = await supabase
    .from("missions")
    .select("id, status, carrier_payout_amount, departure_id")
    .eq("carrier_company_id", companyId)
    .in("status", ["acceptee", "en_cours"]);
  const list = missions ?? [];

  const links = list.length
    ? (
        await supabase
          .from("mission_shipments")
          .select(
            "mission_id, shipments(id, ref, status, origin_address, origin_city, dest_address, dest_city, chargeable_weight_kg)",
          )
          .in(
            "mission_id",
            list.map((m) => m.id),
          )
      ).data ?? []
    : [];

  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync("DELETE FROM missions; DELETE FROM shipments;");

    for (const m of list) {
      await db.runAsync(
        "INSERT OR REPLACE INTO missions (id, status, carrier_payout, departure_id) VALUES (?, ?, ?, ?)",
        m.id,
        m.status ?? "acceptee",
        m.carrier_payout_amount ?? 0,
        m.departure_id ?? null,
      );
    }

    for (const l of links) {
      const s = l.shipments as unknown as ShipRow | null;
      if (!s) continue;
      await db.runAsync(
        "INSERT OR REPLACE INTO shipments (id, mission_id, ref, status, origin_address, origin_city, dest_address, dest_city, chargeable_weight_kg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        s.id,
        l.mission_id,
        s.ref,
        s.status ?? "assigne",
        s.origin_address,
        s.origin_city,
        s.dest_address,
        s.dest_city,
        s.chargeable_weight_kg,
      );
    }
  });
}
