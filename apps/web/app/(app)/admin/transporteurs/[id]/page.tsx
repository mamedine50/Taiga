import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDocuments } from "@/lib/fleet";
import { DocReview } from "@/components/dispatch/doc-review";

export default async function CarrierReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("legal_name, city, verified")
    .eq("id", id)
    .single();
  if (!company) notFound();

  const t = await getTranslations();
  const docs = await getDocuments(id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-text">
          ← {t("admin.title")}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">{company.legal_name}</h1>
        {company.city && <p className="mt-1 text-sm text-muted">{company.city}</p>}
      </div>

      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="mb-3 font-display text-lg font-bold">{t("docs.review")}</h2>
        <DocReview docs={docs} />
      </div>
    </div>
  );
}
