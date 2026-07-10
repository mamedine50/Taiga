"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createReservationIntent } from "@/app/(app)/expediteur/payment-actions";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#ff7a29",
    colorBackground: "#121c2c",
    colorText: "#edf3f8",
    colorTextSecondary: "#8fa1b8",
    colorDanger: "#ff5d5d",
    borderRadius: "9px",
    fontFamily: "system-ui, sans-serif",
  },
};

export function PaymentClient({
  shipmentId,
  detailPath,
  amountLabel,
}: {
  shipmentId: string;
  detailPath: string;
  amountLabel: string;
}) {
  const t = useTranslations();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createReservationIntent(shipmentId).then((r) => {
      if (r.clientSecret) setClientSecret(r.clientSecret);
      else setError(t("payment.errorGeneric"));
    });
  }, [shipmentId, t]);

  if (error) return <p className="text-sm text-error">{error}</p>;
  if (!clientSecret) return <p className="text-sm text-muted">{t("payment.loading")}</p>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <CheckoutForm detailPath={detailPath} amountLabel={amountLabel} />
    </Elements>
  );
}

function CheckoutForm({ detailPath, amountLabel }: { detailPath: string; amountLabel: string }) {
  const t = useTranslations();
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onPay = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${detailPath}?reserved=1` },
      redirect: "if_required",
    });
    if (error) {
      setErr(error.message ?? t("payment.declined"));
      setBusy(false);
    } else {
      router.push(`${detailPath}?reserved=1`);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4 rounded-card border border-border bg-surface p-6">
      <PaymentElement />
      {err && <p className="text-sm text-error">{err}</p>}
      <Button type="button" onClick={onPay} disabled={busy || !stripe} className="w-full">
        {busy ? t("payment.processing") : t("payment.payCta", { amount: amountLabel })}
      </Button>
    </div>
  );
}
