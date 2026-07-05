import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { getActiveCorridors } from "@/lib/shipments";
import { ShipmentForm } from "@/components/shipments/shipment-form";

export default async function NouvelleExpeditionPage() {
  await requireRole("shipper");
  const t = await getTranslations();
  const corridors = await getActiveCorridors();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/expediteur" className="text-sm text-muted hover:text-text">
          ← {t("shipments.title")}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">{t("form.title")}</h1>
      </div>
      <ShipmentForm corridors={corridors} />
    </div>
  );
}
