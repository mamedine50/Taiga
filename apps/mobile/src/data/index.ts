// API PUBLIQUE de la couche de données.
// Les écrans importent UNIQUEMENT depuis ici — jamais @supabase ni ./supabase.
export { useSession, useMissions, useMission } from "./hooks";
export { signInWithPassword, signOut } from "./auth";
export { markStatus, submitPod, getMissions, getMission } from "./repository";
export { syncFromServer } from "./sync";
export { processOutbox, pendingCount } from "./outbox";
export type {
  MissionWithShipments,
  MissionLocal,
  ShipmentLocal,
  ShipmentStatus,
  StatusPayload,
  PodPayload,
} from "./types";
