# Plan d'implémentation

> Réécriture propre du prototype `old/`, d'après son cahier des charges
> `old/documentation/refonte-astro.md` (cité « CDC §n » ci-dessous).
> Commencé le 13 octobre 2026. Les décisions prises en route vont dans
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

## Étape 1 — Système de design

- [ ] `src/styles/global.css` : jetons de couleur en français, clair et sombre (CDC §3), exposés via `@theme inline`.
- [ ] Variante `dark` sur `data-theme` (`@custom-variant`).
- [ ] **Échelle typographique et d'espacement** dans `@theme` (fini les `text-[11px]`), rayons M3 (`rounded-carte`…), piles système `font-sans` / `font-serif`.
- [ ] Points de rupture **Tailwind par défaut, mobile d'abord**.
- [ ] Styles de base (titres, focus visible, sélection, `kbd`), utilitaires maison en `@utility` (`sur-titre`, `pastille`, `lien-texte`, `fleche-ronde`), `.prose` pour le Markdown.
- [ ] Page de démonstration des jetons et composants, servie **en dev uniquement** (sert aux captures visuelles).
- **Tests** : build vert ; contraste des paires de couleurs texte/fond vérifié par un test unitaire (seuil WCAG AA) ; captures clair/sombre de la page de démo.
- **Décidé** : palette tonale M3 **générée** à partir d’une couleur source (D4), réversible si le rendu déçoit.

## Étape 2 — Mise en page et navigation

- [ ] `layouts/Site.astro` : `<head>` (titre, description, canonical, OG, Twitter), script anti-flash du thème (`localStorage` `genshin-theme`), lien d'évitement, `<main>`, pied de page (mention fan non affilié).
- [ ] Slot `hero` détecté **au rendu** (piège `Astro.slots.has`).
- [ ] `Navbar` : liens, menu déroulant « Le lore » (survol **et** focus clavier), bouton thème, raccourci recherche ; transparente sur hero puis opaque (`IntersectionObserver`).
- [ ] Menu mobile plein écran : seul le panneau est `fixed`, défilement bloqué, Échap ferme.
- [ ] `Icon.astro`.
- [ ] `scripts/captures.mjs` mis en place **ici** (la navigation est la partie la plus fragile visuellement).
- **Tests** : build (un seul `h1`, canonical, skip link présent) ; captures desktop/mobile × thèmes ; états vérifiés au focus clavier : menu déroulant ouvert, burger ouvert/fermé sans saut de défilement.

## Étape 3 — Modèle de contenu

- [ ] `src/lib/validation.mjs` écrit **tests d'abord** : tag inconnu, article sans thème, nom réservé → erreur nommant le fichier.
- [ ] `src/content.config.ts` : collections `articles` (glob) et `tags` (`file()` sur `tags.yaml`), schémas du CDC §6.
- [ ] `src/lib/contenu.ts` : `bibliotheque()`, thème principal, `articlesLies`, chemins, images, temps de lecture, dates en français. Logique pure extraite en `.mjs` pour être testée.
- [ ] Migration du contenu de `old/` : 6 articles, `tags.yaml`, images (`old/src/assets/images/`).
- **Tests** : unitaires (validation, articles liés, tri, temps de lecture) ; build en échec quand on mal orthographie un tag (vérifié à la main, consigné) ; un brouillon n'apparaît pas dans `dist/`.

## Étape 4 — Pages de lecture

- [ ] `Banniere.astro` commune (image fixe, voile à trois dégradés, vague `fill-fond`), rendue hors du `<main>`.
- [ ] Composants extraits : `ArticleCard`, `GrilleArticles`, en-têtes, encadrés `Resume` / `Spoilers` / `Sources`, `Sommaire` (seulement s'il y a des `##`), fil d'Ariane.
- [ ] Pages `/lore`, `/lore/[slug]`, `/lore/tags`, `/lore/tags/[tag]`.
- [ ] Pages éditoriales `/a-propos` (texte corrigé : retirer « Shirone »), `/confidentialite`, `/404`.
- **Tests** : build — chaque lien et chaque ancre a une cible ; chaque article affiche ses tags et chaque tag a sa page ; encadrés absents quand vides ; captures.

## Étape 5 — Page d'accueil

- [ ] Hero plein écran plafonné, sur-titre, titre, machine à écrire (premier sujet en dur dans le HTML, immobile sous `prefers-reduced-motion`), boutons « Commencer le voyage » / « Explorer le lore », chiffres.
- [ ] Sections « À la une », « Une envie d'explorer ? », « Des histoires à découvrir », bandeau vers les tags — en composants.
- **Tests** : build (le premier sujet est dans le HTML, les boutons pointent vers des pages existantes, chiffres cohérents avec le contenu) ; captures, y compris en mouvement réduit.

## Étape 6 — Recherche

- [ ] Pagefind : `data-pagefind-body` sur les articles, métadonnées et filtre « thème », brouillons et pied de page exclus.
- [ ] `Search.astro` : `<dialog>` (`m-auto`), `Ctrl K` / `⌘ K` selon la plateforme, thème Pagefind via ses variables CSS.
- **Tests** : build (index Pagefind généré, filtre présent) ; interaction dans Brave headless : ouverture au clavier, une requête « Venti » renvoie l'article.

## Étape 7 — Référencement et redirections

- [ ] Redirections **figées** reprises de `old/astro.config.mjs`.
- [ ] Sitemap sans la 404, image sociale, `robots`.
- **Tests** : chaque redirection pointe vers une page existante ; **surface d'URL identique à `old/dist/`** (écarts justifiés dans `decisions.md`).

## Étape 8 — Finitions et mise en ligne

- [ ] Audit accessibilité (clavier, contrastes, `alt`) et poids des pages (images `astro:assets`, JS minimal).
- [ ] Déploiement, `SITE_URL` de production.
- **Tests** : `npm run verify` + captures complètes de toutes les pages ; Lighthouse sur 3 pages types, scores consignés.

---

## Questions ouvertes (CDC §10)

À trancher quand l'étape concernée arrive ; la réponse va dans `decisions.md`.

- Parallaxe au défilement sur les bannières ? (étape 4)
- Curseur clignotant et flèche flottante de l'accueil : garder ? (étape 5)
- Ligne « fil d'Ariane / type » de l'article : pleine largeur ? (étape 4)
- Reprendre du site Nuxt : infobox des régions/personnages, listes curatées, mise en avant, page théories ? (après l'étape 8)
