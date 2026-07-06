import { createClient } from "@/lib/supabase/server";
import { computeDocChip, type DocChip, mapDoc } from "@/lib/fleet";

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
  docChip: DocChip;
};

export async function getCarriers(): Promise<CarrierRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, legal_name, city, verified")
    .eq("type", "carrier")
    .order("legal_name");
  const carriers = data ?? [];

  // Statut agrégé des documents par transporteur (chip du dispatch).
  const byCompany = new Map<string, ReturnType<typeof mapDoc>[]>();
  if (carriers.length > 0) {
    const { data: docs } = await supabase
      .from("carrier_documents")
      .select("id, company_id, type, file_url, expires_at, status, created_at")
      .in(
        "company_id",
        carriers.map((c) => c.id),
      );
    for (const d of docs ?? []) {
      const arr = byCompany.get(d.company_id) ?? [];
      arr.push(mapDoc(d));
      byCompany.set(d.company_id, arr);
    }
  }

  return carriers.map((c) => ({
    id: c.id,
    legalName: c.legal_name,
    city: c.city,
    verified: c.verified ?? false,
    docChip: computeDocChip(byCompany.get(c.id) ?? []),
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
  shipmentCount: number;
  totalChargeableWeightKg: number;
  firstRef: string | null;
  originCity: string | null;
  destCity: string | null;
  isGrouped: boolean;
};

/** Missions offertes à un transporteur (1 expédition, ou un départ groupé). */
export async function getOfferedMissions(carrierCompanyId: string): Promise<OfferedMission[]> {
  const supabase = await createClient();
  const { data: missions } = await supabase
    .from("missions")
    .select("id, carrier_payout_amount, platform_fee_amount, expires_at, departure_id")
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

  type Agg = {
    count: number;
    weight: number;
    firstRef: string | null;
    originCity: string | null;
    destCity: string | null;
  };
  const byMission = new Map<string, Agg>();
  for (const l of links ?? []) {
    const s = l.shipments as unknown as {
      ref: string;
      origin_city: string;
      dest_city: string;
      chargeable_weight_kg: number | null;
    } | null;
    if (!s) continue;
    const agg = byMission.get(l.mission_id) ?? {
      count: 0,
      weight: 0,
      firstRef: null,
      originCity: null,
      destCity: null,
    };
    agg.count += 1;
    agg.weight += s.chargeable_weight_kg ?? 0;
    if (agg.firstRef === null) {
      agg.firstRef = s.ref;
      agg.originCity = s.origin_city;
      agg.destCity = s.dest_city;
    }
    byMission.set(l.mission_id, agg);
  }

  return list.map((m) => {
    const a = byMission.get(m.id);
    return {
      id: m.id,
      carrierPayout: m.carrier_payout_amount,
      platformFee: m.platform_fee_amount,
      expiresAt: m.expires_at,
      shipmentCount: a?.count ?? 0,
      totalChargeableWeightKg: a?.weight ?? 0,
      firstRef: a?.firstRef ?? null,
      originCity: a?.originCity ?? null,
      destCity: a?.destCity ?? null,
      isGrouped: m.departure_id !== null || (a?.count ?? 0) > 1,
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
