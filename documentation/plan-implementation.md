# Plan d'implémentation

> Réécriture propre du prototype `old/`, d'après son cahier des charges
> `old/documentation/refonte-astro.md` (cité « CDC §n » ci-dessous).
> Commencé le 13 octobre 2026. **État : étapes 0 à 15 réalisées ; reste le déploiement (Deltouille).** Les décisions prises en route vont dans
> [`decisions.md`](decisions.md) ; ce fichier dit **quoi faire et dans quel ordre**.

## Règles du jeu

Chaque étape se termine seulement quand :

1. **`npm run verify` passe** (`astro check` + build + `node --test`), à partir de l'étape 0.
2. Les tests de l'étape sont **écrits et verts** — et, pour un garde-fou, on l'a
   vu **échouer** en le cassant volontairement.
3. Les décisions prises sont **consignées** dans `decisions.md` (contexte, choix,
   alternatives écartées), et la case de l'étape est cochée ici.
4. Un commit par étape (proposé, pas automatique).

### Stratégie de test

| Niveau | Outil | Ce qu'il couvre |
|---|---|---|
| Unitaire | `node --test` sur des fonctions pures (`src/lib/*.mjs`) | validation du contenu, tri, articles liés, temps de lecture, dates |
| Build | `node --test` sur `dist/` | pages générées, liens internes et ancres, redirections, structure HTML (un seul `h1`, `lang="fr"`, canonical, OG), absence des brouillons |
| Surface d'URL | script `scripts/surface-url.mjs` | liste des `index.html` de `dist/` comparée à `old/dist/` (64 pages) : **aucune URL publiée ne disparaît** |
| Visuel | script `scripts/captures.mjs` (Brave headless, protocole DevTools) | captures pleine page 1440 / 1024 / 390 px × clair / sombre ; comparaison aux captures précédentes ; états au focus clavier |

---

## Étape 0 — Fondations et outillage ✅

