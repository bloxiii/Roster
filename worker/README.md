# Worker de reconstruction 3D (Velinova 3D)

Pipeline maison — COLMAP + [gsplat](https://github.com/nerfstudio-project/gsplat)
(licence Apache 2.0) — déployé comme fonction GPU serverless sur
[Modal](https://modal.com). C'est le choix retenu en section 03 de
l'analyse (Option B : notre code, sur une infra GPU à la demande, plutôt
qu'un fournisseur tiers ou un cluster GPU auto-géré).

## ⚠️ Statut réel

Ce code n'a **pas été exécuté** dans cet environnement de développement —
pas de GPU, ni ffmpeg/COLMAP installés ici (sandbox CPU seul, voir le
résumé d'implémentation transmis avec ce commit). Il est écrit pour être
déployé et testé tel quel, mais **l'étape `train_gaussian_splats()`
(pipeline.py) est la plus incertaine** : elle invoque le script d'exemple
livré avec gsplat (`examples/simple_trainer.py`), dont l'interface en
ligne de commande peut varier d'une version à l'autre du package. **Avant
tout déploiement réel, testez cette étape isolément** (voir "Tester avant
de vous fier au pipeline complet" plus bas).

## Prérequis

1. Un compte [Modal](https://modal.com) (offre gratuite avec crédits GPU à
   l'inscription, largement suffisante pour les premiers tests).
2. Le CLI Modal : `pip install modal`, puis `modal token new` (ouvre une
   fenêtre de connexion dans le navigateur).
3. Les identifiants Supabase du projet Velinova (service role key — la
   même variable `SUPABASE_SERVICE_ROLE_KEY` que l'application Next.js).

## 1. Créer le secret Modal

Le worker lit trois valeurs depuis un secret Modal nommé `velinova-3d` :

```bash
modal secret create velinova-3d \
  SUPABASE_URL=https://xxxxx.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=eyJ... \
  THREED_WEBHOOK_SECRET=<une_valeur_aléatoire_longue>
```

`THREED_WEBHOOK_SECRET` doit être **la même valeur** que celle configurée
côté application Next.js (variable d'env `THREED_WEBHOOK_SECRET`) — c'est
ce qui authentifie les deux sens de la communication (app → worker au
démarrage du job, worker → app pour le webhook de fin).

Générer une valeur : `openssl rand -hex 32`

## 2. Déployer

```bash
cd worker
modal deploy pipeline.py
```

Modal affiche l'URL HTTPS du endpoint `reconstruct_endpoint` à la fin du
déploiement, de la forme :

```
https://<votre-org>--velinova-3d-worker-reconstruct-endpoint.modal.run
```

## 3. Configurer l'application Next.js

Dans les variables d'environnement Vercel (ou `.env.local` en dev) :

```
THREED_PROVIDER=modal
THREED_WORKER_URL=https://<votre-org>--velinova-3d-worker-reconstruct-endpoint.modal.run
THREED_WEBHOOK_SECRET=<la_même_valeur_que_dans_le_secret_Modal>
```

`lib/tours/providers/modal.ts` POST directement sur `THREED_WORKER_URL` —
c'est l'URL complète du endpoint telle qu'affichée par `modal deploy`,
sans rien à ajouter derrière.

## 4. Le webhook doit être joignable depuis Internet

Le worker termine son travail en POSTant sur `webhook_url`
(`{NEXT_PUBLIC_APP_URL}/api/tours/webhook`). En développement local, votre
`localhost` n'est pas joignable depuis Modal — utilisez un tunnel
(`ngrok http 3000`, ou équivalent) et positionnez `NEXT_PUBLIC_APP_URL` sur
l'URL du tunnel le temps du test. En production sur Vercel, l'URL publique
du déploiement suffit — rien à faire de spécial.

## Tester avant de vous fier au pipeline complet

Dans l'ordre, du plus rapide au plus coûteux à déboguer :

1. **`ffmpeg`/COLMAP seuls** : lancez `modal run pipeline.py::reconstruct
   --tour-id test --video-url <url_d'une_vidéo_de_test> --webhook-url
   https://httpbin.org/post --provider-job-id test` (httpbin renvoie
   simplement ce qu'il reçoit — utile pour vérifier le format du webhook
   sans toucher à votre vraie base). Regardez les logs Modal : le taux de
   frames enregistrées (`registered_frame_ratio`) doit apparaître avant
   l'échec ou le succès.
2. **`simple_trainer.py`** : si l'étape COLMAP passe mais que
   l'entraînement échoue, connectez-vous à l'image via `modal shell
   pipeline.py` et lancez `python /opt/gsplat-src/examples/simple_trainer.py
   --help` pour voir les arguments réellement supportés par la version
   installée — ajustez `train_gaussian_splats()` en conséquence.
3. **Bout en bout** : une fois les deux étapes ci-dessus validées, refaites
   tourner avec un vrai `webhook_url` pointant vers votre application, et
   vérifiez qu'une ligne `tours` passe bien à `ready` avec un `scene_url`
   chargeable dans le viewer.

## Coûts

GPU L4 à la demande sur Modal, facturé à la seconde, pas de coût quand le
worker est inactif (scale à zéro). Section 10 de l'analyse : ordre de
grandeur ~1–2€ de calcul GPU par visite reconstruite à ce stade — à
confirmer avec vos propres mesures une fois le pipeline validé sur des
vidéos réelles (le temps réel dépend fortement de la durée de la vidéo et
du nombre de frames extraites).
