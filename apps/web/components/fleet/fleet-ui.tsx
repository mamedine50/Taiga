"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { Driver, Vehicle } from "@/lib/fleet";
import {
  addDriver,
  addVehicle,
  ownerOperatorSetup,
  toggleDriver,
  toggleVehicle,
} from "@/app/(app)/transporteur/fleet-actions";
import { Button } from "@/components/ui/button";

const VEHICLE_TYPES = [
  "dry_van_53",
  "dry_van_48",
  "flatbed",
  "reefer",
  "cube",
  "pickup_remorque",
  "autre",
] as const;
const TELEMATICS = ["cellulaire", "satellite", "aucun"] as const;

const input =
  "rounded-btn border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-action";
const num = (s: string) => Number.parseFloat(s) || 0;

export function DriverManager({ drivers }: { drivers: Driver[] }) {
  const t = useTranslations();
  const [pending, start] = useTransition();
  const [lic, setLic] = useState("");
  const [cls, setCls] = useState("1");

  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <h2 className="mb-3 font-display text-lg font-bold">{t("fleet.drivers")}</h2>
      {drivers.length === 0 ? (
        <p className="mb-4 text-sm text-muted">{t("fleet.driversEmpty")}</p>
      ) : (
        <div className="mb-4 space-y-2">
          {drivers.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-btn border border-border bg-surface2 px-4 py-2.5 text-sm"
            >
              <span>
                {d.licenseNumber ?? "—"}{" "}
                <span className="text-tertiary">· {t("fleet.licenseClass")} {d.licenseClass}</span>
                {!d.active && <span className="ml-2 text-xs text-error">{t("fleet.inactive")}</span>}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => start(() => toggleDriver(d.id, !d.active).then(() => {}))}
                className="text-xs text-muted hover:text-text"
              >
                {d.active ? t("fleet.deactivate") : t("fleet.activate")}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <input value={lic} onChange={(e) => setLic(e.target.value)} placeholder={t("fleet.licenseNumber")} className={`flex-1 ${input}`} />
        <input value={cls} onChange={(e) => setCls(e.target.value)} placeholder={t("fleet.licenseClass")} className={`w-24 ${input}`} />
        <Button type="button" disabled={pending} onClick={() => start(async () => { await addDriver({ licenseNumber: lic, licenseClass: cls }); setLic(""); })}>
          {t("fleet.add")}
        </Button>
      </div>
    </div>
  );
}

export function VehicleManager({ vehicles }: { vehicles: Vehicle[] }) {
  const t = useTranslations();
  const [pending, start] = useTransition();
  const [unit, setUnit] = useState("");
  const [type, setType] = useState<string>("dry_van_53");
  const [kg, setKg] = useState("40000");
  const [cbm, setCbm] = useState("100");
  const [lf, setLf] = useState("53");
  const [tel, setTel] = useState<string>("cellulaire");

  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <h2 className="mb-3 font-display text-lg font-bold">{t("fleet.vehicles")}</h2>
      {vehicles.length === 0 ? (
        <p className="mb-4 text-sm text-muted">{t("fleet.vehiclesEmpty")}</p>
      ) : (
        <div className="mb-4 space-y-2">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-btn border border-border bg-surface2 px-4 py-2.5 text-sm">
              <span>
                <span className="font-mono text-action">{v.unitNumber}</span>{" "}
                <span className="text-tertiary">· {v.type} · {v.capacityKg} kg · {v.telematics}</span>
                {!v.active && <span className="ml-2 text-xs text-error">{t("fleet.inactive")}</span>}
              </span>
              <button type="button" disabled={pending} onClick={() => start(() => toggleVehicle(v.id, !v.active).then(() => {}))} className="text-xs text-muted hover:text-text">
                {v.active ? t("fleet.deactivate") : t("fleet.activate")}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-3">
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={t("fleet.unitNumber")} className={input} />
        <select value={type} onChange={(e) => setType(e.target.value)} className={input}>
          {VEHICLE_TYPES.map((vt) => <option key={vt} value={vt}>{vt}</option>)}
        </select>
        <select value={tel} onChange={(e) => setTel(e.target.value)} className={input}>
          {TELEMATICS.map((tt) => <option key={tt} value={tt}>{t(`fleet.telematics${tt === "cellulaire" ? "Cell" : tt === "satellite" ? "Sat" : "None"}`)}</option>)}
        </select>
        <input value={kg} onChange={(e) => setKg(e.target.value)} placeholder={t("fleet.capacityKg")} className={input} />
        <input value={cbm} onChange={(e) => setCbm(e.target.value)} placeholder={t("fleet.capacityCbm")} className={input} />
        <input value={lf} onChange={(e) => setLf(e.target.value)} placeholder={t("fleet.capacityLf")} className={input} />
      </div>
      <div className="mt-2">
        <Button type="button" disabled={pending} onClick={() => start(async () => { await addVehicle({ unitNumber: unit, type, capacityKg: num(kg), capacityCbm: num(cbm), linearFeet: num(lf), telematics: tel }); setUnit(""); })}>
          {t("fleet.addVehicle")}
        </Button>
      </div>
    </div>
  );
}

export function OwnerOperatorForm() {
  const t = useTranslations();
  const [pending, start] = useTransition();
  const [lic, setLic] = useState("");
  const [unit, setUnit] = useState("");
  const [type, setType] = useState("dry_van_53");

  return (
    <div className="rounded-card border border-action/40 bg-action/5 p-6">
      <h2 className="font-display text-lg font-bold">{t("fleet.ownerOperator")}</h2>
      <p className="mt-1 text-sm text-muted">{t("fleet.ownerOperatorDesc")}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <input value={lic} onChange={(e) => setLic(e.target.value)} placeholder={t("fleet.licenseNumber")} className={input} />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={t("fleet.unitNumber")} className={input} />
        <select value={type} onChange={(e) => setType(e.target.value)} className={input}>
          {VEHICLE_TYPES.map((vt) => <option key={vt} value={vt}>{vt}</option>)}
        </select>
      </div>
      <div className="mt-3">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            start(() =>
              ownerOperatorSetup({
                licenseNumber: lic,
                licenseClass: "1",
                unitNumber: unit || "UNITÉ-01",
                type,
                capacityKg: 40000,
                capacityCbm: 100,
                linearFeet: 53,
                telematics: "cellulaire",
              }).then(() => {}),
            )
          }
        >
          {t("fleet.ownerOperatorCta")}
        </Button>
      </div>
    </div>
  );
}