- [x] Dépendances : `@astrojs/sitemap`, `pagefind`, `@astrojs/check`, `typescript`.
- [x] Scripts `check`, `test`, `verify`, et `build` = `astro build && pagefind --site dist`.
- [x] `astro.config.mjs` : `site` (variable `SITE_URL`), `output: 'static'`, sitemap, barre d'outils dev désactivée.
- [x] `tsconfig.json` : exclure `old/` et `dist/`.
- [x] `old/` dans `.gitignore` (référence locale, jamais versionnée).
- [x] `<html lang="fr">`, README réécrit (le README actuel est celui du gabarit Astro).
- **Tests** : premier `tests/site.test.mjs` minimal (la page d'accueil est générée, `lang="fr"`) ; `npm run verify` vert.
- **Décidé** : Vercel, `l-histoire-de-genshin-expliquee.vercel.app` (D3). Outillage : D5.

## Étape 1 — Système de design ✅

- [x] `src/styles/global.css` : jetons de couleur en français, clair et sombre (CDC §3), exposés via `@theme inline`.
- [x] Variante `dark` sur `data-theme` (`@custom-variant`).
- [x] **Échelle typographique et d'espacement** dans `@theme` (fini les `text-[11px]`), rayons M3 (`rounded-carte`…), piles système `font-sans` / `font-serif`.
- [x] Points de rupture mobile d'abord : classes de fenêtre M3 plutôt que Tailwind par défaut (D7).
- [x] Styles de base (titres, focus visible, sélection, `kbd`), utilitaires maison en `@utility` (`sur-titre`, `pastille`, `lien-texte`, `fleche-ronde`), `.prose` pour le Markdown.
- [x] Page de démonstration des jetons et composants, servie **en dev uniquement** (sert aux captures visuelles).
- **Tests** : build vert ; contraste des paires de couleurs texte/fond vérifié par un test unitaire (seuil WCAG AA) ; captures clair/sombre de la page de démo.
- **Décidé** : palette tonale M3 **générée** à partir d’une couleur source (D4), mise en œuvre en D6 ; système de design : D7.

## Étape 2 — Mise en page et navigation ✅

- [x] `layouts/Site.astro` : `<head>` (titre, description, canonical, OG, Twitter), script anti-flash du thème (`localStorage` `genshin-theme`), lien d'évitement, `<main>`, pied de page (mention fan non affilié).
- [x] Slot `hero` détecté **au rendu** (piège `Astro.slots.has`).
- [x] `Navbar` : liens, menu déroulant « Le lore » (survol **et** focus clavier), bouton thème (bouton de recherche reporté à l'étape 6) ; transparente sur hero puis opaque (`IntersectionObserver`).
- [x] Menu mobile plein écran : seul le panneau est `fixed`, défilement bloqué, Échap ferme.
- [x] `Icon.astro` (Material Symbols), registre des tags avancé ici pour le menu (D8).
- [x] `scripts/captures.mjs` mis en place **ici** (la navigation est la partie la plus fragile visuellement).
- **Tests** : build (un seul `h1`, canonical, skip link présent) ; captures desktop/mobile × thèmes ; états vérifiés au focus clavier : menu déroulant ouvert, burger ouvert/fermé sans saut de défilement.
- **Décisions** : D8 (mise en page, navigation), D9 (captures).

## Étape 3 — Modèle de contenu ✅

- [x] `src/lib/validation.mjs` écrit **tests d'abord** : tag inconnu, article sans thème, nom réservé → erreur nommant le fichier.
- [x] `src/content.config.ts` : collections `articles` (glob) et `tags` (`file()` sur `tags.yaml`), schémas du CDC §6.
- [x] `src/lib/contenu.ts` : `bibliotheque()`, thème principal, `articlesLies`, chemins, images, temps de lecture, dates en français. Logique pure extraite en `.mjs` pour être testée.
- [x] Migration du contenu de `old/` : 6 articles, `tags.yaml`, images mises à plat dans `src/assets/images/` (D10).
- **Tests** : unitaires (validation, articles liés, tri, temps de lecture) ; build en échec quand on mal orthographie un tag (vérifié à la main, consigné) ; un brouillon n'apparaît pas dans `dist/`.
- **Décision** : D10.

## Étape 4 — Pages de lecture ✅

- [x] `Banniere.astro` commune (image fixe, voile à trois dégradés, vague `fill-fond`), rendue hors du `<main>`.
- [x] Composants extraits : `ArticleCard`, `GrilleArticles`, en-têtes, encadrés `Resume` / `Spoilers` / `Sources`, `Sommaire` (seulement s'il y a des `##`), fil d'Ariane.
- [x] Pages `/lore`, `/lore/[slug]`, `/lore/tags`, `/lore/tags/[tag]`.
- [x] Pages éditoriales `/a-propos` (texte corrigé : retirer « Shirone »), `/confidentialite`, `/404`.
- **Tests** : build — chaque lien et chaque ancre a une cible ; chaque article affiche ses tags et chaque tag a sa page ; encadrés absents quand vides ; captures.
- **Décision** : D11.

## Étape 5 — Page d'accueil ✅

- [x] Hero plein écran plafonné, sur-titre, titre, machine à écrire (premier sujet en dur dans le HTML, immobile sous `prefers-reduced-motion`), boutons « Commencer le voyage » / « Explorer le lore », chiffres.
- [x] Sections « À la une », « Une envie d'explorer ? », « Des histoires à découvrir », bandeau vers les tags — en composants.
- **Tests** : build (le premier sujet est dans le HTML, les boutons pointent vers des pages existantes, chiffres cohérents avec le contenu) ; captures, y compris en mouvement réduit.
- **Décision** : D12.

## Étape 6 — Recherche ✅

- [x] Pagefind : `data-pagefind-body` sur les articles, métadonnées et filtre « thème », brouillons et pied de page exclus.
- [x] `Search.astro` : `<dialog>` (`m-auto`), `Ctrl K` / `⌘ K` selon la plateforme, thème Pagefind via ses variables CSS.
- [x] Bouton de recherche dans la barre de navigation (desktop et mobile), absent tant que la recherche n’existait pas (D8).
- **Tests** : build (index Pagefind généré, filtre présent) ; interaction dans Brave headless : ouverture au clavier, une requête « Venti » renvoie l'article.
- **Décision** : D13 (interface maison sur l'API Pagefind, index servi en dev).

## Étape 7 — Référencement et redirections ✅

- [x] Redirections **figées** reprises de `old/astro.config.mjs`, dans `src/lib/redirections.mjs` (source unique, aussi lue par la validation).
- [x] Sitemap sans la 404, image sociale, `robots.txt` généré.
- **Tests** : chaque redirection pointe vers une page existante ; **surface d'URL identique à `old/dist/`** (écarts justifiés dans `decisions.md`).
- **Décision** : D14.

## Étape 8 — Finitions et mise en ligne ✅ (sauf le déploiement, fait par Deltouille)

- [x] Audit accessibilité automatisé (axe-core dans les captures) et budgets de poids (`tests/poids.test.mjs`).
- [ ] Déploiement, `SITE_URL` de production — **par Deltouille** (cf. README, « Mise en ligne »).
- [x] Vraies redirections 301 côté Vercel : `vercel.json` généré depuis `src/lib/redirections.mjs` (D15).
- [x] Une seule forme d'URL, sans barre finale (D15).
- **Tests** : `npm run verify` + captures complètes de toutes les pages ; Lighthouse sur 3 pages types, scores consignés (100 partout, D15).
- **Décision** : D15.


## Étape 9 — Transitions entre pages ✅ (ajoutée à la demande)

- [x] View Transitions natives entre documents, fondu enchaîné M3, coupées en mouvement réduit.
- [x] Barre de navigation fixe pendant la transition ; carte d'article → bannière (seule la carte cliquée).
- **Tests** : noms uniques par page, correspondance carte ↔ bannière ; captures : transition réelle dans Brave, absente en mouvement réduit.
- **Décision** : D16.

## Étape 10 — Crédits et licences ✅ (ajoutée à la demande)

- [x] Champ `credits` (adaptations du wiki, théories de la communauté), vérifié au build ; encadré « Crédits » en fin d'article.
- [x] Page `/credits` (texte de Deltouille + listes générées), liens en pied de page et dans « À propos ».
- [x] Tous les textes du site sous CC BY-SA 3.0, licence déclarée sur chaque page.
- [x] Licence du code : GNU GPL v3 ou ultérieure, `LICENCES.md` pour le découpage code / textes / HoYoverse (D19).
- **Décisions** : D17, D18, D19.

## Étape 11 — Confort de lecture ✅ (ajoutée à la demande)

- [x] Barre de progression de lecture de l'article, sous la barre de navigation.
- [x] Sommaire « Dans cet article » qui surligne la section en cours.
- [x] Correction : les ancres ne finissent plus sous la barre de navigation fixe.
- **Décision** : D20.

## Étape 12 — Organisation libre du contenu ✅ (ajoutée à la demande)

- [x] Articles rangés librement en sous-dossiers ; URL = nom du fichier seul.
- [x] Doublons de noms détectés au build ; messages avec le vrai chemin.
- [x] Redirection de l'article renommé (`prologue-mondstadt` → `mondstadt-act-i`).
- **Décision** : D21.

## Étape 13 — Contact et mentions légales ✅ (ajoutée à la demande)

- [x] Adresse e-mail retirée du site ; contact par les tickets GitLab.
- [x] Page `/mentions-legales` (éditeur anonyme non professionnel, hébergeur Vercel).
- [x] Liens vers le dépôt (pied de page, crédits, README, LICENCES.md).
- [x] Tickets ouverts à tous : le dépôt a déménagé sur GitHub, où ils le sont (D26).
- [x] Historique git nettoyé avant le premier envoi sur GitHub (D27).
- [x] Éléments d'identification personnelle communiqués à Vercel : nom et prénoms, domicile, téléphone (condition de l'anonymat, LCEN art. 1-1, II) — vérifié par Deltouille le 16 oct. 2026 (D30).
- **Décision** : D22.

## Étape 14 — Crédits des logiciels, nouveau nom ✅ (ajoutée à la demande)

- [x] Section « Logiciels libres utilisés » sur `/credits`, registre `src/lib/tiers.mjs` vérifié par les tests (D23).
- [x] Le site s'appelle « Les Archives de Teyvat », nom écrit une seule fois (D24).
- [x] Correctif : articles déplacés en sous-dossier invisibles en dev (D25).
- **Décisions** : D23, D24, D25.

## Étape 15 — Accueil indépendant des articles ✅ (ajoutée à la demande)

- [x] Sujets de la machine à écrire tirés de tous les articles (`accroche` ou titre), ordre aléatoire à chaque visite.
- [x] « À la une » choisi par le contenu (`aLaUne`, sinon le plus récent) ; l'accueil se construit même sans article.
- **Décision** : D28.

## Étape 16 — Accueil sans machine à écrire ✅ (ajoutée à la demande)

- [x] Ligne « Ici, on vous raconte … » retirée (sujets, curseur, bouton pause, script, champ `accroche`).
- [x] Bannière d'accueil en hauteur minimale : sur petit téléphone, les chiffres restent au-dessus de la vague (capture `accueil-petit-ecran`).
- **Décision** : D37.

---

## Questions ouvertes (CDC §10)

À trancher quand l'étape concernée arrive ; la réponse va dans `decisions.md`.

- ~~Parallaxe au défilement sur les bannières ?~~ Non par défaut, bannière fixe (D11).
- ~~Curseur clignotant et flèche flottante de l'accueil : garder ?~~ Curseur gardé pendant l'animation seulement, flèche fixe, bouton pause (D12) ; machine à écrire retirée depuis (D37).
- ~~Ligne « fil d'Ariane / type » de l'article : pleine largeur ?~~ Alignée sur la colonne de lecture (D11).
- Reprendre du site Nuxt : infobox des régions/personnages, listes curatées, mise en avant, page théories ? (après l'étape 8)
