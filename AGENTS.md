# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Le projet

Blog statique « Les Archives de Teyvat » : raconter le lore de Genshin Impact à la communauté française. Astro (sortie statique) + Tailwind CSS v4 (via `@tailwindcss/vite`, pas d'intégration `@astrojs/tailwind`), look Material 3. Tout le contenu, l'interface **et le code** (noms de variables, composants, champs de frontmatter, jetons de couleur) sont en français.

Ce dépôt est la **réécriture propre** d'un prototype (MVC) rangé dans `old/` (non versionné).

**Méthode de travail** : suivre `documentation/plan-implementation.md` étape par étape. Chaque étape se termine par des tests écrits et `npm run verify` vert, et chaque décision (contexte, choix, alternatives écartées) est consignée dans `documentation/decisions.md`.

- `old/documentation/refonte-astro.md` est le **cahier des charges** : décisions, pièges rencontrés, et section 10 « Pour le projet propre » (à reprendre / à faire mieux / questions ouvertes). Le lire avant toute tâche structurante.
- `old/documentation/refonte-du-modele-de-contenu.md` : historique des décisions de modèle de contenu (époque Nuxt) — contexte seulement.
- `old/CLAUDE.md` résume les conventions du prototype (styles, contenu).
- `old/src/` sert de référence d'implémentation : `content.config.ts`, `lib/contenu.ts`, `lib/validation.mjs`, `layouts/Site.astro`, `components/`, `content/` (articles + `tags.yaml`), images dans `src/assets/images/`. Reprendre le **comportement**, pas forcément le balisage tel quel.
- `old/` est exclu de `tsconfig.json` et ignoré par git.

## Commandes

```
npm run dev        # pour un agent : astro dev --background (puis astro dev stop|status|logs)
npm run build      # astro build && pagefind --site dist
npm run check      # astro check
npm test           # node --test tests/*.test.mjs ; un seul fichier : node --test tests/site.test.mjs
npm run verify     # check + build + test : doit passer avant de clore une étape
npm run palette    # régénère src/styles/palette.css depuis scripts/palette.mjs
npm run captures   # captures + vérifications interactives + audit axe-core (Brave headless) ; serveur de dev requis ; -- --filtre <scène>, -- --reference, -- --base <url> (contre astro preview : scènes /demo sautées)
npm run vercel     # régénère vercel.json (301, en-têtes) depuis src/lib/redirections.mjs
```

Pas de linter. `tests/site.test.mjs`, `pages.test.mjs` et `poids.test.mjs` lisent `dist/` (build requis) ; `poids.test.mjs` fixe les budgets (HTML, JS, CSS, images, image de partage) — un dépassement est une décision à consigner, pas un seuil à relever en silence. Chaque scène des captures est auditée par axe-core (WCAG 2.2 A/AA) : zéro violation. `npm run captures` (hors `verify`, il faut un navigateur) vérifie ce que `dist/` ne montre pas — barre sur bannière, menus au clavier, menu mobile, absence de défilement horizontal — et doit passer avant de clore une étape qui touche à l'interface. Nouveau comportement interactif → nouvelle scène dans `scripts/captures.mjs` ; pour tester une animation, `mouvement: true` (sinon le mouvement réduit est émulé), et vérifier qu'une vérification sait échouer en sabotant le code ; pour suivre un lien, `navigation: '<sélecteur>'` (puis `window.__transition` dit si la page a été révélée par une View Transition) ; pour le clavier, utiliser `clavier` (vraies frappes : `{ touche, ctrl? }`, `{ texte }`, `{ attendre }`) : un `.focus()` par script ne déclenche pas `:focus-visible`. `tests/pages.test.mjs` compare `dist/` aux sources lues par `tests/sources.mjs`. Les pages d'outillage `/demo*` n'existent qu'en dev (intégration `outillageDeDev` dans `astro.config.mjs`, qui sert aussi `dist/pagefind` en dev : lancer `npm run build` avant `npm run captures` pour que la recherche ait un index à jour). Astro 7 refuse un second serveur de dev pour le même projet : si Deltouille a déjà un `npm run dev` ouvert, ne pas l'arrêter ; passer par `astro preview --port 4330` et `npm run captures -- --base http://localhost:4330`. Les fonctions pures de `src/lib/` (validation du contenu, etc.) ont leurs tests unitaires, qui ne demandent pas de build.

## Choix techniques retenus (cf. refonte-astro.md §2, §10)

- **Aucune bibliothèque de composants Material** (`@material/web` est en maintenance, les composants Lit/Shadow DOM s'affichent après le JS). Le look M3 vient des **jetons de couleur et des rayons** dans `@theme`.
- **Composants `.astro` sans framework client** ; l'interactivité (menu, thème, machine à écrire, recherche) tient dans de petits `<script>`.
- **Pagefind** pour la recherche (index statique au build, articles seulement), avec une interface maison sur son API JavaScript (`src/components/Recherche.astro`) ; **`@astrojs/sitemap`**.
- **Aucune webfont** : piles système uniquement (engagement écrit dans la page Confidentialité).
- Thème sombre porté par `data-theme` sur `<html>` (pas la media query), mémorisé dans `localStorage` (`genshin-theme`), appliqué par un script inline dans `<head>` (anti-flash). Variante : `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`.
- Composants plus petits que dans le prototype : extraire carte « À la une », tuile de thème, encadrés (spoilers, résumé, sources), sommaire.

### Système de design (decisions.md D6, D7 ; planche visible sur `/demo` en dev)

- **Couleurs** : `src/styles/palette.css` est **généré** par `scripts/palette.mjs` (Material Color Utilities, Tonal Spot, source `#355f98`) — ne jamais l'éditer à la main : modifier le script puis `npm run palette`. Jetons français rattachés à des rôles M3 (`fond`, `surface`, `doux`, `tonal`/`sur-tonal`, `ligne`, `contour`, `texte`, `discret`, `primaire`/`sur-primaire`, `conteneur-primaire`, `or`…) ; ils basculent seuls avec le thème, `dark:` ne sert qu'aux couleurs fixes (`ciel`, `ciel-clair`, `nuit`, `ambre`). Survol : `primaire-survol`, `tonal-survol` (couche d'état M3). `ligne` est décoratif ; une bordure de contrôle interactif utilise `contour`.
- **Tailles de texte, rayons, ombres** : seules les échelles M3 existent (`text-corps-m`, `text-titre-g`, `rounded-carte`, `rounded-moyen`, `shadow-niveau-2`…) ; celles de Tailwind (`text-sm`, `rounded-lg`, `shadow-md`) sont supprimées. Pas de taille arbitraire `text-[…]`.
- **Points de rupture** : classes de fenêtre M3, mobile d'abord — `sm` 600, `md` 840, `lg` 1200, `xl` 1600 (pas de `2xl`).
- **Mouvement** : rien ne bouge sous `prefers-reduced-motion` ; toute animation automatique de plus de 5 s a un bouton pause (WCAG 2.2.2) ; un texte animé est `aria-hidden` avec un équivalent `sr-only`. Couleurs personnalisées (or, jade) : liste `PERSONNALISEES` de `scripts/palette.mjs`.
- **Transitions entre pages** : View Transitions natives (CSS dans `global.css`, pas de `<ClientRouter />` : les scripts supposent un vrai chargement de page). Un `view-transition-name` doit être **unique par page** (sinon toute la transition saute ; testé). La bannière d'article porte `image-<id>` ; les cartes n'ont que `data-transition`, le nom leur est donné au clic par le script en ligne du `<head>` de `Site.astro`.
- **Lecture d'un article** : barre de progression (`ProgressionLecture.astro`, mesure `[data-lecture]`) et sommaire suivi (`aria-current="true"` posé par le script de `Sommaire.astro`). Les classes `scale-*` de Tailwind v4 utilisent la propriété `scale`, pas `transform` : ne pas mélanger les deux. `scroll-padding-top` garde les ancres hors de la barre fixe.
- **États** : survol = couche d'état M3 via l'opacité (`hover:bg-texte/8`) ; élément actif = `bg-tonal text-sur-tonal`. Variante `sur-image:` = barre transparente posée sur une bannière (`data-sur-image`, géré par `Navbar.astro`). Les couleurs Tailwind par défaut sont supprimées (restent `white`/`black` pour le verre sur image).
- **Icônes** : Material Symbols arrondies, déclarées dans `src/lib/icones.ts` (nom français → fichier du paquet `@material-symbols/svg-400`), rendues par `<Icon nom="…" />` ; le tracé est inséré au build. Le logo est `<Marque />`.
- Écrire les classes Tailwind en entier : `` `text-${taille}` `` n'est pas détecté.
- La machine de dev n'a aucune police serif : les titres y apparaissent sans empattement sur les captures, c'est attendu.

## Modèle de contenu : tout en tags

- **Un article = un fichier**, rangé **où l'on veut** sous `src/content/articles/` (sous-dossiers libres). URL `/lore/<nom-du-fichier>` : l'identifiant vient du **nom du fichier seul** (`src/lib/identifiant.mjs` : minuscules, sans accents, tirets), jamais du dossier ni des tags. Déplacer un fichier ne change pas son URL ; deux fichiers de même nom font échouer le build. (En dev, un déplacement faisait disparaître l'article : contourné dans `outillageDeDev`, D25.) **Renommer** un fichier change l'URL : ajouter sa redirection dans `ARTICLES_RENOMMES` (`src/lib/redirections.mjs`) puis `npm run vercel`.
- Frontmatter : `titre`, `description`, `image` (nom, sans extension, d'un fichier **à plat** `src/assets/images/<nom>.webp`), `publieLe`, `tags`. Facultatifs : `imageAlt`, `modifieLe`, `brouillon`, les encadrés `resume`, `spoilers`, `sources` (repères dans le jeu), et `credits` (contenus repris : `type: wiki` avec `titre`, `url`, `modifications` obligatoires ; `type: communaute` avec `auteur`, `plateforme`, `url`, `titre?` — règles dans `src/lib/credits.mjs`). Encadrés affichés seulement s'ils sont remplis.
- **Licences** (`LICENCES.md`) : le **code** est sous GPL-3.0-or-later (`LICENSE`) ; toute nouvelle dépendance doit être compatible GPL v3 (`tests/licences.test.mjs` échoue sinon : examiner avant d'élargir la liste). Tous les textes du site sont sous CC BY-SA 3.0 (`<link rel="license">` dans `Site.astro`, page `/credits`) ; les éléments de HoYoverse en sont exclus. Un article adapté d'une page du wiki doit déclarer son crédit `wiki` (le build vérifie lien et modifications).
- **Registre unique `src/content/tags.yaml`** (loader `file()`) : libellé + description par tag. Les tags `theme: true` remplacent les catégories : ils ont `singulier` et `icone`, alimentent le menu, et le **premier tag-thème** d'un article donne son badge, son fil d'Ariane et le filtre Pagefind.
- Garde-fous (`src/lib/validation.mjs`, fonction pure, sur **tous** les articles, brouillons compris) : tag non déclaré, article sans thème, nom de fichier réservé (`tags`, anciennes catégories), image absente, `modifieLe` < `publieLe`, thème sans `singulier`/`icone`, crédit invalide → le build échoue en nommant le fichier. Nouvelle règle de contenu → l'ajouter là, avec son test.
- Les pages obtiennent le contenu par `bibliotheque()` (`src/lib/contenu.ts`), jamais par `getCollection` directement : c'est ce qui garantit la validation et l'exclusion des brouillons. La logique (tri, articles liés, thème principal, temps de lecture, dates) est dans `src/lib/bibliotheque.mjs`, testée sans build.
- Brouillons visibles en dev, exclus du build. Listes triées par date décroissante. « Pour aller plus loin » = les 3 articles partageant le plus de tags.
- **URL sans barre finale** (`trailingSlash: 'never'`) : liens, canoniques et sitemap ont la même forme. `<Image>` reçoit `width` = la plus grande valeur de `widths` (sinon son `src` de repli est l'original ré-encodé).
- **Cartes et listes cliquables** : un seul lien par carte (le titre, étendu par `after:absolute after:inset-0`), contour de focus porté par la carte (`has-[a:focus-visible]:outline-3 …`). Composants de page dans `src/components/` (bannière, en-têtes, fil d'Ariane, puces, encadrés, sommaire).
- `premiers-pas` est un tag ordinaire, cible des boutons « Commencer le voyage ».
- Pages : `/`, `/lore`, `/lore/<article>`, `/lore/tags`, `/lore/tags/<tag>` (pas `/lore/<tag>` : collision avec les articles), `/a-propos`, `/confidentialite`, `/credits`, `/mentions-legales`, `/404`.
- **Aucune information personnelle de Deltouille** sur le site ni dans le dépôt (ni e-mail ni identité ; un test refuse toute adresse e-mail dans `dist/`). Contact : tickets du dépôt GitHub. **Nom du site** (`NOM`, aussi en dur dans la marque de `Navbar.astro`), adresses du dépôt et de l'hébergeur : `src/lib/projet.mjs`. Logiciels tiers crédités sur `/credits` : registre `src/lib/tiers.mjs` (une dépendance dont du code part dans `dist/` doit y figurer avec `distribue: true`).
- **Redirections figées** dans `src/lib/redirections.mjs` (lu par `astro.config.mjs` et par la validation, qui en dérive les noms d'articles réservés) : elles décrivent des URL ayant existé, **ne jamais les dériver du contenu**. Aucune URL publiée ne doit disparaître : `tests/donnees/urls-publiees.txt` liste celles qui doivent répondre ; renommer un article = ajouter sa redirection **et** son ancienne URL à cette liste.

## Pièges connus (refonte-astro.md §8)

- `Astro.slots.has('hero')` est vrai même pour un slot conditionnel vide → juger sur `await Astro.slots.render('hero')`.
- Le loader `file()` ne conserve pas l'ordre du YAML → trier explicitement (`localeCompare(…, 'fr')`).
- Commentaires `{/* */}` plutôt que `<!-- -->` (qui partent dans le HTML).
- Preflight Tailwind : remet à zéro la marge auto de `<dialog>` (`m-auto`) et les puces/marges des listes.
- Tailwind v4 n'applique `hover:` que sous `@media (hover: hover)` : en navigateur headless, tester les menus au **focus clavier**.
- `backdrop-filter` crée un bloc conteneur pour les descendants `fixed` ; passer l'en-tête de `sticky` à `fixed` provoque un saut de défilement → seul le panneau du menu mobile est `fixed`.
- `100vw` inclut la barre de défilement : rendre les bannières hors du `<main>`.
- Pas d'animation continue sur les grandes images de bannière (elles « tremblent ») ; tout au plus une parallaxe au défilement.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
