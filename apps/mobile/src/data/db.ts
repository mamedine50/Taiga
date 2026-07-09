// Base locale SQLite : source de vérité de LECTURE pour l'UI + file d'actions.
import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("taiga.db");
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS missions (
          id TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          carrier_payout REAL NOT NULL DEFAULT 0,
          departure_id TEXT
        );

        CREATE TABLE IF NOT EXISTS shipments (
          id TEXT PRIMARY KEY,
          mission_id TEXT NOT NULL,
          ref TEXT NOT NULL,
          status TEXT NOT NULL,
          origin_address TEXT NOT NULL DEFAULT '',
          origin_city TEXT NOT NULL DEFAULT '',
          dest_address TEXT NOT NULL DEFAULT '',
          dest_city TEXT NOT NULL DEFAULT '',
          chargeable_weight_kg REAL
        );

        CREATE TABLE IF NOT EXISTS outbox (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kind TEXT NOT NULL,
          payload TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          attempts INTEGER NOT NULL DEFAULT 0,
          error TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sync_meta (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      // Migration idempotente : drapeau « POD déjà déposé » (verrouillage lecture seule).
      try {
        await db.execAsync("ALTER TABLE shipments ADD COLUMN has_pod INTEGER NOT NULL DEFAULT 0");
      } catch {
        // colonne déjà présente
      }
      return db;
    })();
  }
  return dbPromise;
}
