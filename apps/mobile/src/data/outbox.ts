// File d'actions (OUTBOX) : toute écriture (statut, POD) est enfilée ici.
// JALON 1 : le processeur s'exécute immédiatement (en ligne).
// JALON 2 : le MÊME processeur sera aussi déclenché au retour réseau + retry
//           — aucune réécriture, juste un déclencheur en plus.
import * as FileSystem from "expo-file-system";
import { getDb } from "./db";
import { supabase } from "./supabase";
import type { OutboxKind, OutboxPayload, PodPayload, StatusPayload } from "./types";

export async function enqueue(kind: OutboxKind, payload: OutboxPayload): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO outbox (kind, payload, created_at) VALUES (?, ?, ?)",
    kind,
    JSON.stringify(payload),
    new Date().toISOString(),
  );
  // Jalon 1 : traiter tout de suite. Si hors-ligne, l'action reste 'pending'.
  await processOutbox();
}

let processing = false;

export async function processOutbox(): Promise<void> {
  // Garde anti-chevauchement : plusieurs déclencheurs (réseau, 1er plan, enqueue)
  // peuvent tirer en même temps.
  if (processing) return;
  processing = true;
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{ id: number; kind: string; payload: string }>(
      "SELECT id, kind, payload FROM outbox WHERE status = 'pending' ORDER BY id",
    );
    for (const row of rows) {
      try {
        await handle(row.kind as OutboxKind, JSON.parse(row.payload) as OutboxPayload);
        await db.runAsync("UPDATE outbox SET status = 'done' WHERE id = ?", row.id);
      } catch (e) {
        // Reste 'pending' : sera retenté (au retour réseau / 1er plan).
        await db.runAsync(
          "UPDATE outbox SET attempts = attempts + 1, error = ? WHERE id = ?",
          String(e),
          row.id,
        );
      }
    }
  } finally {
    processing = false;
  }
}

export async function pendingCount(): Promise<number> {
  const db = await getDb();
  const r = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) as n FROM outbox WHERE status = 'pending'",
  );
  return r?.n ?? 0;
}

async function handle(kind: OutboxKind, payload: OutboxPayload): Promise<void> {
  if (kind === "status") {
    const p = payload as StatusPayload;
    const { error } = await supabase.rpc("driver_mark_status", {
      p_mission: p.missionId,
      p_shipment: p.shipmentId,
      p_status: p.status,
    });
    if (error) throw new Error(error.message);
    return;
  }

  // POD : chemins DÉTERMINISTES + upsert → un réessai après échec partiel ne
  // crée jamais de doublon. Puis submit_pod (RPC atomique) = le « commit ».
  const p = payload as PodPayload;
  const base = `${p.missionId}/${p.shipmentId}`;
  const photoUrls: string[] = [];
  for (let i = 0; i < p.photoUris.length; i++) {
    const path = `${base}/photo-${i}.jpg`;
    await uploadLocalFile("pods", path, p.photoUris[i]!, "image/jpeg");
    photoUrls.push(path);
  }
  let signatureUrl: string | null = null;
  if (p.signatureUri) {
    signatureUrl = `${base}/signature.png`;
    await uploadLocalFile("pods", signatureUrl, p.signatureUri, "image/png");
  }

  // Une seule transaction : upsert pods + statut « livré » + journal + mission complétée.
  // Ces params acceptent NULL en base ; les types générés les marquent non-nullables.
  const { error } = await supabase.rpc("submit_pod", {
    p_mission: p.missionId,
    p_shipment: p.shipmentId,
    p_photo_urls: photoUrls,
    p_signature_url: signatureUrl as unknown as string,
    p_signee: p.signeeName,
    p_damages: p.damages,
    p_notes: (p.notes ?? null) as unknown as string,
    p_lat: (p.lat ?? null) as unknown as number,
    p_lng: (p.lng ?? null) as unknown as number,
    p_captured_at: p.capturedAt,
  });
  if (error) throw new Error(error.message);
}

async function uploadLocalFile(
  bucket: string,
  path: string,
  uri: string,
  contentType: string,
): Promise<void> {
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const { error } = await supabase.storage.from(bucket).upload(path, base64ToBytes(b64), {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const out: number[] = [];
  let acc = 0;
  let bits = 0;
  for (const ch of clean) {
    const idx = B64.indexOf(ch);
    if (idx === -1) continue;
    acc = (acc << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}
