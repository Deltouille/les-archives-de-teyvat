# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Le projet

Blog statique « L'Histoire de Genshin » : raconter le lore de Genshin Impact à la communauté française. Astro (sortie statique) + Tailwind CSS v4 (via `@tailwindcss/vite`, pas d'intégration `@astrojs/tailwind`), look Material 3. Tout le contenu, l'interface **et le code** (noms de variables, composants, champs de frontmatter, jetons de couleur) sont en français.

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
```

Pas de linter. `tests/site.test.mjs` lit `dist/` (build requis). Les fonctions pures de `src/lib/` (validation du contenu, etc.) ont leurs tests unitaires, qui ne demandent pas de build.

## Choix techniques retenus (cf. refonte-astro.md §2, §10)

- **Aucune bibliothèque de composants Material** (`@material/web` est en maintenance, les composants Lit/Shadow DOM s'affichent après le JS). Le look M3 vient des **jetons de couleur et des rayons** dans `@theme`.
- **Composants `.astro` sans framework client** ; l'interactivité (menu, thème, machine à écrire, recherche) tient dans de petits `<script>`.
- **Pagefind** pour la recherche (index statique au build), **`@astrojs/sitemap`**.
- **Aucune webfont** : piles système uniquement (engagement écrit dans la page Confidentialité).
- Thème sombre porté par `data-theme` sur `<html>` (pas la media query), mémorisé dans `localStorage` (`genshin-theme`), appliqué par un script inline dans `<head>` (anti-flash). Variante : `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`.
- Composants plus petits que dans le prototype : extraire carte « À la une », tuile de thème, encadrés (spoilers, résumé, sources), sommaire.

### Système de design (decisions.md D6, D7 ; planche visible sur `/demo` en dev)

- **Couleurs** : `src/styles/palette.css` est **généré** par `scripts/palette.mjs` (Material Color Utilities, Tonal Spot, source `#355f98`) — ne jamais l'éditer à la main : modifier le script puis `npm run palette`. Jetons français rattachés à des rôles M3 (`fond`, `surface`, `doux`, `tonal`/`sur-tonal`, `ligne`, `contour`, `texte`, `discret`, `primaire`/`sur-primaire`, `conteneur-primaire`, `or`…) ; ils basculent seuls avec le thème, `dark:` ne sert qu'aux couleurs fixes (`ciel`, `ciel-clair`, `nuit`, `ambre`). Survol : `primaire-survol`, `tonal-survol` (couche d'état M3). `ligne` est décoratif ; une bordure de contrôle interactif utilise `contour`.
- **Tailles de texte, rayons, ombres** : seules les échelles M3 existent (`text-corps-m`, `text-titre-g`, `rounded-carte`, `rounded-moyen`, `shadow-niveau-2`…) ; celles de Tailwind (`text-sm`, `rounded-lg`, `shadow-md`) sont supprimées. Pas de taille arbitraire `text-[…]`.
- **Points de rupture** : classes de fenêtre M3, mobile d'abord — `sm` 600, `md` 840, `lg` 1200, `xl` 1600 (pas de `2xl`).
- Écrire les classes Tailwind en entier : `` `text-${taille}` `` n'est pas détecté.
- La machine de dev n'a aucune police serif : les titres y apparaissent sans empattement sur les captures, c'est attendu.

## Modèle de contenu : tout en tags

- **Un article = un fichier** dans `src/content/articles/` ; URL `/lore/<nom-du-fichier>`, indépendante des tags. Renommer un fichier impose une redirection dans `astro.config.mjs`.
- Frontmatter : `titre`, `description`, `image` (nom d'un `.webp` de `src/assets/images/`), `publieLe`, `tags`. Facultatifs : `imageAlt`, `modifieLe`, `brouillon`, et les encadrés `resume`, `spoilers`, `sources` (affichés seulement s'ils sont remplis).
- **Registre unique `src/content/tags.yaml`** (loader `file()`) : libellé + description par tag. Les tags `theme: true` remplacent les catégories : ils ont `singulier` et `icone`, alimentent le menu, et le **premier tag-thème** d'un article donne son badge, son fil d'Ariane et le filtre Pagefind.
- Garde-fous (fonction pure, sur **tous** les articles, brouillons compris) : tag non déclaré, article sans thème, nom de fichier réservé (`tags`, anciennes catégories) → le build échoue en nommant le fichier.
- Brouillons visibles en dev, exclus du build. Listes triées par date décroissante. « Pour aller plus loin » = les 3 articles partageant le plus de tags.
- `premiers-pas` est un tag ordinaire, cible des boutons « Commencer le voyage ».
- Pages : `/`, `/lore`, `/lore/<article>`, `/lore/tags`, `/lore/tags/<tag>` (pas `/lore/<tag>` : collision avec les articles), `/a-propos`, `/confidentialite`, `/404`.
- **Redirections figées** dans `astro.config.mjs` (cf. `old/astro.config.mjs`) : elles décrivent des URL ayant existé, **ne jamais les dériver du contenu**. Aucune URL publiée ne doit disparaître.

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
