# Velinova — Site vitrine

Site web professionnel pour Velinova, startup d'agents IA ("employés numériques").

## Stack technique

| Couche        | Technologie                                   |
| ------------- | --------------------------------------------- |
| Framework     | Next.js 16 (App Router, SSG)                  |
| Langage       | TypeScript (strict)                            |
| Styling       | Tailwind CSS v4                               |
| i18n          | next-intl (FR par défaut, EN)                 |
| Validation    | Zod (client + serveur)                        |
| Email         | Resend                                        |
| Hébergement   | Vercel (recommandé)                           |

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# 3. Lancer le serveur de développement
npm run dev
```

## Variables d'environnement

| Variable              | Obligatoire | Description                                    |
| --------------------- | ----------- | ---------------------------------------------- |
| `RESEND_API_KEY`      | Non*        | Clé API Resend pour l'envoi d'emails           |
| `CONTACT_EMAIL_TO`    | Non         | Email destinataire (défaut: contact@example.com) |
| `CONTACT_EMAIL_FROM`  | Non         | Email expéditeur (défaut: Velinova <onboarding@resend.dev>) |
| `TWILIO_ACCOUNT_SID`  | Non         | SID du compte Twilio (notifications WhatsApp prospects) |
| `TWILIO_AUTH_TOKEN`   | Non         | Token d'authentification Twilio                |
| `TWILIO_WHATSAPP_FROM`| Non         | Numéro WhatsApp expéditeur (ex: `whatsapp:+14155238886`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Non   | Clé service role Supabase (buckets storage, webhooks internes) |
| `THREED_PROVIDER`     | Non         | Fournisseur de reconstruction 3D actif (Visites 3D) — défaut: `modal` |
| `THREED_WORKER_URL`   | Non         | URL du worker de reconstruction 3D déployé sur Modal — voir `worker/README.md` |
| `THREED_WEBHOOK_SECRET` | Non       | Secret partagé pour authentifier le webhook de fin de traitement 3D |
| `NEXT_PUBLIC_APP_URL` | Non         | URL publique de l'app, pour construire l'URL de webhook envoyée au worker et l'URL du pixel de suivi d'ouverture des emails d'outreach |

*Sans `RESEND_API_KEY`, le formulaire de contact fonctionne mais les demandes
sont uniquement journalisées côté serveur (pas d'email envoyé). Pratique pour
le développement et les previews.

## Visites 3D (Velinova 3D)

Génère automatiquement une visite virtuelle 3D navigable à partir d'une
vidéo smartphone (upload → reconstruction → viewer web). Voir
[`docs/VELINOVA-3D.md`](docs/VELINOVA-3D.md) pour l'analyse complète
(faisabilité, architecture, coûts, RGPD) et [`worker/README.md`](worker/README.md)
pour le déploiement du worker de reconstruction (COLMAP + gsplat sur GPU
serverless Modal — pipeline maison, pas d'API tierce).

Parcours : Dashboard → *Visites 3D* → *Créer une visite 3D* → upload →
traitement automatique → lien de partage (`/v/[slug]`, page publique non
indexée). Une scène de démonstration synthétique (pas un vrai bien) est
disponible sur `/v/demo` pour vérifier que le viewer fonctionne avant
d'avoir une première reconstruction réelle.

## Architecture

```
app/
  [locale]/          # Pages par langue (FR/EN)
    layout.tsx       # Layout racine avec i18n + metadata SEO
    page.tsx         # Page d'accueil (assemble les sections)
  api/contact/       # Endpoint formulaire de contact
  globals.css        # Design system (tokens, palette, typographie)
components/
  layout/            # Header, Footer, MobileMenu, LocaleSwitcher
  sections/          # Sections de la page d'accueil
  ui/                # Composants réutilisables (Button, Container, Eyebrow, StatusBadge)
i18n/                # Configuration des locales et routing
lib/                 # Logique métier (validation, email)
messages/            # Fichiers de traduction FR/EN
types/               # Types TypeScript partagés
```

## Design system

- **Palette** : fond encre `#0B0F1A`, accent laiton `#C9A66B`, texte crème `#F5F3EE`
- **Typographie** : pile de polices système (Söhne > Inter > system-ui pour display/body, IBM Plex Mono pour les données/statuts)
- **Signature visuelle** : chaque agent IA est présenté comme une fiche employé avec badge de statut animé

> Pour brancher une police de marque (ex: Inter via Google Fonts), modifier
> `--font-display` et `--font-body` dans `globals.css` et ajouter le chargement
> dans `layout.tsx`.

## Commandes

```bash
npm run dev       # Serveur de développement
npm run build     # Build de production
npm run start     # Serveur de production
npm run lint      # Vérification ESLint
```

## Déploiement sur Vercel

1. Connecter le repo Git sur [vercel.com](https://vercel.com)
2. Le framework Next.js est détecté automatiquement
3. Ajouter les variables d'environnement dans les settings du projet
4. Configurer le domaine personnalisé
5. Chaque push sur `main` déclenche un déploiement automatique

## Prochaines étapes (post-MVP)

- [ ] Brancher une police de marque (Söhne, Inter Pro, ou personnalisée)
- [ ] Ajouter un logo SVG personnalisé
- [ ] Connecter Resend avec un domaine d'envoi vérifié
- [ ] Ajouter des animations au scroll (Framer Motion, optionnel)
- [ ] Ajouter une page `/mentions-legales` et `/politique-de-confidentialite`
- [ ] Brancher un CMS (Sanity/Contentful) si le volume de contenu augmente
- [ ] Ajouter un blog pour le SEO organique
- [ ] Intégrer un outil d'analytics (Vercel Analytics, Plausible, PostHog)
