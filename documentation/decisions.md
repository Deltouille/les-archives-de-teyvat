# Journal des décisions

> Une entrée par décision, la plus récente en bas. Format : contexte, choix,
> alternatives écartées. Les décisions héritées du prototype sont dans
> `old/documentation/refonte-astro.md` ; on ne les recopie pas, on note ici
> seulement ce qui s'en écarte ou ce qui est nouveau.

## D1 — Réécrire plutôt que poursuivre le prototype (13 oct. 2026)

- **Contexte** : le prototype `old/` a tranché la pile et le modèle de contenu, mais il n'était pas versionné, était pensé bureau d'abord, et contenait beaucoup de tailles arbitraires et de gros fichiers de page.
- **Choix** : nouveau projet Astro, versionné dès le départ, qui reprend le *comportement* de `old/` étape par étape (cf. `plan-implementation.md`). `old/` reste une référence locale, non versionnée.
- **Écarté** : nettoyer le prototype sur place (on aurait gardé les points de rupture `max-*` et les tailles au pixel près).

## D2 — Documenter et tester à chaque étape (13 oct. 2026)

- **Contexte** : demande explicite de Deltouille.
- **Choix** : chaque étape du plan se termine par `npm run verify` vert, des tests écrits pour ce qu'elle apporte, et une entrée dans ce journal. Quatre niveaux de test : unitaire, build, surface d'URL (comparée à `old/dist/`), visuel (captures Brave headless).

## D3 — Hébergement sur Vercel (13 oct. 2026)

- **Contexte** : il faut une URL de production pour les canoniques, l'Open Graph et le sitemap.
- **Choix** : Vercel, comme le prototype : `https://l-histoire-de-genshin-expliquee.vercel.app`, surchargeable par la variable `SITE_URL` (`astro.config.mjs`). Le site reste 100 % statique, donc déplaçable sans changement de code.

## D4 — Palette M3 générée plutôt que copiée (13 oct. 2026)

- **Contexte** : le prototype définissait ses couleurs à la main (palette « Primogemme », CDC §3), proche de M3 mais sans ses rôles ni ses tons.
- **Choix** : générer la palette tonale Material 3 à partir d'une couleur source (Material Color Utilities), clair et sombre, puis l'exposer sous les jetons français. Mise en œuvre à l'étape 1.
- **Écarté pour l'instant** : reprendre les valeurs du prototype telles quelles. Choix explicitement réversible (« au pire on pourra changer ») : les noms de jetons ne changent pas, seules leurs valeurs.

## D5 — Outillage de l'étape 0 (13 oct. 2026)

- **Choix** :
  - `build` = `astro build && pagefind --site dist` : l'index de recherche fait partie du build, les tests le vérifient.
  - `verify` = `check` + `build` + `test`, à faire passer avant chaque commit.
  - Tests en `node --test` natif, sans framework de test : suffisant pour des fonctions pures et la lecture de `dist/`, et zéro dépendance.
  - `old/` exclu de `tsconfig.json` (sinon `astro check` analyserait le prototype) et ignoré par git.
  - TypeScript 6 installé (dernière version) : `astro check` fonctionne avec, 0 erreur. À rétrograder en 5.x si `@astrojs/check` pose problème.
  - Barre d'outils de dev Astro désactivée, comme dans le prototype.

## D6 — Génération de la palette (13 oct. 2026)

- **Contexte** : mise en œuvre de D4.
- **Choix** :
  - `scripts/palette.mjs` calcule la palette avec **Material Color Utilities**, schéma **Tonal Spot** (le schéma M3 par défaut), couleur source `#355f98`. Le `primary` obtenu (`#3e5f90`) reste très proche du prototype.
  - Le résultat est **écrit dans `src/styles/palette.css`, versionné** (`npm run palette`). Pas de génération à chaque build : le CSS reste lisible dans le dépôt et le build n'a pas de dépendance de plus. `tests/palette.test.mjs` échoue si le fichier n'est plus synchrone avec le script.
  - Les jetons gardent les **noms français du prototype**, rattachés à des rôles M3 : `fond` = surface, `surface` = surfaceContainerLow (cartes), `doux` = surfaceContainerHigh, `tonal` / `sur-tonal` = secondaryContainer, `ligne` = outlineVariant, `contour` = outline, `texte` = onSurface, `discret` = onSurfaceVariant, `primaire` / `sur-primaire`, `conteneur-primaire` / `sur-conteneur-primaire`. Nouveaux par rapport au prototype : `contour`, `sur-tonal`, les conteneurs.
  - Conséquence assumée de M3 : les cartes ne sont plus blanches sur fond gris (prototype), mais un ton de surface à peine plus soutenu que le fond ; en sombre elles sont plus claires que le fond.
  - **Or** (encadré spoilers, ambre) : couleur personnalisée `#986f33`, déclinée en rôles M3 (`or`, `sur-or`, `conteneur-or`, `sur-conteneur-or`) par tons de sa palette tonale, **sans harmonisation** : `Blend.harmonize` la faisait tourner vers l'orangé (`#845326`), on perdait le doré.
  - Couleurs fixes sur image : `ciel` = primaryFixedDim, `ciel-clair` = primaryFixed, `nuit` = onPrimaryFixed, `ambre` = ton 80 de l'or.
  - **Survol** = couche d'état M3 (8 % de la couleur « sur » mélangée, `color-mix`) : `primaire-survol`, `tonal-survol`. Plus de couleur de survol choisie à la main.
  - Sans JavaScript (`data-theme` absent), le thème suit `prefers-color-scheme`.
