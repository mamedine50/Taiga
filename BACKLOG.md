# Backlog Taïga

Éléments identifiés, à traiter **après l'app mobile** (sauf mention contraire).

## À traiter après le mobile (demandé)
- [ ] **Expiration des missions par job** — auto-expirer les missions `offerte` dont `expires_at` est dépassé (cron/edge function). Aujourd'hui vérifié uniquement à l'acceptation.
- [ ] **Cycle de vie des départs** — actions admin `parti` / `arrivé` / `fermé` (statuts prévus au schéma, inutilisés).
- [ ] **Workflow des demandes de trajet** — statuts `nouveau` / `en_analyse` / `traité` + actions admin sur `route_requests`.

## Autres écarts connus (plus tard)
- [ ] **Nettoyage des données de démo** avant lancement (comptes `demo-*@example.com`, expédition `TG-2607-0008`, compte non confirmé du 1er essai).
- [ ] **Avant prod** : réactiver la confirmation par courriel + SMTP Resend + revoir l'onboarding (voir CLAUDE.md).
- [ ] **Suivi GPS temps réel** (`tracking_points`) — phase dédiée.
- [ ] **Tables sans UI** : `ratings`, `disputes`, `messages`, `backhaul_offers`, `mission_stops` (au-delà du mobile).
- [ ] **Avertissement Edge Runtime** (`process.version` de supabase-js dans le middleware) — bénin, à surveiller.
- [ ] **ESLint non configuré** sur `apps/web` — ajouter une config si on veut du lint CI.
