import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { getDrivers, getVehicles } from "@/lib/fleet";
import { DriverManager, OwnerOperatorForm, VehicleManager } from "@/components/fleet/fleet-ui";

export default async function FlottePage() {
  const ctx = await requireRole("carrier");
  const t = await getTranslations();
  const [drivers, vehicles] = ctx.company
    ? await Promise.all([getDrivers(ctx.company.id), getVehicles(ctx.company.id)])
    : [[], []];
  const empty = drivers.length === 0 && vehicles.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{t("fleet.title")}</h1>
        <Link href="/transporteur" className="text-sm text-muted hover:text-text">
          ← {t("dashboard.carrierHome")}
        </Link>
      </div>

      {empty && <OwnerOperatorForm />}
      <DriverManager drivers={drivers} />
      <VehicleManager vehicles={vehicles} />
    </div>
  );
}
