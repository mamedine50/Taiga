import { createClient } from "@/lib/supabase/server";

const ACTIVE_MISSION = ["offerte", "acceptee", "en_cours"];
const EARNED_MISSION = ["acceptee", "en_cours", "completee"];

export type AdminStats = {
  toAssign: number;
  activeMissions: number;
  platformRevenue: number;
  carriersVerified: number;
  carriersTotal: number;
  openDepartures: number;
  openRouteRequests: number;
  shipmentsByStatus: { status: string; count: number }[];
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const [{ data: ships }, { data: missions }, { data: carriers }] = await Promise.all([
    supabase.from("shipments").select("status"),
    supabase.from("missions").select("status, platform_fee_amount"),
    supabase.from("companies").select("verified").eq("type", "carrier"),
  ]);

  const byStatus = new Map<string, number>();
  for (const s of ships ?? []) {
    const k = s.status ?? "brouillon";
    byStatus.set(k, (byStatus.get(k) ?? 0) + 1);
  }

  const activeMissions = (missions ?? []).filter((m) => ACTIVE_MISSION.includes(m.status ?? "")).length;
  const platformRevenue = (missions ?? [])
    .filter((m) => EARNED_MISSION.includes(m.status ?? ""))
    .reduce((a, m) => a + (m.platform_fee_amount ?? 0), 0);

  const carriersTotal = (carriers ?? []).length;
  const carriersVerified = (carriers ?? []).filter((c) => c.verified).length;

  const [{ count: openDepartures }, { count: openRouteRequests }] = await Promise.all([
    supabase.from("departures").select("id", { count: "exact", head: true }).eq("status", "ouvert"),
    supabase.from("route_requests").select("id", { count: "exact", head: true }).eq("status", "nouveau"),
  ]);

  const order = ["cote", "reserve", "assigne", "en_transit", "livre", "complete"];
  const shipmentsByStatus = order
    .map((status) => ({ status, count: byStatus.get(status) ?? 0 }))
    .filter((r) => r.count > 0);

  return {
    toAssign: byStatus.get("cote") ?? 0,
    activeMissions,
    platformRevenue,
    carriersVerified,
    carriersTotal,
    openDepartures: openDepartures ?? 0,
    openRouteRequests: openRouteRequests ?? 0,
    shipmentsByStatus,
  };
}

export type ShipperStats = {
  total: number;
  toPay: number;
  inProgress: number;
  delivered: number;
  totalAmount: number;
};

export async function getShipperStats(companyId: string): Promise<ShipperStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipments")
    .select("status, total_amount")
    .eq("shipper_company_id", companyId);
  const rows = data ?? [];
  const inProg = ["reserve", "assigne", "ramassage", "en_transit"];
  return {
    total: rows.length,
    toPay: rows.filter((s) => s.status === "cote").length,
    inProgress: rows.filter((s) => inProg.includes(s.status ?? "")).length,
    delivered: rows.filter((s) => s.status === "livre" || s.status === "complete").length,
    totalAmount: rows.reduce((a, s) => a + (s.total_amount ?? 0), 0),
  };
}

export type CarrierStats = {
  offered: number;
  inProgress: number;
  netRevenue: number;
  activeDrivers: number;
  activeVehicles: number;
};

export async function getCarrierStats(companyId: string): Promise<CarrierStats> {
  const supabase = await createClient();
  const [{ data: missions }, { count: activeDrivers }, { count: activeVehicles }] = await Promise.all([
    supabase.from("missions").select("status, carrier_payout_amount").eq("carrier_company_id", companyId),
    supabase.from("drivers").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("active", true),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("active", true),
  ]);
  const rows = missions ?? [];
  return {
    offered: rows.filter((m) => m.status === "offerte").length,
    inProgress: rows.filter((m) => m.status === "acceptee" || m.status === "en_cours").length,
    netRevenue: rows
      .filter((m) => EARNED_MISSION.includes(m.status ?? ""))
      .reduce((a, m) => a + (m.carrier_payout_amount ?? 0), 0),
    activeDrivers: activeDrivers ?? 0,
    activeVehicles: activeVehicles ?? 0,
  };
}
