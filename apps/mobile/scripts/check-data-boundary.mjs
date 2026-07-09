// Verrou mécanique : aucun fichier hors de src/data ne doit importer Supabase.
// Les écrans passent OBLIGATOIREMENT par le repository (src/data/index).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCAN = ["App.tsx", "index.ts", "src"];
const FORBIDDEN = /from\s+["'](@supabase\/|@react-native-async-storage\/|[^"']*\/data\/supabase)/;
const violations = [];

function walk(p) {
  let s;
  try {
    s = statSync(p);
  } catch {
    return;
  }
  if (s.isDirectory()) {
    for (const f of readdirSync(p)) walk(join(p, f));
    return;
  }
  if (!/\.(ts|tsx)$/.test(p)) return;
  if (p.includes(`${join("src", "data")}`)) return; // couche de données : autorisée
  if (FORBIDDEN.test(readFileSync(p, "utf8"))) violations.push(p.replace(ROOT + "/", ""));
}

for (const s of SCAN) walk(join(ROOT, s));

if (violations.length > 0) {
  console.error("❌ Frontière violée — import de Supabase hors de src/data :");
  for (const v of violations) console.error("   " + v);
  process.exit(1);
}
console.log("✅ Frontière respectée : aucun écran n'importe Supabase directement.");
