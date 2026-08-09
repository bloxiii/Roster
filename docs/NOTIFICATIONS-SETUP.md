# Notifications multi-canal — Guide de mise en service

Le code est prêt (email + WhatsApp + Notion). Il ne fonctionnera qu'une
fois les étapes ci-dessous faites. Tant qu'un canal n'est pas configuré,
il est simplement ignoré (aucun crash, juste un log serveur).

**Déclencheur** : email, WhatsApp et Notion se déclenchent tous les trois
au même moment — quand un prospect est qualifié **HOT** ou **WARM** par
l'agent IA à la fin d'une conversation.

---

## 1. Appliquer la migration de base de données

Une seule fois, avant tout le reste.

1. Ouvrir le [Dashboard Supabase](https://supabase.com/dashboard) → votre projet → **SQL Editor** → **New query**
2. Copier-coller le contenu de `supabase/migrations/2026-08-09-notification-channels.sql`
3. Exécuter (**Run**)

Ça ajoute 3 colonnes à `company_settings` : `notification_whatsapp`, `notion_token`, `notion_database_id`. Sans ça, la page Paramètres plantera en essayant de les lire.

---

## 2. Email

**Déjà en place si `RESEND_API_KEY` est configurée** (voir README, section
variables d'environnement) — rien de plus à faire, ça couvrait déjà HOT et
couvre maintenant HOT + WARM.

---

## 3. WhatsApp (via Twilio)

Contrairement à l'email, il n'y a pas d'expéditeur "gratuit" : il faut un
compte Twilio avec un numéro WhatsApp actif. Un seul numéro Twilio pour
toute la plateforme Velinova (chaque entreprise reçoit sur SON numéro perso,
mais l'envoi part toujours du numéro Velinova).

1. Créer un compte sur [twilio.com](https://www.twilio.com/try-twilio)
2. Dans la console Twilio, section **Messaging → Try it out → Send a WhatsApp message** :
   - En test (gratuit) : Twilio fournit un numéro sandbox (`+1 415 523 8886`). Chaque destinataire doit d'abord envoyer un message type `join <mot-code>` à ce numéro depuis WhatsApp pour "s'abonner" — pratique pour tester, pas pour la prod.
   - En production : demander l'activation d'un numéro WhatsApp Business officiel (Twilio guide le processus de validation Meta, ça prend quelques jours).
3. Récupérer sur la page d'accueil de la console Twilio :
   - **Account SID**
   - **Auth Token**
   - Le numéro WhatsApp actif (ex: `whatsapp:+14155238886`)
4. Ajouter ces 3 valeurs comme variables d'environnement du projet (Vercel : Settings → Environment Variables, ou `.env.local` en dev) :
   ```
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```
5. Redéployer.

Chaque entreprise renseigne ensuite **son propre numéro WhatsApp** (celui qui doit recevoir les alertes) dans **Dashboard → Paramètres → Notifications → WhatsApp**, format international (`+33612345678`).

---

## 4. Notion

Ici c'est l'inverse de l'email/WhatsApp : chaque entreprise doit créer SA
PROPRE intégration Notion et nous donner l'accès — Velinova ne peut pas
écrire dans un espace Notion sans autorisation explicite. C'est donc à
faire **par l'entreprise cliente elle-même**, pas par Velinova.

Étapes à suivre côté client (à mettre dans votre doc d'onboarding) :

1. Aller sur [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration**
2. Lui donner un nom (ex: "Velinova"), l'associer au bon workspace, sauvegarder
3. Copier le **token d'intégration** généré (commence par `secret_` ou `ntn_`)
4. Créer (ou choisir) une base Notion de type **base de données** (table) qui recevra les prospects. Elle doit avoir exactement ces colonnes (nom ET type comptent) :

   | Nom de la colonne | Type Notion   |
   | ------------------ | ------------- |
   | `Nom`               | Titre (title) |
   | `Qualification`     | Sélection (select), avec options `HOT`, `WARM`, `COLD` |
   | `Email`              | Email         |
   | `Téléphone`         | Téléphone     |
   | `Budget`             | Texte         |
   | `Localisation`       | Texte         |
   | `Résumé`             | Texte         |

5. Ouvrir cette base dans Notion → menu **···** en haut à droite → **Connexions** (ou "Add connections") → sélectionner l'intégration créée à l'étape 2. Sans ça, l'intégration n'a pas accès à la base même avec le bon token.
6. Récupérer l'**ID de la base** : dans l'URL de la base Notion, c'est la suite de 32 caractères juste après `notion.so/` et avant le `?v=` :
   ```
   https://www.notion.so/monworkspace/1a2b3c4d5e6f...?v=...
                                       └── ID de la base ──┘
   ```
7. Dans **Dashboard → Paramètres → Notifications → Synchronisation Notion**, coller le token et l'ID de la base, puis **Enregistrer**.

---

## Récapitulatif

| Canal    | Qui configure quoi                                                  |
| -------- | --------------------------------------------------------------------- |
| Email    | Déjà en place (RESEND_API_KEY, une fois pour toute la plateforme)   |
| WhatsApp | Vous (Velinova) : compte Twilio, une fois pour toute la plateforme. Chaque client renseigne juste son numéro. |
| Notion   | Chaque client crée sa propre intégration + colle token/ID dans ses paramètres. |
