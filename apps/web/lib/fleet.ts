import { createClient } from "@/lib/supabase/server";

export type Driver = {
  id: string;
  licenseNumber: string | null;
  licenseClass: string | null;
  active: boolean;
};

export type Vehicle = {
  id: string;
  unitNumber: string;
  type: string;
  capacityKg: number;
  capacityCbm: number;
  linearFeet: number | null;
  telematics: string;
  active: boolean;
};

export type CarrierDoc = {
  id: string;
  companyId: string;
  type: string;
  fileUrl: string;
  expiresAt: string | null;
  status: string;
  createdAt: string;
};

export type DocChip = "valid" | "expired" | "pending" | "none";

export async function getDrivers(companyId: string): Promise<Driver[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("drivers")
    .select("id, license_number, license_class, active")
    .eq("company_id", companyId)
    .order("created_at");
  return (data ?? []).map((d) => ({
    id: d.id,
    licenseNumber: d.license_number,
    licenseClass: d.license_class,
    active: d.active ?? true,
  }));
}

export async function getVehicles(companyId: string): Promise<Vehicle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("id, unit_number, type, capacity_kg, capacity_cbm, linear_feet, telematics, active")
    .eq("company_id", companyId)
    .order("created_at");
  return (data ?? []).map((v) => ({
    id: v.id,
    unitNumber: v.unit_number,
    type: v.type,
    capacityKg: v.capacity_kg,
    capacityCbm: v.capacity_cbm,
    linearFeet: v.linear_feet,
    telematics: v.telematics ?? "cellulaire",
    active: v.active ?? true,
  }));
}

export async function getDocuments(companyId: string): Promise<CarrierDoc[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("carrier_documents")
    .select("id, company_id, type, file_url, expires_at, status, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapDoc);
}

export function mapDoc(d: {
  id: string;
  company_id: string;
  type: string;
  file_url: string;
  expires_at: string | null;
  status: string | null;
  created_at: string | null;
}): CarrierDoc {
  return {
    id: d.id,
    companyId: d.company_id,
    type: d.type,
    fileUrl: d.file_url,
    expiresAt: d.expires_at,
    status: d.status ?? "en_attente",
    createdAt: d.created_at ?? "",
  };
}

/** Statut agrégé des documents d'un transporteur (pour le chip du dispatch). */
export function computeDocChip(docs: CarrierDoc[]): DocChip {
  if (docs.length === 0) return "none";
  const today = new Date().toISOString().slice(0, 10);
  const valid = docs.filter((d) => d.status === "valide");
  if (valid.length === 0) return "pending";
  const expired = valid.some((d) => (d.expiresAt ? d.expiresAt < today : false));
  return expired ? "expired" : "valid";
}
