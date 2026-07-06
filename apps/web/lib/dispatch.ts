import { createClient } from "@/lib/supabase/server";

export type AssignableShipment = {
  id: string;
  ref: string;
  originCity: string;
  destCity: string;
  subtotal: number | null;
  chargeableWeightKg: number | null;
  requestedDate: string;
};

/** Expéditions cotées, pas encore offertes/assignées (vue admin). */
export async function getAssignableShipments(): Promise<AssignableShipment[]> {
  const supabase = await createClient();

  const { data: ships } = await supabase
    .from("shipments")
    .select("id, ref, origin_city, dest_city, subtotal, chargeable_weight_kg, requested_date")
    .eq("status", "cote")
    .order("created_at", { ascending: false });

  const { data: active } = await supabase
    .from("mission_shipments")
    .select("shipment_id, missions!inner(status)")
    .in("missions.status", ["offerte", "acceptee", "en_cours"]);

  const taken = new Set((active ?? []).map((a) => a.shipment_id));

  return (ships ?? [])
    .filter((s) => !taken.has(s.id))
    .map((s) => ({
      id: s.id,
      ref: s.ref,
      originCity: s.origin_city,
      destCity: s.dest_city,
      subtotal: s.subtotal,
      chargeableWeightKg: s.chargeable_weight_kg,
      requestedDate: s.requested_date,
    }));
}

export type CarrierRow = {
  id: string;
  legalName: string;
  city: string | null;
  verified: boolean;
};

export async function getCarriers(): Promise<CarrierRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, legal_name, city, verified")
    .eq("type", "carrier")
    .order("legal_name");
  return (data ?? []).map((c) => ({
    id: c.id,
    legalName: c.legal_name,
    city: c.city,
    verified: c.verified ?? false,
  }));
}

export type AdminRouteRequest = {
  id: string;
  originCity: string;
  destCity: string;
  requestedDate: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
};

export async function getRouteRequests(): Promise<AdminRouteRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("route_requests")
    .select("id, origin_city, dest_city, requested_date, notes, status, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id,
    originCity: r.origin_city,
    destCity: r.dest_city,
    requestedDate: r.requested_date,
    notes: r.notes,
    status: r.status,
    createdAt: r.created_at ?? "",
  }));
}

export type OfferedMission = {
  id: string;
  carrierPayout: number;
  platformFee: number;
  expiresAt: string | null;
  ref: string | null;
  originCity: string | null;
  destCity: string | null;
  chargeableWeightKg: number | null;
};

/** Missions offertes à un transporteur (1 expédition par mission en 1-à-1). */
export async function getOfferedMissions(carrierCompanyId: string): Promise<OfferedMission[]> {
  const supabase = await createClient();
  const { data: missions } = await supabase
    .from("missions")
    .select("id, carrier_payout_amount, platform_fee_amount, expires_at")
    .eq("carrier_company_id", carrierCompanyId)
    .eq("status", "offerte")
    .order("offered_at", { ascending: false });

  const list = missions ?? [];
  if (list.length === 0) return [];

  const { data: links } = await supabase
    .from("mission_shipments")
    .select("mission_id, shipments(ref, origin_city, dest_city, chargeable_weight_kg)")
    .in(
      "mission_id",
      list.map((m) => m.id),
    );

  const byMission = new Map<
    string,
    { ref: string; originCity: string; destCity: string; chargeableWeightKg: number | null }
  >();
  for (const l of links ?? []) {
    const s = l.shipments as unknown as {
      ref: string;
      origin_city: string;
      dest_city: string;
      chargeable_weight_kg: number | null;
    } | null;
    if (s && !byMission.has(l.mission_id)) {
      byMission.set(l.mission_id, {
        ref: s.ref,
        originCity: s.origin_city,
        destCity: s.dest_city,
        chargeableWeightKg: s.chargeable_weight_kg,
      });
    }
  }

  return list.map((m) => {
    const s = byMission.get(m.id);
    return {
      id: m.id,
      carrierPayout: m.carrier_payout_amount,
      platformFee: m.platform_fee_amount,
      expiresAt: m.expires_at,
      ref: s?.ref ?? null,
      originCity: s?.originCity ?? null,
      destCity: s?.destCity ?? null,
      chargeableWeightKg: s?.chargeableWeightKg ?? null,
    };
  });
}

export type FleetOption = { id: string; label: string };
export type CarrierFleet = { drivers: FleetOption[]; vehicles: FleetOption[] };

export async function getCarrierFleet(carrierCompanyId: string): Promise<CarrierFleet> {
  const supabase = await createClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, license_number, license_class")
    .eq("company_id", carrierCompanyId)
    .eq("active", true);
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, unit_number, type")
    .eq("company_id", carrierCompanyId)
    .eq("active", true);

  return {
    drivers: (drivers ?? []).map((d) => ({
      id: d.id,
      label: d.license_number ? `Permis ${d.license_number}` : `Chauffeur (classe ${d.license_class ?? "?"})`,
    })),
    vehicles: (vehicles ?? []).map((v) => ({
      id: v.id,
      label: `${v.unit_number} · ${v.type}`,
    })),
  };
}
