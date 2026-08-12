# Velinova 3D — Visites virtuelles 3D

Génère automatiquement une visite virtuelle 3D navigable à partir d'une
vidéo smartphone : upload → reconstruction 3D → viewer web. Le code est
en place ; ce document explique les décisions d'architecture et comment
mettre le pipeline en service.

## Décisions retenues

- **Reconstruction** : 3D Gaussian Splatting (photoréaliste, temps réel
  navigateur), pas NeRF ni photogrammétrie classique — pipeline
  COLMAP (poses caméra) → [gsplat](https://github.com/nerfstudio-project/gsplat)
  (entraînement, licence **Apache 2.0** — pas l'implémentation de
  référence Inria, qui est non-commerciale).
- **Pipeline maison, pas d'API tierce** (Luma/Polycam/...) — décision
  prise pour réduire le coût par visite. Le code du pipeline (`worker/`)
  tourne sur du **GPU serverless Modal** (paie au calcul réel, scale à
  zéro) plutôt que sur un cluster GPU auto-géré — évite l'essentiel du
  fardeau d'ops sans payer la marge d'un fournisseur tout-en-un.
- **Navigation hybride** dans le viewer : glissement fluide entre points
  de vue prédéfinis (dérivés automatiquement des poses caméra) + regard
  libre à 360° à chaque arrêt. Jamais de déplacement libre en 3D — ça
  exposerait systématiquement les artefacts du 3DGS dès qu'on s'éloigne de
  la trajectoire filmée.
- **Le calcul ne tourne jamais dans une fonction Vercel** — trop long
  (plusieurs minutes) et nécessite un GPU. Vercel ne fait que créer le job
  et recevoir le webhook de fin de traitement.

Le raisonnement complet (faisabilité, comparatif API vs maison, contraintes
de tournage, coûts par volume, RGPD) a été produit comme document d'analyse
avant l'implémentation — demandez le lien de l'artefact si vous ne l'avez
plus sous la main.

## Ce qui est réellement fonctionnel vs ce qui est mocké

| Composant | Statut |
| --- | --- |
| Upload direct navigateur → Supabase Storage | ✅ Fonctionnel |
| Dashboard (créer / suivre / lister les visites) | ✅ Fonctionnel |
| RLS multi-tenant sur `tours` | ✅ Fonctionnel |
| Viewer web (three.js + navigation hybride) | ✅ Fonctionnel — testable dès maintenant sur `/v/demo` (scène **synthétique**, pas un vrai bien) |
| Détection de vidéo insuffisante (§ qualité) | ✅ Code en place (`registered_frame_ratio` dans `worker/pipeline.py`) |
| `lib/tours/provider.ts` (abstraction fournisseur) | ✅ Fonctionnel |
| `worker/pipeline.py` (COLMAP + gsplat sur Modal) | ⚠️ Code réel, **non exécuté** — pas de GPU/ffmpeg/COLMAP dans l'environnement où il a été écrit. L'étape d'entraînement gsplat en particulier est à valider avec la version installée avant mise en production (voir `worker/README.md`). |
| Suppression automatique de la vidéo source | ✅ Fonctionnel (déclenchée par le webhook, sur succès) |

## Mise en service

1. **Migration base de données** — Dashboard Supabase → SQL Editor → coller
   `supabase/migrations/2026-08-12-tours.sql` → Run. Crée la table `tours`,
   ses policies RLS, et les deux buckets Storage (`tour-videos` privé,
   `tour-scenes` public en lecture).
2. **Worker de reconstruction** — suivre `worker/README.md` (compte Modal,
   secret, `modal deploy`). Sans ça, `THREED_WORKER_URL` n'est pas
   configurée et `/api/tours/[id]/start` échoue explicitement (pas de faux
   succès silencieux).
3. **Variables d'environnement de l'app** — voir `.env.example` :
   `THREED_PROVIDER`, `THREED_WORKER_URL`, `THREED_WEBHOOK_SECRET` (même
   valeur que le secret Modal), `SUPABASE_SERVICE_ROLE_KEY`.
4. **Tester le viewer sans attendre une vraie reconstruction** — `/v/demo`
   charge une petite scène synthétique (`public/demo/sample-scene.splat`,
   quelques centaines de points générés à la main) pour vérifier que le
   chargement et la navigation fonctionnent avant d'avoir une première
   vidéo traitée.
5. **Premier test réel** — filmer un bien en suivant les consignes
   affichées sur `/dashboard/tours/new`, uploader, attendre le traitement,
   ouvrir le lien `/v/[slug]` généré.

## Hors périmètre pour l'instant

Nettoyage manuel de scène, génération de plan 2D, fusion de plusieurs
vidéos, app mobile native, VR/casque, marque blanche du viewer — voir le
document d'analyse pour le détail du MVP retenu.
