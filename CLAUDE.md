# CLAUDE.md — Guide du projet Taïga

Contexte et conventions pour travailler efficacement sur ce dépôt.

## Le projet

**Taïga** — plateforme de transport & logistique pour les **régions éloignées du Québec**
(Abitibi, Baie-James, Côte-Nord), là où le réseau cellulaire s'arrête. Trois acteurs :
**expéditeurs**, **transporteurs/chauffeurs**, et l'**orchestrateur** (l'admin) au centre.

### Principes non négociables
- **La confiance est le produit** : transporteurs vérifiés, argent séquestré jusqu'à la preuve de livraison, prix transparents.
- **Conçu pour le Nord** : doit fonctionner hors réseau (satellite, preuve de livraison hors-ligne), par défaut.
- **Français d'abord, bilingue fr/en** partout (plateforme + app). Conforme aux lois du Québec (TPS/TVQ, NEQ, PEVL).
- **Simple avant complet** : utilisable par un camionneur avec des gants.

## Méthode de travail (importante)
**Une étape à la fois.** À chaque étape : proposer un **plan approuvé avant de construire**,
puis vérifier selon des critères précis, puis sauvegarder (commit + push). En cas de doute
ou d'options multiples : **poser la question, ne pas deviner**.

## Stack & structure
- Monorepo **pnpm + Turborepo**, **TypeScript strict**.
- `apps/web` — **Next.js** (App Router) + `@supabase/ssr`. Portail expéditeurs + admin. **Développé en premier.**
- `apps/mobile` — **Expo** (React Native). App chauffeur. **Coquille** tant que le web n'est pas fonctionnel.
- `packages/types` — types générés depuis Supabase.
- `packages/core` — taxes TPS/TVQ, rôles, corridors, i18n (constantes).
- `packages/i18n` — catalogues de traduction **fr/en** partagés web + mobile.
- `packages/supabase` — client Supabase typé.
- `supabase/` — migrations SQL, **source de vérité du backend** (à exécuter dans le SQL Editor, dans l'ordre).

### Design system « Nuit boréale » (mode sombre uniquement)
Tokens Tailwind v4 dans `apps/web/app/globals.css` :
fond `#0B121E`, surface `#121C2C`/`#18243A`, bordure `#22314A`, texte `#EDF3F8`/`#8FA1B8`/`#5C6E85`,
accent action `#FF7A29`, live/suivi `#3FD9C2`, succès `#5BD98A`, erreur `#FF5D5D`.
Polices : **Archivo** (titres 700/900), **IBM Plex Sans** (corps), **IBM Plex Mono** (références & montants).
Rayons : cartes 12px, boutons 9px, puces 100px.

## Commandes
```bash
pnpm install            # installer
pnpm web                # portail web → http://localhost:3000
pnpm mobile             # app chauffeur (Expo)
pnpm typecheck          # tous les packages
pnpm --filter @taiga/web build   # build de production web

# Régénérer les types après une migration SQL :
supabase gen types typescript --project-id cqalgxkxlxpwpmuzwhyj --schema public \
  > packages/types/src/database.types.ts
```
> Projet Supabase Taïga — Reference ID : `cqalgxkxlxpwpmuzwhyj` (région Canada Central).
> Le connecteur MCP Supabase pointe vers une AUTRE organisation : pour ce projet, passer par
> la **CLI** (types) ou le **SQL Editor** (migrations), pas par le MCP.

## RLS — conventions apprises (⚠️ à respecter dans les futures phases)
- **Les tables de référence** (corridors, corridor_rates, et à venir : vehicles, drivers,
  departures…) ne sont **pas lisibles par défaut** via l'app : il faut une politique de lecture
  explicite (`for select using (true)` pour la donnée de référence publique) + `grant select`.
  Sans ça, l'app reçoit 0 ligne (sans erreur) et les fonctions qui les lisent (ex. `quote_shipment`
  lit `corridor_rates`) échouent. Voir migration `006`.
- **Éviter la récursion de politiques** : deux tables dont les politiques SELECT se référencent
  mutuellement (shipments ↔ missions) provoquent « infinite recursion detected in policy ».
  Sortir la vérification croisée dans une fonction `security definer` (qui contourne la RLS interne).
  Voir migration `007` (`is_shipment_in_my_missions`, `is_mission_mine_as_shipper`).

## Rôles & routage web
`shipper → /expediteur` · `carrier → /transporteur` · `admin → /admin` · `driver → /chauffeur`.
Auto-inscription réservée à **shipper** et **carrier**. Un transporteur reste **`non vérifié`**
(aucune mission possible) tant que l'admin n'a pas validé ses documents.

## ⚠️ AVANT LA MISE EN PRODUCTION — à ne pas oublier
- [ ] **Réactiver la confirmation par courriel obligatoire** (Supabase → Auth → Providers → Email :
      « Confirm email » = ON). En développement, l'auto-confirm est activé pour aller plus vite.
      ⚠️ **Le flux d'inscription actuel suppose l'auto-confirm** : l'entreprise est créée juste après
      `signUp` (via `create_company_and_link`), ce qui exige une session immédiate. En réactivant la
      confirmation, il faudra revoir l'onboarding — créer l'entreprise **après** la confirmation du
      courriel (ex. page « compléter mon profil » à la première connexion, ou création côté serveur).
- [ ] **Configurer le SMTP avec Resend** (Supabase → Auth → SMTP Settings) pour l'envoi réel des
      courriels d'inscription, de réinitialisation, de notifications — dans la langue du profil.
- [ ] Réviser les politiques RLS restantes (tables non encore couvertes) et lancer les *advisors* Supabase.
- [ ] Ne jamais committer de `.env` (seuls les `.env.example` le sont).
