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
npm run check      # astro check (types stricts partout : src, scripts, tests, configs)
npm run lint       # ESLint (eslint.config.mjs) ; npx eslint . --fix pour les corrections automatiques
npm test           # Vitest (vitest run) ; un seul fichier : npx vitest run tests/site.test.ts
npm run verify     # check + lint + build + test : doit passer avant de clore une étape
npm run palette    # régénère src/styles/palette.css depuis scripts/palette.ts
npm run captures   # captures + vérifications interactives + audit axe-core (Brave headless) ; serveur de dev requis ; -- --filtre <scène>, -- --reference, -- --base <url> (contre astro preview : scènes /demo sautées)
npm run vercel     # régénère vercel.json (301, en-têtes) depuis src/lib/redirections.ts
npm run image -- <lien ou fichier> [<dossier>/]<nom>   # ajoute src/assets/images/[<dossier>/]<nom>.webp (WebP, 3840 px au plus) ; --remplacer
```

**Tout le code est en TypeScript** (D51) : `src/lib/*.ts`, `scripts/*.ts` (exécutés tels quels par Node ≥ 22.18, qui efface les types : syntaxe effaçable seulement, `erasableSyntaxOnly`), tests `tests/*.test.ts` sous **Vitest** (`vitest.config.ts`, via `getViteConfig` d'Astro), `astro.config.ts`. Imports relatifs avec l'extension `.ts` (exigée par Node pour les scripts). Seuls restent en `.ts` `eslint.config.mjs` et les scripts `is:inline` (JavaScript envoyé tel quel au navigateur). **ESLint** (D52) : zéro erreur et zéro avertissement ; une exception se justifie sur la ligne (`// eslint-disable-next-line <règle> -- raison`, `{/* … */}` dans un template Astro). `tests/site.test.ts`, `pages.test.ts` et `poids.test.ts` lisent `dist/` (build requis) ; `poids.test.ts` fixe les budgets (HTML, JS, CSS, images, image de partage) — un dépassement est une décision à consigner, pas un seuil à relever en silence. Chaque scène des captures est auditée par axe-core (WCAG 2.2 A/AA) : zéro violation. `npm run captures` (hors `verify`, il faut un navigateur) vérifie ce que `dist/` ne montre pas — barre sur bannière, menus au clavier, menu mobile, absence de défilement horizontal — et doit passer avant de clore une étape qui touche à l'interface. Nouveau comportement interactif → nouvelle scène dans `scripts/captures.ts` ; pour tester une animation, `mouvement: true` (sinon le mouvement réduit est émulé), et vérifier qu'une vérification sait échouer en sabotant le code ; pour suivre un lien, `navigation: '<sélecteur>'` (puis `window.__transition` dit si la page a été révélée par une View Transition) ; pour le clavier, utiliser `clavier` (vraies frappes : `{ touche, ctrl? }`, `{ texte }`, `{ attendre }`) : un `.focus()` par script ne déclenche pas `:focus-visible`. `tests/pages.test.ts` compare `dist/` aux sources lues par `tests/sources.ts`. **Aucun test ni capture ne vise un article précis** : utiliser `articleExemple()` (l'acte I du prologue, `mondstadt-act-i`, choisi comme contenu stable). Les pages d'outillage `/demo*` n'existent qu'en dev (intégration `outillageDeDev` dans `astro.config.ts`, qui sert aussi `dist/pagefind` en dev : lancer `npm run build` avant `npm run captures` pour que la recherche ait un index à jour). Astro 7 refuse un second serveur de dev pour le même projet : si Deltouille a déjà un `npm run dev` ouvert, ne pas l'arrêter ; passer par `astro preview --port 4330` et `npm run captures -- --base http://localhost:4330`. Les fonctions pures de `src/lib/` (validation du contenu, etc.) ont leurs tests unitaires, qui ne demandent pas de build.

## Choix techniques retenus (cf. refonte-astro.md §2, §10)

