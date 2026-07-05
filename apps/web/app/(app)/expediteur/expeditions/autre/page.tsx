import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { CustomRouteForm } from "@/components/shipments/custom-route-form";

export default async function AutreTrajetPage() {
  await requireRole("shipper");
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/expediteur" className="text-sm text-muted hover:text-text">
          ← {t("shipments.title")}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">{t("customRoute.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("customRoute.subtitle")}</p>
      </div>
      <CustomRouteForm />
    </div>
  );
}
