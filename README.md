# Taïga

**Plateforme de transport & logistique pour les régions éloignées du Québec** — Abitibi, Baie-James, Côte-Nord, là où le réseau cellulaire s'arrête.

Taïga connecte trois acteurs : les **expéditeurs** (commerces, chantiers, mines), les **transporteurs** et leurs **chauffeurs**, et l'**orchestrateur** au centre qui vérifie, assigne, regroupe les envois et sécurise les paiements jusqu'à la preuve de livraison.

## Principes non négociables

- **La confiance est le produit** — transporteurs vérifiés, argent séquestré jusqu'à la preuve de livraison, prix transparents.
- **Conçu pour le Nord** — doit fonctionner hors réseau (suivi satellite, preuve de livraison hors-ligne), par défaut et non en rattrapage.
- **Français d'abord**, anglais ensuite. Conforme aux lois du Québec (TPS/TVQ, NEQ, PEVL).
- **Simple avant complet** — utilisable par un camionneur avec des gants, pas seulement par un informaticien.

## Structure du monorepo

```
Taiga/
├─ apps/
│  ├─ web/          Portail web — Next.js (App Router). Expéditeurs + poste de commandement (admin).
│  └─ mobile/       App chauffeur — Expo (React Native). COQUILLE tant que le web n'est pas fonctionnel.
├─ packages/
│  ├─ types/        database.types.ts (généré depuis Supabase) + types partagés.
│  ├─ supabase/     Client Supabase typé, partagé navigateur/mobile.
│  └─ core/         Constantes & logique métier : taxes TPS/TVQ, corridors, rôles, i18n.
├─ supabase/        Migrations SQL — source de vérité du backend.
├─ pnpm-workspace.yaml
├─ turbo.json
└─ package.json
```

## Stack

| Domaine | Techno |
|---------|--------|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js (App Router) + `@supabase/ssr` |
| Mobile | Expo (React Native) |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Langage | TypeScript strict partout |

## Prérequis

- **Node.js** ≥ 20
- **pnpm** (via corepack : `corepack enable pnpm`)
- **Supabase CLI** (pour générer les types)

## Démarrage

```bash
# 1. Installer les dépendances (à la racine)
pnpm install

# 2. Configurer l'environnement
cp apps/web/.env.example apps/web/.env.local        # puis renseigner les valeurs
cp apps/mobile/.env.example apps/mobile/.env        # puis renseigner les valeurs

# 3. Lancer le portail web
pnpm web            # http://localhost:3000

# 4. (Plus tard) lancer l'app chauffeur
pnpm mobile
```

Les valeurs Supabase se trouvent dans : **Dashboard → Project Settings → API**.

## Générer les types

Les types TypeScript sont générés depuis la base Supabase et écrits dans
`packages/types/src/database.types.ts`. Après toute migration SQL :

```bash
supabase login
supabase gen types typescript --project-id <REF_DU_PROJET> --schema public \
  > packages/types/src/database.types.ts
```

> `<REF_DU_PROJET>` = la référence du projet (Dashboard → Project Settings → General → Reference ID).

## Base de données

Les migrations SQL vivent dans [`supabase/`](supabase/) et s'exécutent dans l'ordre
via le **SQL Editor** de Supabase :

1. `schema.sql` — tables, enums, RLS.
2. `002_functions_triggers.sql` — profil auto à l'inscription, rollup des notes, `updated_at`, moteur de cotation `quote_shipment()`.
3. `003_storage.sql` — buckets (documents, POD, signatures, factures) et leurs politiques d'accès.
4. `004_auth_onboarding.sql` — `create_company_and_link()` : création d'entreprise + rattachement du profil à l'inscription (contourne proprement la RLS).

## ⚠️ Avant la mise en production

À NE PAS OUBLIER au lancement (voir aussi [CLAUDE.md](CLAUDE.md)) :

- [ ] **Réactiver la confirmation par courriel obligatoire** (Supabase → Auth → Email → « Confirm email » = ON). En développement, l'auto-confirm est activé pour aller plus vite. ⚠️ Le flux d'inscription actuel suppose l'auto-confirm (l'entreprise est créée juste après `signUp`) : à réactiver la confirmation, revoir l'onboarding pour créer l'entreprise **après** confirmation.
- [ ] **Configurer le SMTP avec Resend** (Supabase → Auth → SMTP) pour l'envoi réel des courriels, dans la langue du profil (`profiles.language`).
- [ ] Réviser les politiques RLS restantes + lancer les *advisors* Supabase.

## Feuille de route

Web d'abord (le cerveau et l'argent), mobile ensuite.

- **Phase 0 — Fondation** *(en cours)* : monorepo, packages partagés, coquilles web/mobile.
- **Phase 1** : comptes et rôles.
- **Phase 2** : demande d'expédition + calcul du prix.
- **Phase 3** : paiement + facturation.
- **Phase 4** : poste de commandement (assignation des missions, départs groupés).
- **Phase 5** : app mobile chauffeur.
- **Phase 6** : suivi en direct + notifications.
- **Phase 7** : outils avancés transporteurs (backhauls).

## Méthode de travail

Une étape à la fois. À chaque étape : plan proposé et **approuvé avant construction**,
puis vérification selon des critères précis, puis sauvegarde. Plan approuvé avant les travaux.