- **Aucune bibliothèque de composants Material** (`@material/web` est en maintenance, les composants Lit/Shadow DOM s'affichent après le JS). Le look M3 vient des **jetons de couleur et des rayons** dans `@theme`.
- **Composants `.astro` sans framework client** ; l'interactivité (menu, thème, recherche) tient dans de petits `<script>`.
- **Pagefind** pour la recherche (index statique au build, articles seulement), avec une interface maison sur son API JavaScript (`src/components/Recherche.astro`) ; **`@astrojs/sitemap`**.
- **Aucune webfont** : piles système uniquement (engagement écrit dans la page Confidentialité).
- Thème sombre porté par `data-theme` sur `<html>` (pas la media query), mémorisé dans `localStorage` (`genshin-theme`), appliqué par un script inline dans `<head>` (anti-flash). Variante : `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`.
- Composants plus petits que dans le prototype : extraire carte « À la une », tuile de rubrique, encadrés (spoilers, résumé, sources), sommaire.

### Système de design (decisions.md D6, D7 ; planche visible sur `/demo` en dev)

- **Couleurs** : `src/styles/palette.css` est **généré** par `scripts/palette.ts` (Material Color Utilities, Tonal Spot, source `#355f98`) — ne jamais l'éditer à la main : modifier le script puis `npm run palette`. Jetons français rattachés à des rôles M3 (`fond`, `surface`, `doux`, `tonal`/`sur-tonal`, `ligne`, `contour`, `texte`, `discret`, `primaire`/`sur-primaire`, `conteneur-primaire`, `or`…) ; ils basculent seuls avec le thème, `dark:` ne sert qu'aux couleurs fixes (`ciel`, `ciel-clair`, `nuit`, `ambre`). Survol : `primaire-survol`, `tonal-survol` (couche d'état M3). `ligne` est décoratif ; une bordure de contrôle interactif utilise `contour`.
- **Tailles de texte, rayons, ombres** : seules les échelles M3 existent (`text-corps-m`, `text-titre-g`, `rounded-carte`, `rounded-moyen`, `shadow-niveau-2`…) ; celles de Tailwind (`text-sm`, `rounded-lg`, `shadow-md`) sont supprimées. Pas de taille arbitraire `text-[…]`.
- **Points de rupture** : classes de fenêtre M3, mobile d'abord — `sm` 600, `md` 840, `lg` 1200, `xl` 1600 (pas de `2xl`).
- **Mouvement** : rien ne bouge sous `prefers-reduced-motion` ; toute animation automatique de plus de 5 s a un bouton pause (WCAG 2.2.2) ; un texte animé est `aria-hidden` avec un équivalent `sr-only`. Couleurs personnalisées (or, jade) : liste `PERSONNALISEES` de `scripts/palette.ts`.
- **Transitions entre pages** : View Transitions natives (CSS dans `global.css`, pas de `<ClientRouter />` : les scripts supposent un vrai chargement de page). Un `view-transition-name` doit être **unique par page** (sinon toute la transition saute ; testé). La bannière d'article porte `image-<id>` ; les cartes n'ont que `data-transition`, le nom leur est donné au clic par le script en ligne du `<head>` de `Site.astro`.
- **Lecture d'un article** : barre de progression (`ProgressionLecture.astro`, mesure `[data-lecture]`) et sommaire suivi (`aria-current="true"` posé par le script de `Sommaire.astro`). Les classes `scale-*` de Tailwind v4 utilisent la propriété `scale`, pas `transform` : ne pas mélanger les deux. `scroll-padding-top` garde les ancres hors de la barre fixe.
- **États** : survol = couche d'état M3 via l'opacité (`hover:bg-texte/8`) ; élément actif = `bg-tonal text-sur-tonal`. Variante `sur-image:` = barre transparente posée sur une bannière (`data-sur-image`, géré par `Navbar.astro`). Les couleurs Tailwind par défaut sont supprimées (restent `white`/`black` pour le verre sur image).
- **Icônes** : Material Symbols arrondies, déclarées dans `src/lib/icones.ts` (nom français → fichier du paquet `@material-symbols/svg-400`), rendues par `<Icon nom="…" />` ; le tracé est inséré au build. Le logo est `<Marque />`.
- **Pas de petit texte au-dessus des titres** (sur-titre, D35) ; l'utilitaire `sur-titre` ne sert qu'aux titres de bloc (sommaire, encadré résumé, menu mobile).
- Écrire les classes Tailwind en entier : `` `text-${taille}` `` n'est pas détecté.
- La machine de dev n'a aucune police serif : les titres y apparaissent sans empattement sur les captures, c'est attendu.

## Modèle de contenu : tout en tags

- **Un article = un fichier**, rangé **où l'on veut** sous `src/content/articles/` (sous-dossiers libres). URL `/lore/<nom-du-fichier>` : l'identifiant vient du **nom du fichier seul** (`src/lib/identifiant.ts` : minuscules, sans accents, tirets), jamais du dossier ni des tags. Déplacer un fichier ne change pas son URL ; deux fichiers de même nom font échouer le build. (En dev, un déplacement faisait disparaître l'article : contourné dans `outillageDeDev`, D25.) **Renommer** un fichier change l'URL : ajouter sa redirection dans `ARTICLES_RENOMMES` (`src/lib/redirections.ts`) puis `npm run vercel`. **Supprimer** un article ou un tag publié : l'ajouter à `ARTICLES_SUPPRIMES` (avec la page la plus proche) ou `TAGS_SUPPRIMES` ; les chaînes de redirections sont résolues automatiquement.
- **Rédiger un article à partir d'une source** : suivre `documentation/rediger-un-article.md` (fiche autonome, donnée par lien aux agents ; `tests/documentation.test.ts` la garde alignée sur le schéma, les noms réservés et les rubriques : la mettre à jour avec eux).
- Frontmatter : `titre`, `description`, `image` (nom de fichier, sans dossier ni extension, d'un `.webp` rangé **où l'on veut** sous `src/assets/images/`, ajouté par `npm run image` ; comme pour les articles, deux images de même nom font échouer le build, D47), `publieLe`, `tags`. Facultatifs : `imageAlt`, `modifieLe`, `brouillon`, `quete` (épisode d'une suite : `serie` = un de ses tags, `chapitre` — 0 = prologue —, `acte`, décimal pour un intercalé ; place unique dans la série), `aLaUne` (carte « À la une » : le plus récent des articles marqués, sinon le plus récent), les encadrés `resume`, `spoilers`, `sources` (repères dans le jeu), et `credits` (contenus repris : `type: wiki` avec `titre`, `url`, `modifications` obligatoires ; `type: communaute` avec `auteur`, `plateforme`, `url`, `titre?` — règles dans `src/lib/credits.ts`). Encadrés affichés seulement s'ils sont remplis. **Images dans le corps** : `![description](<nom>)`, même nom que pour `image` (plugins Sätteri de `src/lib/images-markdown.ts`, branchés dans `astro.config.ts` ; description obligatoire, D48).
- **Licences** (`LICENCES.md`) : le **code** est sous GPL-3.0-or-later (`LICENSE`) ; toute nouvelle dépendance doit être compatible GPL v3 (`tests/licences.test.ts`, expressions analysées par `tests/spdx.ts` ; échoue sinon : examiner avant d'élargir la liste). Tous les textes du site sont sous CC BY-SA 3.0 (`<link rel="license">` dans `Site.astro`, page `/credits`) ; les éléments de HoYoverse en sont exclus. Un article adapté d'une page du wiki doit déclarer son crédit `wiki` (le build vérifie lien et modifications).
- **Registre unique `src/content/tags.yaml`** (loader `file()`) : libellé + description par tag, de deux sortes (D53). Les **rubriques** (`rubrique: true`) disent le *genre* d'article (Quêtes, Personnages, Théories, Bandes-annonces) : **exactement une par article**, avec `singulier` et `icone` ; elles alimentent le menu, les filtres de `/lore`, et donnent le badge, le fil d'Ariane et le filtre Pagefind (`rubrique`). Les **sujets** disent de quoi parle l'article, autant que nécessaire, chacun avec une `famille` (`src/lib/familles.ts` : lieu, série, groupe, notion, sélection) qui le range sur `/lore/tags` (« Rubriques et sujets »). Dans l'interface, on dit « rubrique » et « sujet », jamais « thème » (réservé au clair/sombre) ni « tag ». Les URL restent `/lore/tags/<id>`.
- Garde-fous (`src/lib/validation.ts`, fonction pure, sur **tous** les articles, brouillons compris) : tag non déclaré, article sans rubrique ou avec deux rubriques, nom de fichier réservé (`tags`, anciennes catégories), image absente, `modifieLe` < `publieLe`, rubrique sans `singulier`/`icone` ou avec une famille, sujet sans famille, crédit invalide → le build échoue en nommant le fichier. Nouvelle règle de contenu → l'ajouter là, avec son test.
- Les pages obtiennent le contenu par `bibliotheque()` (`src/lib/contenu.ts`), jamais par `getCollection` directement : c'est ce qui garantit la validation et l'exclusion des brouillons. La logique (tri, articles liés, rubrique et sujets d'un article, temps de lecture, dates) est dans `src/lib/bibliotheque.ts`, testée sans build.
- Brouillons visibles en dev, exclus du build. Listes triées par date décroissante, sauf les pages de tag : épisodes de quête d'abord, dans l'ordre de l'histoire (`ordreDeLecture`), et liens « Épisode précédent / suivant » en fin d'épisode (`episodesVoisins`, `EpisodesVoisins.astro`). « Pour aller plus loin » = les 3 articles partageant le plus de tags.
- **URL sans barre finale** (`trailingSlash: 'never'`) : liens, canoniques et sitemap ont la même forme. `<Image>` reçoit `width` = la plus grande valeur de `widths` (sinon son `src` de repli est l'original ré-encodé).
- **Cartes et listes cliquables** : un seul lien par carte (le titre, étendu par `after:absolute after:inset-0`), contour de focus porté par la carte (`has-[a:focus-visible]:outline-3 …`). Composants de page dans `src/components/` (bannière, en-têtes, fil d'Ariane, puces, encadrés, sommaire).
- **L'accueil ne dépend d'aucun article précis** (D28) : ne jamais y viser un identifiant en dur ; le site doit se construire même sans article.
- `premiers-pas` est un tag ordinaire, cible des boutons « Commencer le voyage ».
- Pages : `/`, `/lore`, `/lore/<article>`, `/lore/tags`, `/lore/tags/<tag>` (pas `/lore/<tag>` : collision avec les articles), `/a-propos`, `/confidentialite`, `/credits`, `/mentions-legales`, `/404`, `/rss.xml`.
- **Référencement** (D50) : données structurées dans `src/lib/referencement.ts` (`BlogPosting` via la prop `article` de `Site.astro`, `BreadcrumbList` émis par `FilAriane.astro`, `WebSite` sur l'accueil ; auteur = le site, jamais une personne) ; `lastmod` des articles seulement dans le sitemap (`serialize` de `astro.config.ts`) ; flux `/rss.xml`.
- **Confidentialité** : la page décrit ce que traite l'hébergeur (adresse IP…) d'après les documents de Vercel pour l'offre utilisée (`HEBERGEUR.offre` : Hobby, sans contrat de sous-traitance ; on écrit ce que Vercel déclare et on dit non précisé ce qui ne l'est pas — jamais de rôle déduit ; journaux 1 heure), les traitements de l'éditeur avec leur base juridique, les transferts et le contact privé (Proton, messages supprimés une fois la demande traitée). Changer d'offre ou d'hébergeur, ou activer un service d'analyse, impose de la revoir. Ne jamais promettre « aucune donnée personnelle ».
- **Aucune information personnelle de Deltouille** sur le site ni dans le dépôt (ni e-mail personnel ni identité ; un test refuse dans `dist/` toute adresse e-mail autre que l'alias `CONTACT_PRIVE`). Contact : tickets du dépôt GitHub (public) et alias Proton Pass `CONTACT_PRIVE` (privé, D32). **Nom du site** (`NOM`, aussi en dur dans la marque de `Navbar.astro`), adresses du dépôt et de l'hébergeur : `src/lib/projet.ts`. Logiciels tiers crédités sur `/credits`, texte complet de leur licence publié sur `/licences/<slug>.txt` (lu au build dans le paquet) : registre `src/lib/tiers.ts` (une dépendance dont du code part dans `dist/` doit y figurer avec `distribue: true`).
- **Redirections figées** dans `src/lib/redirections.ts` (lu par `astro.config.ts` et par la validation, qui en dérive les noms d'articles réservés) : elles décrivent des URL ayant existé, **ne jamais les dériver du contenu**. Aucune URL publiée ne doit disparaître : `tests/donnees/urls-publiees.txt` liste celles qui doivent répondre ; renommer un article = ajouter sa redirection **et** son ancienne URL à cette liste.

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
