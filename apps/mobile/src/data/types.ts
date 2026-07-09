// Types de la couche de données locale (ce que les écrans consomment).

export type ShipmentLocal = {
  id: string;
  missionId: string;
  ref: string;
  status: string;
  originAddress: string;
  originCity: string;
  destAddress: string;
  destCity: string;
  chargeableWeightKg: number | null;
};

export type MissionLocal = {
  id: string;
  status: string;
  carrierPayout: number;
  departureId: string | null;
};

export type MissionWithShipments = MissionLocal & { shipments: ShipmentLocal[] };

// File d'actions (outbox) : toute écriture passe par là.
export type OutboxKind = "status" | "pod";

export type ShipmentStatus = "ramassage" | "en_transit" | "livre";

export type StatusPayload = {
  missionId: string;
  shipmentId: string;
  status: ShipmentStatus;
};

export type PodPayload = {
  missionId: string;
  shipmentId: string;
  photoUris: string[];
  signatureUri: string | null;
  signeeName: string;
  notes?: string;
  capturedAt: string;
  lat?: number;
  lng?: number;
};

export type OutboxPayload = StatusPayload | PodPayload;
