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
  hasPod: boolean;
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

// Ce que l'écran POD envoie au repository (uris temporaires + signature base64).
export type PodInput = {
  missionId: string;
  shipmentId: string;
  photoUris: string[];
  signatureBase64: string | null;
  signeeName: string;
  damages: boolean;
  notes?: string;
  lat?: number;
  lng?: number;
  capturedAt: string;
};

// Ce que l'outbox stocke (chemins de fichiers LOCAUX PERSISTANTS).
export type PodPayload = {
  missionId: string;
  shipmentId: string;
  photoUris: string[];
  signatureUri: string | null;
  signeeName: string;
  damages: boolean;
  notes?: string;
  capturedAt: string;
  lat?: number;
  lng?: number;
};

export type OutboxPayload = StatusPayload | PodPayload;
