// JALON 2 hors-ligne : le déclencheur (aucune réécriture des écrans/repository).
// L'outbox persiste déjà en SQLite et les fichiers POD sont déjà en local ;
// ici on draine simplement la file au bon moment : démarrage, retour réseau,
// retour au premier plan.
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import { processOutbox } from "./outbox";

let started = false;

export function startOutboxProcessor(): void {
  if (started) return;
  started = true;

  // Au démarrage : tenter de vider ce qui restait.
  void processOutbox();

  // Au retour du réseau : les actions en attente partent toutes seules.
  NetInfo.addEventListener((state) => {
    if (state.isConnected) void processOutbox();
  });

  // Au retour de l'app au premier plan.
  AppState.addEventListener("change", (s) => {
    if (s === "active") void processOutbox();
  });
}