- **Tests** : synchronisation du fichier ; contraste WCAG AA (4,5) de toutes les paires texte/fond dans les deux thèmes, et 3 pour `contour`. `ligne` (outlineVariant, contraste 1,6) est **décoratif** : il ne doit jamais délimiter seul un contrôle interactif, c'est le rôle de `contour`.
- **Version épinglée** : `@material/material-color-utilities@0.3.0`. La 0.4.0 publie des imports ESM sans extension (`color_spec_2025.js`, `scheme_*.js`) et plante sous Node. À réessayer à la prochaine version.

## D7 — Système de design (13 oct. 2026)

- **Typographie** : échelle M3 complète en jetons français (`text-affichage-g/m/p`, `text-grand-titre-…`, `text-titre-…`, `text-corps-…`, `text-etiquette-…`). L'échelle Tailwind par défaut est **supprimée** (`--text-*: initial`) : impossible d'écrire `text-sm` ou d'inventer une taille par habitude ; `text-[11px]` reste techniquement possible mais proscrit.
  - Titres `h1`/`h2` en serif (choix éditorial du prototype), tailles prises dans l'échelle M3 et responsives. Corps de page en `corps-g` (16 px) ; la prose garde un interlignage de 1,8 (longues lectures) au lieu du 1,5 de M3.
  - Pile serif élargie aux polices de Linux et Android (`Noto Serif`, `DejaVu Serif`, `Liberation Serif`) : sur une machine sans aucune serif (c'est le cas de la machine de dev, où fontconfig renvoie Cantarell), les titres s'affichent sans empattement. Ce n'est pas un bug du site ; en tenir compte en lisant les captures.
- **Formes** : échelle M3 (`rounded-tres-petit` 4 px → `rounded-tres-grand` 28 px, `rounded-carte` = 28 px contre 26 px dans le prototype). L'échelle Tailwind est supprimée elle aussi.
- **Élévation** : ombres M3 niveaux 1 à 3 (`shadow-niveau-n`). Invisibles en sombre, comme dans M3 : la hiérarchie y passe par les tons de surface.
- **Mouvement** : courbes M3 (`ease-standard`, `ease-emphase-entree`, `ease-emphase-sortie`).
- **Points de rupture** : les **classes de fenêtre M3** (600 / 840 / 1200 / 1600 px), en mobile d'abord. *Écart au plan*, qui prévoyait ceux de Tailwind par défaut (640 / 768 / 1024 / 1280 / 1536) : quitte à suivre Material 3, autant suivre ses classes de fenêtre ; `2xl` n'existe plus.
- **Espacement** : celui de Tailwind (multiples de 4 px), qui est déjà la grille de 4 dp de M3. Pas d'échelle maison.
- **Utilitaires maison** repris du prototype, réécrits avec les jetons : `sur-titre`, `pastille`, `fleche-ronde` (bouton icône tonal M3 de 40 px), `lien-texte`.
- **Planche `/demo`** : servie par `astro dev` seulement, via une petite intégration dans `astro.config.mjs` (`injectRoute` si `command === 'dev'`). Un test vérifie qu'elle n'est pas dans `dist/`. Elle importe le générateur pour lister les jetons : un jeton ajouté apparaît sans toucher la page.
  - Piège : Tailwind ne détecte pas les classes construites (`` `text-${taille}` ``) ; écrire les noms de classe en entier.
- **Vérifié** : captures de `/demo` en 1440 px clair et sombre et en 390 px ; défaut trouvé et corrigé (marge haute du premier titre de la prose).

## D8 — Mise en page et navigation (13 oct. 2026)

- **Registre des tags avancé à l'étape 2** : le menu « Le lore » liste les thèmes de `tags.yaml`. La collection `tags` et `registreDesTags()` arrivent donc dès maintenant ; la collection `articles` reste à l'étape 3.
- **Icônes Material Symbols** (arrondies, graisse 400, paquet `@material-symbols/svg-400`, Apache 2.0) au lieu des tracés dessinés à la main du prototype : cohérence M3. Les SVG sont lus **au build** (`?raw`) et leur tracé est inséré dans le HTML : ni webfont ni requête. Registre unique `src/lib/icones.ts` (nom français → nom Material) ; le schéma de `tags.yaml` n'accepte que ces noms (`z.enum`), une icône inconnue fait échouer le build. Les noms d'icônes de `tags.yaml` passent en français (`livre`, `boussole`…). Le **logo** (étoile à quatre branches) reste celui du prototype : c'est l'emblème du site, pas une icône. `expand_more` n'existe plus dans le paquet : chevron = `chevron_right` tourné.
- **Couleurs Tailwind supprimées** (`--color-*: initial` dans la palette générée) : seuls nos jetons existent, plus `white` et `black` pour le verre et les voiles sur image.
- **Couches d'état M3** écrites avec l'opacité Tailwind : `hover:bg-texte/8` (8 % de la couleur du texte), au lieu de couleurs de survol choisies à la main. Indicateur actif = conteneur secondaire (`bg-tonal text-sur-tonal`), comme les barres de navigation M3. Pas de changement de graisse sur le lien actif (pas de saut de mise en page).
- **Barre** : 64 px (barre d'application M3), largeur `max-w-site` (92,5 rem, celle du prototype). Bouton icône M3 standard (40 px, sans conteneur) ; verre dépoli seulement sur la bannière.
- **Bouton de thème** : libellé fixe « Thème sombre » + `aria-pressed`. *Écart au prototype*, qui changeait aussi le libellé : un lecteur d'écran annonçait alors deux états contradictoires (« Activer le thème clair, enfoncé »).
- **Menu mobile** : bascule d'icône M3 (`menu` ↔ `fermer`) au lieu des trois traits animés ; éléments de tiroir M3 (56 px). Carte « Un nouveau voyage ? » en `conteneur-primaire`.
- **Pas de bouton de recherche** tant que la recherche n'existe pas (étape 6) : pas de bouton mort.
- **Accueil provisoire** sur le layout ; banc d'essai `/demo/navigation` (dev uniquement) avec une fausse bannière en dégradé, la vraie arrivant à l'étape 4.
- Piège TypeScript 6 : `HTMLElement.hidden` est typé `boolean | "until-found"`.

## D9 — Captures et vérifications interactives (13 oct. 2026)

- **Choix** : `scripts/captures.mjs` (`npm run captures`, serveur de dev lancé) pilote Brave headless par le protocole DevTools, **sans dépendance** (WebSocket natif de Node). Chaque scène = une page, des actions, une capture (pleine page ou fenêtre) et des **vérifications** évaluées dans la page, qui font échouer le script.
  - Vérifié aujourd'hui : barre `fixed` et transparente sur bannière puis opaque après défilement ; menu « Le lore » ouvert au **focus clavier** ; menu mobile qui couvre l'écran, bloque le défilement, rend la barre opaque ; fermeture par Échap sans saut de défilement, focus rendu au bouton ; bascule du thème mémorisée, `aria-pressed` à jour ; **aucun défilement horizontal** sur toutes les captures.
  - 1440 / 1024 / 390 px × clair / sombre ; thème choisi par `prefers-color-scheme` émulé (ce qui teste aussi le script anti-flash) ; **mouvement réduit** émulé pour ne jamais capturer au milieu d'une transition.
  - Comparaison avec `captures/reference/` (`--reference` pour la mettre à jour) : octets identiques ou non, et écart de hauteur. Pas de diff pixel pour l'instant (il faudrait décoder les PNG) ; à ajouter si les comparaisons deviennent pénibles. `captures/` n'est pas versionné.
  - Vite peut recharger la page au premier passage en dev : le script rejoue alors la scène.
- **Hors de `npm test`** : il faut un navigateur et un serveur. À lancer avant de clore toute étape qui touche à l'interface.
- **Garde-fou vérifié** : sans le blocage du défilement sur `<body>`, la scène `menu-mobile-ouvert` échoue.
- **Écarté** : Playwright ou Puppeteer (centaines de Mo de dépendances pour ce besoin).
