import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@taiga/i18n";
import { requireRole } from "@/lib/auth";
import { getShipment } from "@/lib/shipments";
import { formatMoney } from "@/lib/format";
import { PaymentClient } from "@/components/payment/payment-client";

export default async function PayerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("shipper");
  const { id } = await params;
  const detail = await getShipment(id);
  if (!detail) notFound();

  // Déjà réservé/payé → retour au détail.
  if (detail.status !== "cote") redirect(`/expediteur/expeditions/${id}`);

  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const detailPath = `/expediteur/expeditions/${id}`;
  const amountLabel = formatMoney(detail.totalAmount, locale, detail.currency ?? "CAD");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href={detailPath} className="text-sm text-muted hover:text-text">
          ← {detail.ref}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">{t("payment.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("payment.subtitle")}</p>
      </div>

      <PaymentClient shipmentId={id} detailPath={detailPath} amountLabel={amountLabel} />
    </div>
  );
}
