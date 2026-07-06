import { createClient } from "@/lib/supabase/server";

export type DepartureRow = {
  id: string;
  date: string;
  terminalCity: string;
  status: string;
  corridorCode: string | null;
  corridorName: string | null;
  bookedKg: number;
  bookedCbm: number;
  bookedLf: number;
  capacityKg: number | null;
  capacityCbm: number | null;
  capacityLf: number | null;
  shipmentCount: number;
};

function corridorOf(row: { corridors: unknown }): { code: string; name: string } | null {
  const c = row.corridors as { code: string; name: string } | { code: string; name: string }[] | null;
  if (!c) return null;
  return Array.isArray(c) ? (c[0] ?? null) : c;
}

export async function getOpenDepartures(): Promise<DepartureRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("departures")
    .select(
      "id, departure_date, terminal_city, status, capacity_kg, capacity_cbm, capacity_linear_ft, booked_kg, booked_cbm, booked_linear_ft, corridors(code, name)",
    )
    .eq("status", "ouvert")
    .order("departure_date");

  const rows = data ?? [];
  const ids = rows.map((r) => r.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: ships } = await supabase
      .from("shipments")
      .select("departure_id")
      .in("departure_id", ids);
    for (const s of ships ?? []) {
      if (s.departure_id) counts.set(s.departure_id, (counts.get(s.departure_id) ?? 0) + 1);
    }
  }

  return rows.map((r) => {
    const c = corridorOf(r);
    return {
      id: r.id,
      date: r.departure_date,
      terminalCity: r.terminal_city,
      status: r.status ?? "ouvert",
      corridorCode: c?.code ?? null,
      corridorName: c?.name ?? null,
      bookedKg: r.booked_kg ?? 0,
      bookedCbm: r.booked_cbm ?? 0,
      bookedLf: r.booked_linear_ft ?? 0,
      capacityKg: r.capacity_kg,
      capacityCbm: r.capacity_cbm,
      capacityLf: r.capacity_linear_ft,
      shipmentCount: counts.get(r.id) ?? 0,
    };
  });
}

export type DepartureShipment = {
  id: string;
  ref: string;
  originCity: string;
  destCity: string;
  weightKg: number | null;
  cbm: number | null;
  linearFt: number | null;
  subtotal: number | null;
};

export type DepartureDetail = {
  departure: DepartureRow & { corridorId: string | null };
  grouped: DepartureShipment[];
  addable: DepartureShipment[];
  groupedSubtotal: number;
};

export async function getDepartureDetail(id: string): Promise<DepartureDetail | null> {
  const supabase = await createClient();

  const { data: dep } = await supabase
    .from("departures")
    .select(
      "id, corridor_id, departure_date, terminal_city, status, capacity_kg, capacity_cbm, capacity_linear_ft, booked_kg, booked_cbm, booked_linear_ft, corridors(code, name)",
    )
    .eq("id", id)
    .single();
  if (!dep) return null;
  const c = corridorOf(dep);

  const map = (s: {
    id: string;
    ref: string;
    origin_city: string;
    dest_city: string;
    total_weight_kg: number | null;
    total_cbm: number | null;
    total_linear_ft: number | null;
    subtotal: number | null;
  }): DepartureShipment => ({
    id: s.id,
    ref: s.ref,
    originCity: s.origin_city,
    destCity: s.dest_city,
    weightKg: s.total_weight_kg,
    cbm: s.total_cbm,
    linearFt: s.total_linear_ft,
    subtotal: s.subtotal,
  });

  const cols =
    "id, ref, origin_city, dest_city, total_weight_kg, total_cbm, total_linear_ft, subtotal";

  const { data: grouped } = await supabase
    .from("shipments")
    .select(cols)
    .eq("departure_id", id)
    .order("created_at");

  // Expéditions disponibles : cotées, même corridor, pas dans un départ, pas déjà offertes.
  let addable: DepartureShipment[] = [];
  if (dep.corridor_id) {
    const { data: cand } = await supabase
      .from("shipments")
      .select(cols)
      .eq("status", "cote")
      .eq("corridor_id", dep.corridor_id)
      .is("departure_id", null);

    const { data: active } = await supabase
      .from("mission_shipments")
      .select("shipment_id, missions!inner(status)")
      .in("missions.status", ["offerte", "acceptee", "en_cours"]);
    const taken = new Set((active ?? []).map((a) => a.shipment_id));

    addable = (cand ?? []).filter((s) => !taken.has(s.id)).map(map);
  }

  const groupedMapped = (grouped ?? []).map(map);
  const groupedSubtotal = groupedMapped.reduce((acc, s) => acc + (s.subtotal ?? 0), 0);

  return {
    departure: {
      id: dep.id,
      corridorId: dep.corridor_id,
      date: dep.departure_date,
      terminalCity: dep.terminal_city,
      status: dep.status ?? "ouvert",
      corridorCode: c?.code ?? null,
      corridorName: c?.name ?? null,
      bookedKg: dep.booked_kg ?? 0,
      bookedCbm: dep.booked_cbm ?? 0,
      bookedLf: dep.booked_linear_ft ?? 0,
      capacityKg: dep.capacity_kg,
      capacityCbm: dep.capacity_cbm,
      capacityLf: dep.capacity_linear_ft,
      shipmentCount: groupedMapped.length,
    },
    grouped: groupedMapped,
    addable,
    groupedSubtotal: Math.round(groupedSubtotal * 100) / 100,
  };
}
