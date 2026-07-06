"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  addShipmentToDeparture,
  removeShipmentFromDeparture,
} from "@/app/(app)/admin/departure-actions";

export function AddButton({ departureId, shipmentId }: { departureId: string; shipmentId: string }) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => addShipmentToDeparture(departureId, shipmentId).then(() => {}))}
      className="rounded-btn bg-action px-3 py-1.5 text-xs font-semibold text-bg hover:brightness-110 disabled:opacity-60"
    >
      + {t("departure.add")}
    </button>
  );
}

export function RemoveButton({ departureId, shipmentId }: { departureId: string; shipmentId: string }) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => removeShipmentFromDeparture(departureId, shipmentId).then(() => {}))}
      className="rounded-btn border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-error disabled:opacity-60"
    >
      {t("departure.remove")}
    </button>
  );
}
