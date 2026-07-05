// ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.
//
// Ceci est un PLACEHOLDER valide jusqu'à la première génération réelle.
// Régénérez-le depuis la base Supabase du projet Taïga avec :
//
//   supabase login
//   supabase gen types typescript --project-id <REF_DU_PROJET> --schema public \
//     > packages/types/src/database.types.ts
//
// (voir README.md → section « Générer les types »)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
