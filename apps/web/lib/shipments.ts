import type { Json } from "@taiga/types";
import { createClient } from "@/lib/supabase/server";

export type CorridorOption = {
  id: string;
  code: string;
  name: string;
  originRegion: string;
  destRegion: string;
  serviceDays: string[] | null;
  cellularCoverage: string | null;
};

export async function getActiveCorridors(): Promise<CorridorOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("corridors")
    .select("id, code, name, origin_region, dest_region, service_days, cellular_coverage")
    .eq("active", true)
    .order("code");

  return (data ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    originRegion: c.origin_region,
    destRegion: c.dest_region,
    serviceDays: c.service_days,
    cellularCoverage: c.cellular_coverage,
  }));
}

export type ShipmentListRow = {
  id: string;
  ref: string;
  status: string;
  originCity: string;
  destCity: string;
  requestedDate: string;
  totalAmount: number | null;
};

export async function getMyShipments(companyId: string): Promise<ShipmentListRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipments")
    .select("id, ref, status, origin_city, dest_city, requested_date, total_amount")
    .eq("shipper_company_id", companyId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((s) => ({
    id: s.id,
    ref: s.ref,
    status: s.status ?? "brouillon",
    originCity: s.origin_city,
    destCity: s.dest_city,
    requestedDate: s.requested_date,
    totalAmount: s.total_amount,
  }));
}

export type ShipmentItem = {
  id: string;
  description: string;
  qty: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKgEach: number;
  stackable: boolean;
  dangerous: boolean;
  cbm: number | null;
};

export type ShipmentDetail = {
  id: string;
  ref: string;
  status: string;
  originAddress: string;
  originCity: string;
  destAddress: string;
  destCity: string;
  requestedDate: string;
  declaredValue: number | null;
  totalWeightKg: number | null;
  totalCbm: number | null;
  chargeableWeightKg: number | null;
  subtotal: number | null;
  gst: number | null;
  qst: number | null;
  totalAmount: number | null;
  currency: string | null;
  quoteBreakdown: Json | null;
  corridorLabel: string | null;
  assignedCarrier: string | null;
  pod: PodView | null;
  paymentStatus: string | null;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  items: ShipmentItem[];
};

export type PodView = {
  photoUrls: string[];
  signatureUrl: string | null;
  signeeName: string | null;
  damages: boolean;
  notes: string | null;
  capturedAt: string | null;
};

/** Détail d'une expédition (RLS : l'appelant ne voit que les siennes / admin). */
export async function getShipment(id: string): Promise<ShipmentDetail | null> {
  const supabase = await createClient();

  const { data: s } = await supabase
    .from("shipments")
    .select(
      "id, ref, status, payment_status, origin_address, origin_city, dest_address, dest_city, requested_date, declared_value, total_weight_kg, total_cbm, chargeable_weight_kg, subtotal, gst, qst, total_amount, currency, quote_breakdown, corridor_id",
    )
    .eq("id", id)
    .single();
  if (!s) return null;

  let corridorLabel: string | null = null;
  if (s.corridor_id) {
    const { data: c } = await supabase
      .from("corridors")
      .select("code, name")
      .eq("id", s.corridor_id)
      .single();
    if (c) corridorLabel = `${c.code} · ${c.name}`;
  }

  const { data: items } = await supabase
    .from("shipment_items")
    .select(
      "id, description, qty, length_cm, width_cm, height_cm, weight_kg_each, stackable, dangerous_goods, cbm",
    )
    .eq("shipment_id", id)
    .order("id");

  // Transporteur assigné (mission acceptée/en cours) — visible côté expéditeur.
  let assignedCarrier: string | null = null;
  const { data: links } = await supabase
    .from("mission_shipments")
    .select("missions(carrier_company_id, status)")
    .eq("shipment_id", id);
  for (const l of links ?? []) {
    const m = l.missions as unknown as { carrier_company_id: string; status: string } | null;
    if (m && ["acceptee", "en_cours", "completee"].includes(m.status)) {
      const { data: co } = await supabase
        .from("companies")
        .select("legal_name")
        .eq("id", m.carrier_company_id)
        .single();
      assignedCarrier = co?.legal_name ?? null;
      break;
    }
  }

  // Preuve de livraison (POD) — photos/signature via URLs signées (bucket privé).
  let pod: PodView | null = null;
  const { data: podRow } = await supabase
    .from("pods")
    .select("photo_urls, signature_url, signee_name, damages, notes, captured_at")
    .eq("shipment_id", id)
    .maybeSingle();
  if (podRow) {
    const photoUrls: string[] = [];
    for (const path of podRow.photo_urls ?? []) {
      const { data: signed } = await supabase.storage.from("pods").createSignedUrl(path, 3600);
      if (signed?.signedUrl) photoUrls.push(signed.signedUrl);
    }
    let signatureUrl: string | null = null;
    if (podRow.signature_url) {
      const { data: signed } = await supabase.storage
        .from("pods")
        .createSignedUrl(podRow.signature_url, 3600);
      signatureUrl = signed?.signedUrl ?? null;
    }
    pod = {
      photoUrls,
      signatureUrl,
      signeeName: podRow.signee_name,
      damages: podRow.damages ?? false,
      notes: podRow.notes,
      capturedAt: podRow.captured_at,
    };
  }

  // Facture (si émise) — URL signée depuis le bucket privé.
  let invoiceNumber: string | null = null;
  let invoiceUrl: string | null = null;
  const { data: inv } = await supabase
    .from("invoices")
    .select("number, pdf_url")
    .eq("shipment_id", id)
    .maybeSingle();
  if (inv) {
    invoiceNumber = inv.number;
    if (inv.pdf_url) {
      const { data: signed } = await supabase.storage
        .from("invoices")
        .createSignedUrl(inv.pdf_url, 3600);
      invoiceUrl = signed?.signedUrl ?? null;
    }
  }

  return {
    id: s.id,
    ref: s.ref,
    status: s.status ?? "brouillon",
    paymentStatus: s.payment_status,
    invoiceNumber,
    invoiceUrl,
    originAddress: s.origin_address,
    originCity: s.origin_city,
    destAddress: s.dest_address,
    destCity: s.dest_city,
    requestedDate: s.requested_date,
    declaredValue: s.declared_value,
    totalWeightKg: s.total_weight_kg,
    totalCbm: s.total_cbm,
    chargeableWeightKg: s.chargeable_weight_kg,
    subtotal: s.subtotal,
    gst: s.gst,
    qst: s.qst,
    totalAmount: s.total_amount,
    currency: s.currency,
    quoteBreakdown: s.quote_breakdown,
    corridorLabel,
    assignedCarrier,
    pod,
    items: (items ?? []).map((i) => ({
      id: i.id,
      description: i.description,
      qty: i.qty,
      lengthCm: i.length_cm,
      widthCm: i.width_cm,
      heightCm: i.height_cm,
      weightKgEach: i.weight_kg_each,
      stackable: i.stackable ?? true,
      dangerous: i.dangerous_goods ?? false,
      cbm: i.cbm,
    })),
  };
}
