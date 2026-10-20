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

## D10 — Modèle de contenu (13 oct. 2026)

- **Repris du prototype** (CDC §6) : un article = un fichier, URL `/lore/<nom-du-fichier>`, catégories devenues des tags `theme: true` du registre `tags.yaml`, thème principal = premier tag-thème, « Pour aller plus loin » = le plus de tags communs, listes du plus récent au plus ancien, brouillons visibles en dev et absents du build.
- **Logique pure séparée d'Astro** : `src/lib/validation.mjs` (garde-fous) et `src/lib/bibliotheque.mjs` (tri, brouillons, articles liés, thème principal, temps de lecture, dates) se testent avec `node --test`, sans build ; `src/lib/contenu.ts` ne fait que les appliquer aux collections (`bibliotheque()`).
- **Images à plat** : `src/assets/images/<nom>.webp`, le frontmatter donne `<nom>`. Le prototype rangeait `lore/teyvat/mondstadt/mondstadt.webp` et cherchait par suffixe, ce qui laissait passer deux images de même nom. Noms en kebab-case : `Teyvat_Planet` → `teyvat`, `genshin_wallpaper` → `fond-d-ecran` (seuls changements apportés aux 6 articles).
  - **Écarté** : le helper `image()` des collections Astro (chemin relatif dans le frontmatter, validé par Astro) : plus lourd à écrire pour l'auteur (`../../assets/images/mondstadt.webp`) pour un gain nul, la validation couvrant déjà le cas.
- **Garde-fous** (le build échoue en nommant le fichier), sur tous les articles, brouillons compris :
  - repris : tag non déclaré, article sans thème, nom réservé (`tags` et les anciennes catégories redirigées) ;
  - **nouveaux** : image absente (le prototype levait une erreur sans nommer l'article), `modifieLe` antérieur à `publieLe`, thème sans `singulier` ou sans `icone` (sinon un badge ou une icône vide) ; icône hors du registre `src/lib/icones.ts` (schéma Zod).
- **Accueil provisoire** : il liste les articles (thème, titre, date), ce qui fait passer la validation à chaque build en attendant les vraies pages (étape 4).
- **Vérifié en cassant** sur un vrai build : tag `mondstad` → « Tag inconnu « mondstad » dans src/content/articles/venti.md : déclarez-le dans src/content/tags.yaml » ; image `mondstad` → « Image inconnue « mondstad » dans src/content/articles/venti.md : ajoutez src/assets/images/mondstad.webp » ; `brouillon: true` sur Venti → absent de `dist/`, et le test du contenu publié passe toujours (il lit les brouillons dans les fichiers).

## D11 — Pages de lecture (13 oct. 2026)

- **Pages** : `/lore` (bibliothèque + puces de thème), `/lore/<article>`, `/lore/tags` (thèmes en cartes, puis tous les tags avec description et nombre de lectures), `/lore/tags/<tag>` (un thème garde son emblème et les puces de thème, un tag simple s'affiche `#Libellé`), `/a-propos`, `/confidentialite`, `/404`. Comportements repris du prototype (CDC §5, §7).
- **Composants extraits** (le prototype gardait tout en ligne dans la page d'article) : `Banniere`, `EnTetePage`, `EnTeteSection`, `FilAriane`, `Puces`, `CarteArticle`, `GrilleArticles`, `EncadreSpoilers`, `EncadreResume`, `EncadreSources`, `Sommaire` (repliable en mobile, collant en colonne latérale), `TagsArticle`.
- **Carte d'article : un seul lien.** Le prototype en avait trois (image, titre, « Découvrir ») : un lecteur d'écran entendait trois fois chaque article. Le lien du titre est étendu à toute la carte (`::after`) ; « Découvrir » reste un repère visuel (`aria-hidden`). Le contour de focus est porté par la carte (`has-[a:focus-visible]:outline-3`). Pas de soulèvement au survol (M3 n'en fait pas) : ombre de niveau 2 et léger zoom de l'image.
- **Niveaux de titres** : les cartes ont un `h2` dans une liste (bibliothèque, pages de tag) et un `h3` sous un titre de section (« Pour aller plus loin »). Les encadrés « L'essentiel » et « Sources » ont leur `h2`.
- **Encadré spoilers en `conteneur-or`** (le prototype : bordure or sur fond doux), icône « œil ». Résumé en `tonal`, sources en `doux`.
- **Fil d'Ariane** : liste ordonnée, page courante signalée par `aria-current` ; le titre de l'article y figure à partir de 600 px.
- **Puces de filtre M3** : liens, la puce active est cochée (`coche`) et porte `aria-current="page"`.
- **Voile de bannière** en `@utility voile-banniere`, teinte `nuit` de la palette au lieu de valeurs hexadécimales.
- **Pagefind** préparé : `data-pagefind-body` sur l'article, titre et description en `data-pagefind-meta`, filtre `theme` (sans accent, il finit dans des URL). Encadré spoilers, fil d'Ariane, sommaire et lectures liées hors index.
- **Questions ouvertes tranchées par défaut** (réversibles) : pas de parallaxe, la bannière reste fixe ; la ligne fil d'Ariane / thème reste alignée sur la colonne de lecture.
- **« À propos »** : la mention de « Shirone », sans rapport avec le site, est remplacée par Material 3 et Mizuki (la vraie inspiration, CDC §1), et Material Symbols est crédité. « Confidentialité » précise que les icônes sont servies par le site.
- **Tests** (`tests/pages.test.mjs`, contenu attendu lu dans les sources par `tests/sources.mjs`) : chaque lien interne et chaque ancre a une cible ; chaque article a sa page, une bannière, un seul `h1`, un corps indexable ; encadrés présents selon le frontmatter, sommaire selon les `##` ; tags de l'article et au plus 3 lectures liées ; chaque tag du registre a sa page avec exactement ses lectures ; une carte = un lien ; 404 en `noindex` et hors sitemap.
- **Vérifié à la main** : sans `resume`, `spoilers` ni `sources`, les trois encadrés disparaissent et l'entrée « Sources dans le jeu » quitte le sommaire.
- **Captures** : 74 captures (bibliothèque, article, index des tags, tag thème et simple, À propos, 404) ; nouvelles vérifications : barre transparente sur la bannière d'article, contour de focus sur une carte.
  - Piège découvert : un `.focus()` par script, même avec `focusVisible: true`, ne déclenche pas `:focus-visible` dans Brave headless. Les scènes peuvent maintenant envoyer de **vraies frappes de Tab** (`tabulations`, via `Input.dispatchKeyEvent`). Vérification vue en échec en retirant le contour de la carte.

## D12 — Page d'accueil (13 oct. 2026)

- **Structure reprise du prototype** (CDC §5) : bannière plein écran plafonnée (`clamp(37.5rem, 100svh, 68.75rem)`), sur-titre, titre, machine à écrire, boutons « Commencer le voyage » (→ `premiers-pas`) et « Explorer le lore », trois chiffres ; puis « À la une » (Mondstadt + « Un peu perdu dans le lore ? »), « Une envie d'explorer ? » (4 thèmes), « Des histoires à découvrir », bandeau vers les tags. Chaque bloc est un composant (`HeroAccueil`, `CarteALaUne`, `CartePremiersPas`, `TuileTheme`, `BandeauTags`).
- **Accessibilité du mouvement (WCAG 2.2.2)** — *écarts au prototype* :
  - la machine à écrire a un **bouton pause** (libellé fixe « Pause de l'animation » + `aria-pressed`), révélé seulement quand l'animation tourne ; le curseur ne clignote que pendant l'animation ;
  - les lecteurs d'écran lisent une **phrase complète** (`sr-only` : « les sept Archontes, le Cataclysme, … et les pas du Voyageur ») ; le texte animé est `aria-hidden` ;
  - **question ouverte tranchée** : la flèche « aller au contenu » ne flotte plus (animation infinie pour un simple repère) ; le curseur clignotant est gardé, mais lié à l'animation.
  - Inchangé : premier sujet écrit en dur dans le HTML, rien ne bouge sous `prefers-reduced-motion`.
- **Teintes des tuiles de thème tirées de la palette** (le prototype : six hexadécimaux et leurs variantes `dark:` écrits à la main) : `conteneur-primaire` (Quêtes), `conteneur-tertiaire` (Concepts), `conteneur-or` (Personnages), `conteneur-jade` (Régions).
  - Palette : ajout du rôle **tertiaire** (le violet que Tonal Spot dérive de la source) et d'une couleur personnalisée **jade** `#507c69`. Les couleurs personnalisées sont désormais une liste (`PERSONNALISEES` dans `scripts/palette.mjs`), chacune déclinée en quatre rôles et ajoutée d'office aux tests de contraste.
- **Lectures récentes limitées à 6**, avec un lien « Les N lectures » vers la bibliothèque dès qu'il y en a plus : l'accueil ne grossit pas avec le contenu. (Le prototype affichait tout.)
- **Choix éditoriaux nommés dans la page** (`A_LA_UNE`, `entrees`) ; un article ou un tag inconnu fait échouer le build avec un message clair (`tag()` lève désormais au lieu de renvoyer `undefined`).
- **Tests** : titre unique, premier sujet en dur, phrase complète pour les lecteurs d'écran, bouton pause caché dans le HTML ; chiffres = contenu ; à la une, entrées par thème, nombre de lectures récentes. Le test « barre opaque sans bannière » porte désormais sur `/lore`.
- **Captures** : option `mouvement: true` (pas d'émulation du mouvement réduit). Scène animée : le texte change, la pause le fige, `aria-pressed` suit, le curseur s'arrête ; scène en mouvement réduit : texte fixe, pas de bouton, pas de clignotement.
  - Leçon : la première version de la vérification de pause **passait même sabotée**, parce qu'elle cliquait pendant l'attente de 2,6 s entre deux sujets, où le texte est immobile de toute façon. Elle attend maintenant que le texte soit en train de s'écrire ; vue en échec en neutralisant la pause.
  - Les captures pleine page attendent les images `loading="lazy"` (elles manquaient en bas de l'accueil).

## D13 — Recherche (13 oct. 2026)

- **Interface maison sur l'API JavaScript de Pagefind** (`search`, `debouncedSearch`), au lieu du Pagefind UI du prototype : celui-ci injecte son propre balisage et son CSS, qu'on ne peut habiller que par des variables ; ici, la fenêtre est en composants M3 comme le reste. Pagefind reste chargé à la première ouverture seulement.
  - `<dialog>` modal (`m-auto`, piège du preflight), `form role="search"`, champ étiqueté, nombre de résultats annoncé (`role="status"`), résultats en simple liste de liens (Tab pour les parcourir, Entrée dans le champ amène au premier) ; Échap, bouton ou clic sur le voile ferment ; le focus revient à l'élément qui a ouvert ; la page derrière est bloquée.
  - 8 résultats au plus, avec titre, badge du thème (filtre `theme`) et extrait (les `<mark>` de Pagefind en `conteneur-or`). L'extrait est inséré en HTML : Pagefind le produit depuis notre propre contenu, texte échappé.
  - Index limité aux articles (`data-pagefind-body` n'existe que sur eux), en français (`lang="fr"`).
- **Boutons** : pastille « Rechercher » + raccourci en largeur étendue, bouton icône en dessous. Raccourci `Ctrl K` dans le HTML, remplacé par `⌘ K` sur Mac et iOS.
- **Recherche en dev** : l'intégration d'outillage (renommée `outillageDeDev`, ex-`pagesDeDev`) sert `dist/pagefind` sous `/pagefind` pendant `astro dev`. L'index est donc celui du **dernier build** (`npm run build` avant les captures) ; absent, la recherche affiche qu'elle est indisponible. *Écart au prototype*, qui remplaçait la recherche par un filtre local en dev : on testait alors autre chose que ce qui part en production.
- **Tests** : l'index couvre exactement les articles publiés, en français ; chaque article porte titre et filtre de thème ; fenêtre, formulaire, étiquette, zone d'état et deux boutons présents sur toutes les pages.
- **Captures** : les scènes peuvent envoyer de vraies frappes (`clavier` : touches avec Ctrl, texte, attentes), en remplacement de `tabulations`. Vérifié : `Ctrl K` ouvre, le focus est dans le champ, « Venti » trouve l'article, le nombre est annoncé, la page est bloquée ; sur mobile, le bouton icône ouvre, une recherche vaine est annoncée, la fenêtre tient dans l'écran ; Échap ferme, rend le focus au bouton et débloque la page. Vu en échec avec un raccourci cassé et avec des résultats jamais affichés.
- À savoir : la racinisation française de Pagefind rapproche « Venti » de « vent » (Mondstadt sort aussi) ; Venti reste premier.

## D14 — Redirections et référencement (13 oct. 2026)

- **Source unique `src/lib/redirections.mjs`** : les 33 anciennes URL (articles du modèle par catégories, anciennes catégories, anciens tags, adresses du tout premier site), **figées** comme dans le prototype. Lue par `astro.config.mjs` (`redirects`) **et** par `validation.mjs` : les noms d'articles réservés sont désormais **dérivés** des redirections `/lore/<nom>` (+ `tags`) au lieu d'une seconde liste écrite à la main, qui pouvait diverger. Résultat identique (9 noms).
- **Surface d'URL** : les 65 URL publiées par le prototype (`old/dist`) sont recopiées dans `tests/donnees/urls-publiees.txt`, **versionné** : `old/` ne l'est pas, le test ne peut pas en dépendre. Comparaison faite : il manquait exactement les 33 redirections, aucune page en trop ni en moins.
- **Forme des redirections** : pages statiques générées par Astro (`meta refresh`, `noindex`, canonique vers la nouvelle adresse). Suffisant pour les visiteurs et les moteurs ; de vraies **301** côté Vercel seraient meilleures — reporté au déploiement (étape 8).
- **`robots.txt`** généré (`src/pages/robots.txt.ts`) pour que l'adresse du sitemap suive `SITE_URL`. Sitemap déjà en place (étape 0), sans la 404 ni les redirections.
- **Tests** : unitaires (pas de redirection vers une redirection, toutes vers `/lore…`, noms réservés) ; sur `dist/` : chaque URL publiée répond, chaque page de redirection mène directement à une vraie page, `robots.txt`, anciennes URL absentes du sitemap. **Vu en échec** en retirant la redirection `/lore/chronologie`.

## D15 — Finitions avant la mise en ligne (13 oct. 2026)

Le déploiement lui-même est fait par Deltouille ; tout le reste de l'étape 8 est en place.

- **Une seule forme d'URL, sans barre finale** (`trailingSlash: 'never'`). Avant, la canonique et le sitemap déclaraient `/lore/venti/` alors que tous les liens et redirections menaient à `/lore/venti` : deux adresses pour une page. Test ajouté (canoniques et sitemap sans barre finale).
- **`vercel.json` généré** par `scripts/vercel.mjs` (`npm run vercel`) depuis `src/lib/redirections.mjs`, test de synchronisation comme pour la palette :
  - les 33 anciennes URL en **vraies redirections 301** (les pages `meta refresh` d'Astro restent dans `dist/` pour tout autre hébergeur) ;
  - `buildCommand: npm run build` (un simple `astro build` oublierait l'index de recherche), `trailingSlash: false` ;
  - cache d'un an, `immutable`, sur `/_astro/*` (noms de fichiers à empreinte) ;
  - en-têtes `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`. **Pas de CSP** pour l'instant : les scripts sont mis en ligne par Astro, il faudrait leurs empreintes (hash) ; à faire si besoin, avec un test.
- **Audit d'accessibilité automatisé** : axe-core injecté par `npm run captures` dans chaque scène (pages, menus et recherche ouverts, mobile, deux thèmes), règles WCAG 2.2 A/AA + bonnes pratiques ; toute violation fait échouer le script. Les vraies pages passaient d'emblée ; seules les pages d'outillage `/demo*` avaient des repères manquants, corrigés. Vu en échec : bouton de recherche mobile sans nom → `button-name (critical)` (et seulement en 390 px : axe ignore, à juste titre, un bouton masqué).
- **Poids** (`tests/poids.test.mjs`, budgets écrits dans le test) : HTML < 25 Ko compressés par page (mesuré 11 à 15), aucun fichier JS externe et < 12 Ko de scripts en ligne, une seule feuille CSS < 20 Ko compressés (9), chaque image affichée < 400 Ko, image de partage JPEG 1200 × 630 < 300 Ko.
  - Le test a trouvé deux vrais défauts : l'**image de partage** était l'original (1,3 à 1,6 Mo) → générée en 1200 × 630 par `getImage` (≈ 110 Ko) ; le **`src` de repli** des `<Image>` était l'original ré-encodé en 3840 px (≈ 600 Ko, inutile mais généré, et chargé par un navigateur sans `srcset`) → `width` = la plus grande variante. `dist/_astro` : 11 → 6,4 Mo.
  - **Limite connue** : les images non utilisées de `src/assets/images` (régions sans article) sont copiées dans `dist/` (≈ 6 Mo), parce que `import.meta.glob` les importe toutes. Essayé : l'import paresseux ne change rien (Vite émet quand même chaque module). Sans effet sur le poids des pages ; seulement sur la taille du déploiement.
- **Lighthouse 12** (mobile, bridage par défaut, Brave, `astro preview`) :

  | Page | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT |
  |---|---|---|---|---|---|---|---|
  | `/` | 100 | 100 | 100 | 100 | 1,8 s | 0,013 | 0 ms |
  | `/lore/venti` | 100 | 100 | 100 | 100 | 1,7 s | 0 | 0 ms |
  | `/lore` | 100 | 100 | 100 | 100 | 1,0 s | 0 | 0 ms |

  Lancé à la main (`CHROME_PATH=$(which brave) npx lighthouse@12 <url>`), pas dans les tests : les scores varient d'une machine à l'autre ; les budgets de `poids.test.mjs` et l'audit axe sont les garde-fous permanents.

## D16 — Transitions entre pages (View Transitions) (13 oct. 2026)

- **View Transitions natives entre documents** (`@view-transition { navigation: auto; }` dans `global.css`), et non le `<ClientRouter />` d'Astro : celui-ci ferait du site une application monopage, imposerait de réécrire tous les scripts (barre, thème, recherche, machine à écrire ne s'exécuteraient qu'au premier chargement) et ajouterait du JavaScript à chaque page. Ici, zéro JavaScript pour la transition de page. Chrome, Edge et Safari 18.2+ animent ; les autres navigateurs naviguent comme avant (amélioration progressive).
- **Mouvement M3** : « fondu enchaîné » pour la page (sortie 90 ms en courbe d'emphase, entrée 210 ms avec un léger zoom), éléments partagés en 350 ms, courbe standard. **Aucune transition** sous `prefers-reduced-motion`.
- **Éléments partagés** :
  - la **barre de navigation** (`barre-navigation`) reste en place ;
  - la **carte d'un article se transforme en sa bannière** (`image-<id>`, fonction `transitionImage` dans `contenu.ts`), recadrée et non déformée (`view-transition-class: image-article`, `object-fit: cover`).
- **Deux défauts vus sur des images ralenties** (animations à 10 % par le protocole DevTools, capturées en cours de route) et corrigés :
  1. avec un nom sur *toutes* les cartes, celles qui existent aussi sur la page d'arrivée (« Pour aller plus loin ») volaient vers leur nouvelle place → les cartes ne portent plus qu'un `data-transition` ; un petit script en ligne dans le `<head>` donne le nom à la **seule carte cliquée** (`pageswap`) ou, au retour en arrière, à la carte de l'article qu'on quitte (`pagereveal`, via `navigation.activation`). Sans ce script (ou sans ces événements), il reste le fondu de page ;
  2. avec le nom sur l'*image* de la bannière, l'image passait au-dessus du voile et du titre, qui surgissaient à la fin → le nom est porté par **toute la bannière** ; le titre apparaît en fondu pendant le mouvement.
- **Piège** : deux éléments du même nom sur une page annulent toute la transition. D'où l'accueil, où « À la une » et la grille montrent tous deux Mondstadt : la carte « À la une » n'a pas de nom.
- **Tests** : aucun nom en double sur aucune page (vu en échec en nommant aussi la carte « À la une ») ; aucune carte nommée d'avance, chaque bannière nommée, `data-transition` correspondant ; script de nommage dans le `<head>` ; règles CSS (actives, coupées en mouvement réduit). **Captures** : option `navigation` (clic sur un lien, la scène continue sur la page d'arrivée) et écoute de `pagereveal` sur chaque document : le clic sur une carte révèle l'article **par une View Transition** dans Brave, et **sans** en mouvement réduit (vu en échec en retirant `@view-transition`). Le retour en arrière n'est pas testé automatiquement (cache de navigation incertain en headless).

## D17 — Crédits des contenus repris (14 oct. 2026)

- **Contexte** : une partie du contenu sera une reprise ou une traduction de pages du Genshin Impact Wiki (Fandom, CC BY-SA 3.0), et parfois de théories publiées sur Reddit ou X. Il faut créditer pages et auteurs, et tenir la promesse de la page Crédits (« un lien vers l'article original et une mention des modifications effectuées »).
- **Choix** : les crédits sont une **donnée de l'article**, vérifiée au build, plutôt qu'un texte libre :
  - champ `credits` du frontmatter, distinct de `sources` (repères dans le jeu) ; deux types : `wiki` (`titre`, `url`, `modifications`) et `communaute` (`auteur`, `plateforme` : reddit | x | youtube | autre, `url`, `titre` facultatif) ;
  - garde-fous (`src/lib/credits.mjs`, appelé par `validation.mjs`) : adaptation du wiki **sans `modifications`** (CC BY-SA impose d'indiquer les changements), URL `wiki` hors de `genshin-impact.fandom.com`, URL ne correspondant pas à la plateforme déclarée (domaine exact ou sous-domaine : `reddit.com.exemple.org` est refusé), adresse non HTTPS → le build échoue en nommant le fichier ;
  - encadré **« Crédits »** en fin d'article (`EncadreCredits`) : lien vers la page d'origine, lien vers l'**historique de ses contributeurs** (l'attribution d'une page de wiki), licence, modifications ; pour la communauté, auteur et plateforme ;
  - page **`/credits`** : le texte de Deltouille, puis deux listes générées depuis les articles (adaptations du wiki, théories créditées), affichées seulement si elles ne sont pas vides. Liens depuis le pied de page et « À propos ».
- **Tests** : unitaires (`tests/credits.test.mjs` : domaines, HTTPS, modifications obligatoires, présentation, lien d'historique) et validation ; sur `dist/` : page Crédits, lien en pied de page, encadré et listes présents exactement quand le frontmatter déclare des crédits.
- **Vérifié avec des crédits temporaires sur Venti** (retirés ensuite : aucune vraie source n'a été inventée) : rendu de l'encadré et des listes, audit axe ; build en échec sans `modifications`. Défaut corrigé : espace manquante avant « (contributeurs) ».
- **À savoir** : une publication Reddit ou X n'est pas sous licence libre ; la traduire en entier demande l'accord de son auteur. Le site crédite, mais ne peut pas vérifier cet accord.
- **Outillage** : `npm run captures -- --base <url>` contre `astro preview` saute désormais les scènes `/demo` (dev seulement) en le signalant. Utile quand un `npm run dev` lancé par Deltouille occupe déjà le projet : Astro 7 refuse un second serveur de dev pour le même projet.

## D18 — Textes originaux sous CC BY-SA 3.0 (14 oct. 2026)

- **Contexte** : la première version de la page Crédits réservait les droits des textes originaux. Deltouille : les mettre « aussi sous CC BY-SA comme le wiki. Le site est open source de toutes façons ».
- **Choix** : **tous les textes du site**, originaux comme adaptations, sont sous **CC BY-SA 3.0**, la même version que le wiki (une seule licence pour tout le site, et compatible avec les adaptations). La section « Contenus originaux » de `/credits` le dit, avec les conditions de réutilisation ; `<link rel="license">` est déclaré sur **chaque page** ; le pied de page le rappelle. Les éléments appartenant à HoYoverse (illustrations, noms, personnages) restent **hors** licence, comme le dit la section dédiée.
- **Écarté** : CC BY-SA 4.0 pour les textes originaux (plus récente) : deux licences à expliquer pour un même site.
- **Ouvert** : la licence du **code** (le dépôt n'a pas de fichier `LICENSE`) est une décision distincte, à prendre par Deltouille.
- **Tests** : licence déclarée sur toutes les pages (hors pages de redirection), rappel en pied de page, section « Contenus originaux » sous CC BY-SA.

## D19 — Code sous GNU GPL v3 ou ultérieure (14 oct. 2026)

- **Contexte** : Deltouille veut une licence copyleft « type GPL » pour le code, compatible avec le contenu du site (textes sous CC BY-SA 3.0, éléments appartenant à HoYoverse).
- **Choix** : **GPL-3.0-or-later** (`LICENSE` : texte officiel téléchargé sur gnu.org ; `package.json` : `"license": "GPL-3.0-or-later"`).
  - **v3 et non v2** : les tracés d'icônes Material Symbols et Material Color Utilities sont sous Apache-2.0, compatible avec la GPL v3 mais pas avec la v2.
  - **GPL et non AGPL** : la clause réseau de l'AGPL vise le logiciel exécuté côté serveur ; le site est statique, sans code serveur. Le JavaScript envoyé aux navigateurs est de toute façon « distribué » au sens de la GPL, et le dépôt public en fournit la source.
  - **« ou ultérieure »** : permet de suivre une future version de la GPL sans avoir à recontacter tous les contributeurs.
- **Compatibilité avec le contenu** : code, textes et éléments de HoYoverse sont des œuvres **distinctes, simplement réunies** (agrégat, section 5 de la GPL v3) : aucune licence ne s'étend aux autres. Condition : délimiter clairement, ce que fait `LICENCES.md` — code (tout ce qui n'est pas listé ailleurs) sous GPL ; articles, registre des tags et textes éditoriaux écrits dans les pages et composants sous CC BY-SA 3.0 (dans un fichier `.astro`, le balisage relève du code, les phrases pour les lecteurs relèvent des textes) ; images de `src/assets/images/` et `public/social.webp` sans licence libre (HoYoverse).
- **Dépendances** : inventaire complet de `node_modules` (≈ 290 paquets) : MIT, ISC, Apache-2.0, BSD, 0BSD, BlueOak, CC0, LGPL-3.0-or-later (`sharp-libvips`, outil de build) et MPL-2.0 (`lightningcss`, `axe-core`, outils de build et de test). Toutes compatibles GPL v3. Pour la MPL-2.0, aucun fichier ne porte la mention « Incompatible With Secondary Licenses » (une première recherche l'avait cru, à tort : le texte de la licence lui-même définit cette expression ; on ne cherche donc que dans le code). Ne partent dans le site publié que Pagefind (MIT) et les tracés Material Symbols (Apache-2.0).
- **Garde-fou** : `tests/licences.test.mjs` vérifie le texte de `LICENSE` (empreinte SHA-256), la déclaration du paquet, le découpage de `LICENCES.md`, et que **toute dépendance installée** reste sous une licence compatible avec la GPL v3 (liste fermée ; une licence inconnue fait échouer le test, à examiner avant de l'ajouter). Vu en échec en retirant MIT de la liste.
- **Affichage** : section « Code source » sur `/credits`, mention dans le pied de page (« code sous licence GNU GPL v3 »).
- **Pistes non retenues pour l'instant** :
  - passer les textes en **CC BY-SA 4.0**, qui est compatible à sens unique avec la GPL v3 (pas la 3.0), et le permet pour les adaptations du wiki (la CC BY-SA 3.0 autorise une version ultérieure pour les adaptations). Utile seulement si texte et code devaient un jour être vraiment mélangés ; l'agrégat suffit aujourd'hui ;
  - en-têtes SPDX dans chaque fichier source : facultatifs, `LICENCES.md` fait foi.
- **À compléter par Deltouille** : la ligne de copyright de `LICENCES.md` (« Deltouille et les contributeurs du projet ») et, une fois public, le lien vers le dépôt sur `/credits`.

## D20 — Barre de progression et sommaire qui suit la lecture (14 oct. 2026)

- **Barre de progression** (`ProgressionLecture.astro`, articles seulement) : indicateur linéaire M3 de 4 px, en `primaire`, fixé juste sous la barre de navigation. Il mesure **l'article** (`[data-lecture]`), pas la page : vide quand le début du texte passe sous la barre, plein quand sa fin atteint le bas de l'écran (pied de page et lectures liées exclus). Décoratif (`aria-hidden`) : les lecteurs d'écran ont leur propre repère de position. Piloté par un petit script (défilement, `requestAnimationFrame`).
  - **Écarté** : les animations CSS liées au défilement (`animation-timeline: scroll()`), pas encore disponibles partout et qui mesurent la page entière.
  - **Piège** : les classes `scale-*` de Tailwind v4 utilisent la propriété CSS `scale`, pas `transform`. La première version réglait `transform: scaleX()` sur un élément `scale-x-0` : les deux échelles se multipliaient, la barre restait invisible… et le test, qui lisait `transform`, passait. Le script règle maintenant `scale`, et la capture mesure la **largeur réellement affichée**. Défaut vu sur la capture, puis reproduit pour vérifier que la nouvelle mesure l'attrape.
- **Sommaire qui suit la lecture** (`Sommaire.astro`) : la section en cours est le dernier titre passé sous la ligne de lecture (barre de navigation + 32 px) ; tout en bas de la page, la dernière section l'emporte même courte. Elle porte `aria-current="true"` dans les deux sommaires (repliable en mobile, latéral sinon) ; style : trait primaire à gauche et couleur primaire, sans changer la graisse (pas de saut de mise en page).
- **Défaut existant corrigé** : sur un article, la barre de navigation est fixe et il n'y avait pas de `scroll-padding-top` : un clic dans le sommaire amenait le titre **sous** la barre (0 px). `html { scroll-padding-top: 5rem }`.
- **Tests** : sur `dist/`, barre décorative et article mesuré sur chaque article, deux sommaires suivis, aucune section active dans le HTML statique, pas de barre hors des articles, `scroll-padding-top` présent. **Captures** : barre vide avant l'article, à moitié au milieu, pleine à la fin et au-delà (1440 et 390 px) ; deuxième titre actif dans les deux sommaires ; clic dans le sommaire (desktop et mobile) : titre visible sous la barre, lien devenu actif. Vues en échec : sans `scroll-padding-top` (titre à 0 px), avec un suivi de section cassé, avec la barre invisible d'origine.

## D21 — Organisation libre de `src/content/articles` (14 oct. 2026)

- **Contexte** : Deltouille a rangé des articles en sous-dossiers (`mondstadt/mondstadt-act-I.md`) ; le build a planté (« Missing parameter: slug »). Le chargeur `glob()` d'Astro dérive l'identifiant du **chemin** (`mondstadt/mondstadt-act-i`), et la barre oblique ne rentre pas dans la route `/lore/[slug]`. Or le cahier des charges voulait une organisation interne libre, sans effet sur l'URL.
- **Choix** : l'identifiant d'un article, donc son URL, vient **du nom du fichier seul** (`src/lib/identifiant.mjs`, branché par `generateId` dans `content.config.ts`) : minuscules, sans accents, tirets (`mondstadt-act-I.md` → `/lore/mondstadt-act-i`). Les dossiers sont libres : **déplacer un fichier ne change pas son URL** ; le **renommer**, si.
  - **Doublons** : deux fichiers de même nom dans deux dossiers voudraient la même URL, et le chargeur garderait l'un en écrasant l'autre sans erreur → `bibliotheque()` les détecte et fait échouer le build en nommant les deux fichiers.
  - Les messages de validation donnent le **vrai chemin** du fichier (`filePath`), sous-dossier compris.
  - `tests/sources.mjs` parcourt les sous-dossiers et applique la même règle.
- **Conséquence du renommage** : `prologue-mondstadt.md` → `mondstadt-act-I.md` a changé une URL publiée. Redirections ajoutées dans `src/lib/redirections.mjs` (`ARTICLES_RENOMMES`) : `/lore/prologue-mondstadt` → `/lore/mondstadt-act-i`, et `/lore/quetes/prologue-mondstadt` repointée directement (pas de chaîne) ; `vercel.json` régénéré (34 redirections) ; lien interne de `mondstadt.md` mis à jour. Les tests de surface d'URL et de redirections l'auraient exigé.
- **Tests** : `tests/identifiant.test.mjs` (nom seul, slug, doublons). **Vérifié sur un vrai build** : `venti.md` déplacé dans `personnages/` → toujours `/lore/venti`, tous les tests verts ; deux `venti.md` dans deux dossiers → « Même URL /lore/venti pour src/content/articles/personnages/venti.md et src/content/articles/venti.md : renommez l'un des fichiers ».
- **Outillage** : `scripts/captures.mjs` attend la fin réelle du navigateur avant de supprimer son profil temporaire (échec intermittent `ENOTEMPTY` à la fermeture).

## D22 — Pas d'adresse e-mail : contact par GitLab, mentions légales (16 oct. 2026)

- **Contexte** : Deltouille ne veut pas publier ses informations personnelles ; l'adresse e-mail figurait dans « À propos ». Dépôt public : <https://gitlab.com/Choumo/les-archives-de-teyvat>.
- **Choix** :
  - **contact par les tickets GitLab** du dépôt (« À propos », mentions légales) ; l'adresse e-mail est retirée du site ;
  - adresses du projet (dépôt, tickets) et de l'hébergeur écrites **une seule fois**, `src/lib/projet.mjs` ;
  - **page `/mentions-legales`** : la LCEN permet à un particulier éditant **à titre non professionnel** de garder l'anonymat, à condition d'identifier l'**hébergeur** et de lui avoir communiqué ses coordonnées. La page donne donc l'éditeur (particulier, non professionnel, anonyme), le contact GitLab et l'hébergeur : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (vérifié sur vercel.com/legal le 16 oct. 2026). Le numéro d'article de la LCEN n'est volontairement pas cité (loi remaniée en 2024). Ce n'est pas un avis juridique ;
  - liens « Mentions légales » et « Code source » dans le pied de page ; lien vers le dépôt sur `/credits`, dans `LICENCES.md` et le README ;
  - « Confidentialité » précise qu'un ticket GitLab est public et relève des règles de GitLab.
- **Garde-fou** : un test échoue si une adresse e-mail ou un lien `mailto:` apparaît dans une page publiée (vu en échec avec une adresse d'essai).
- **À faire par Deltouille** :
  - ouvrir les **tickets** du dépôt à tous (aujourd'hui `/-/issues` répond 404 sans connexion) ;
  - s'assurer d'avoir fourni son identité à Vercel (compte) : c'est ce qui rend l'anonymat légal ;
  - l'adresse reste dans l'**historique git** (auteur des commits, et contenu du commit de l'étape 4) : la nettoyer **avant** le premier envoi sur GitLab.
- **En passant** : le test du sommaire comparait les titres caractère pour caractère ; Astro rend les apostrophes droites en typographiques (« L'attaque » → « L’attaque »). Comparaison normalisée.

## D23 — Crédits des logiciels libres utilisés (16 oct. 2026)

- **Contexte** : Deltouille : « Ne faut-il pas mentionner tous les projets utilisés dans les crédits ? » (comme dans les jeux).
- **Constat** : les licences MIT et Apache-2.0 exigent de joindre mention de copyright et licence **aux copies distribuées**. Un jeu embarque ses bibliothèques dans le binaire, d'où ses longues listes. Ici, seul part chez le visiteur : le CSS généré par **Tailwind** (sa mention MIT est déjà conservée en tête du CSS), les scripts et l'index de **Pagefind** (MIT, **aucune** mention dans les fichiers publiés) et les tracés d'icônes **Material Symbols** (Apache-2.0, aucune mention sur le site). Les outils de construction (Astro, TypeScript, Material Color Utilities, axe-core…) ne sont pas distribués : aucune obligation.
- **Choix** : section **« Logiciels libres utilisés »** sur `/credits`, en deux listes — distribués avec le site (obligatoire : Pagefind, Material Symbols, Tailwind CSS) et utilisés pour le construire (courtoisie : Astro, Material Color Utilities) — avec titulaire, licence et lien vers son texte ; Mizuki cité comme inspiration.
  - Registre unique `src/lib/tiers.mjs`. Titulaires **relevés dans les fichiers de licence**, pas de mémoire : « Pagefind », « Tailwind Labs, Inc. », « Fred K. Schott », Google / Google LLC.
- **Garde-fou** : `tests/tiers.test.mjs` vérifie pour chaque entrée que le paquet est dans `package.json`, que la licence affichée est celle qu'il déclare, et que le titulaire figure dans sa licence, son README ou ses sources (vu en échec avec un titulaire et une licence faux) ; Pagefind, Material Symbols et Tailwind doivent être marqués « distribués ». Test de la page : chaque entrée apparaît dans la bonne liste.
- **Fausse alerte en route** : chez Pagefind, `LICENSE` est un dossier ; une commande mal écrite avait lu le `LICENSE` (GPL) du projet et fait croire à une licence GPL.

## D24 — Nouveau nom : « Les Archives de Teyvat » (16 oct. 2026)

- **Contexte** : demande de Deltouille ; c'est le nom du dépôt GitLab (`les-archives-de-teyvat`).
- **Choix** : le nom est écrit **une seule fois**, `NOM` dans `src/lib/projet.mjs` ; titre des pages, Open Graph, pied de page, « À propos », mentions légales, crédits le reprennent. Exception : la marque de la barre de navigation, en deux graisses (« Les Archives **de Teyvat** »), à mettre à jour à la main avec `NOM`. `package.json` et `package-lock.json` : `les-archives-de-teyvat`. README et CLAUDE.md renommés.
- **Test** : sur chaque page, titre et `og:site_name` portent le nouveau nom ; l'ancien n'apparaît plus nulle part.
- **Non changé** : l'URL de production par défaut (`l-histoire-de-genshin-expliquee.vercel.app`, `astro.config.mjs`). Si le projet Vercel est renommé, mettre à jour cette valeur ou définir `SITE_URL`.

## D25 — Articles déplacés invisibles en dev (16 oct. 2026)

- **Contexte** : Deltouille a rangé les trois actes dans `mondstadt/quest/` : ils ont disparu de son `npm run dev` (le build, lui, les produisait).
- **Cause** (reproduite dans une copie du projet, puis lue dans `astro/dist/content/loaders/glob.js`) : un déplacement envoie au chargeur `glob()` l'arrivée du nouveau chemin **et** le départ de l'ancien. Depuis D21, les deux donnent le **même identifiant** (nom de fichier seul) : quand le départ est traité après l'arrivée, le chargeur supprime cet identifiant, donc l'article tout juste relu. Avec les identifiants par défaut d'Astro (chemin complet), ce conflit n'existait pas. Premier contournement essayé (réémettre les fichiers d'un nouveau dossier, `addDir`) : sans effet.
- **Choix** : dans l'intégration `outillageDeDev`, après chaque suppression d'un fichier d'article (300 ms, le temps que le chargeur la traite), les fichiers **homonymes** encore présents sont relus (`homonymes()` dans `src/lib/identifiant.mjs`, testée).
- **Vérifié dans la copie du projet** : déplacement dans un nouveau sous-dossier → articles toujours servis (avant : 404) ; retour à la racine → servis ; vraie suppression → l'article disparaît, les autres restent.
- Le build n'a jamais été concerné.

## D26 — Dépôt déplacé sur GitHub (16 oct. 2026)

- **Contexte** : Deltouille déplace le dépôt de GitLab vers GitHub : <https://github.com/Deltouille/les-archives-de-teyvat> (vérifié : public, vide, tickets ouverts à tous — page `/issues` en 200, alors que ceux de GitLab restaient à activer).
- **Choix** : `src/lib/projet.mjs` porte désormais aussi le **nom de la plateforme** (`PLATEFORME = 'GitHub'`) ; les pages (« À propos », Confidentialité, Crédits, Mentions légales) le reprennent au lieu d'écrire la plateforme en dur. Changer de plateforme = `PLATEFORME`, `DEPOT`, `TICKETS`. Contact : `…/issues`. README, `LICENCES.md` et CLAUDE.md mis à jour.
- **Test** : `PLATEFORME`, `DEPOT` et `TICKETS` cohérents, et plus aucune mention de « GitLab » dans les pages publiées.
- **Non fait** : la télécommande git `origin` pointe encore vers GitLab ; à changer par Deltouille (`git remote set-url origin …`). L'historique contient toujours son adresse e-mail : à nettoyer **avant** tout envoi sur GitHub (adresse « noreply » GitHub, de la forme `ID+pseudo@users.noreply.github.com`).

## D27 — Historique git nettoyé des informations personnelles (16 oct. 2026)

- **Contexte** : l'adresse e-mail personnelle de Deltouille figurait comme auteur et committer de tous les commits, et dans le contenu de l'ancienne page « À propos » (commits de l'étape 4 à la publication sur GitLab) ; son prénom apparaissait dans la documentation, un commentaire de `credits.astro`, la ligne de copyright de `LICENCES.md` et un message de commit. La branche avait été poussée sur GitLab ; GitHub était encore vide.
- **Choix** (validé par Deltouille) : **réécrire l'historique en gardant tous les commits** (`git filter-branch`, 21 commits) :
  - auteur et committer → `Deltouille <34238909+Deltouille@users.noreply.github.com>` (adresse « noreply » GitHub) ; le commit initial d'Astro garde son auteur (houston[bot]) ;
  - dans le contenu de chaque commit et dans les messages : adresse → lien vers les tickets GitHub, prénom → « Deltouille » ;
  - `user.name` et `user.email` réglés **pour ce dépôt seulement** (`.git/config`), pour les commits suivants.
- **Écarté** : regrouper tout le projet en un seul commit (on perdait l'historique étape par étape).
- **Piège rencontré** : `CLAUDE.md` est un lien symbolique vers `AGENTS.md` ; la première passe l'avait lu à travers le lien puis réécrit comme fichier ordinaire, dans tous les commits. Repéré au contrôle (différence déséquilibrée), `main` remise sur la sauvegarde, script corrigé (liens ignorés), réécriture relancée : lien conservé dans les 21 commits.
- **Vérifié** : plus aucune occurrence de l'adresse ni du prénom dans les métadonnées, le contenu des 21 commits et les messages ; même nombre de commits ; `npm run verify` vert.
- **Reste** : l'ancien historique est **publié sur GitLab** (projet à supprimer) ; une sauvegarde locale (`refs/sauvegarde/main`, `refs/original/…`) reste sur la machine jusqu'à validation, à supprimer ensuite.

## D28 — Accueil indépendant des articles : sujets aléatoires, « à la une » choisi par le contenu (16 oct. 2026)

- **Contexte** : supprimer les articles de la racine de `content` faisait planter le build. Cause reproduite : la carte « À la une » visait `mondstadt` en dur (`throw` si absent). Les sujets de la machine à écrire étaient aussi écrits en dur dans `HeroAccueil.astro` (sans faire planter, mais sans suivre le contenu). Deltouille voulait des sujets aléatoires tirés de tous les articles.
- **Choix** :
  - **Sujets** : un par article publié, `sujetDAccueil()` : le champ facultatif `accroche` du frontmatter (« les sept Archontes »), sinon le **titre entre guillemets** (« Ici, on vous raconte « Venti, le dieu qui choisit la liberté » »), correct en français quel que soit le titre. Le premier (article le plus récent) est écrit dans le HTML ; le script part de lui puis enchaîne une file **mélangée à chaque visite** (`melanger()`, Fisher-Yates, `src/lib/aleatoire.mjs`), remélangée à chaque tour sans répéter deux fois de suite le même sujet. Sans article : phrase fixe « l'histoire de Teyvat », pas d'animation ni de bouton pause.
  - Lecteurs d'écran : une phrase stable (« Ici, on vous raconte les histoires de Teyvat. ») au lieu de l'énumération de tous les sujets, qui s'allongerait avec le contenu.
  - **« À la une »** : `articleALaUne()` : le plus récent des articles marqués `aLaUne: true`, sinon le plus récent ; aucun article → la carte disparaît. La carte reprend le titre, la description et le thème de l'article, au lieu des accroches propres à Mondstadt (« La liberté a une histoire. ») : elle doit convenir à n'importe quel article.
  - Lectures récentes masquées sans article.
  - Contenu : `accroche` ajoutée aux quatre articles d'origine (formules de l'ancien Hero), `aLaUne: true` sur `mondstadt.md` pour garder la même carte. Les actes du prologue n'ont pas d'accroche : leur titre est utilisé.
- **Tests** : unitaires (`tests/accueil.test.mjs` : sujet, choix « à la une », mélange reproductible) ; sur `dist/` : un sujet par article, premier sujet dans le HTML, phrase stable pour les lecteurs d'écran, carte « à la une » conforme à la règle. Capture en mouvement réduit : le texte affiché est le premier sujet de la liste (plus de sujet en dur).
- **Vérifié dans une copie du projet** : sans les articles de la racine, le build passe (sujets = les trois actes, carte = l'acte le plus récent) ; sans **aucun** article, le build passe aussi (phrase fixe, pas de carte).
- **À savoir** : supprimer un article **publié** reste encadré par les tests de surface d'URL (D14) : il faudra une redirection, ou retirer l'URL de `tests/donnees/urls-publiees.txt` en connaissance de cause.

## D29 — Emblème des pages de thème à gauche du titre (16 oct. 2026)

- **Contexte** : sur une page de thème (`/lore/tags/regions`…), l'emblème flottait au-dessus du sur-titre ; Deltouille le préfère à gauche du titre.
- **Choix** : `EnTetePage` place l'emblème facultatif sur la même ligne que le `h1`, centré verticalement, le sur-titre au-dessus des deux. Emblème de 56 px en mobile, 64 px au-delà de 600 px, décoratif (`aria-hidden`). La présence de l'emblème est jugée sur son **rendu** (piège connu : `Astro.slots.has()` est vrai pour un slot conditionnel vide, cas des tags simples).
- **Test** : sur chaque page de tag, emblème à gauche du titre si et seulement si c'est un thème, sur-titre au-dessus.

## D30 — Confidentialité exacte, licences jointes, anonymat conditionnel (16 oct. 2026)

- **Contexte** : trois remarques de relecture : la promesse « aucune donnée personnelle » (mentions légales) était fausse, puisque l'hébergeur traite les adresses IP ; les textes des licences des logiciels distribués n'étaient pas joints ; l'anonymat de l'éditeur suppose une démarche à vérifier.
- **Confidentialité** (vérifié dans la politique de Vercel le 16 oct. 2026) : Vercel traite, pour chaque visiteur, « l'adresse IP, la localisation déduite de l'adresse IP et des informations de configuration du système », en **sous-traitant** ; l'éditeur est **responsable du traitement** ; aucune durée de conservation publiée. La page Confidentialité distingue désormais « Ce que le site ne fait pas » (ni publicité, ni mesure d'audience, ni cookie, ni script tiers) et « Ce que l'hébergement traite » (données, finalité, base légale : intérêt légitime, hébergeur aux États-Unis, lien vers sa politique, droits et CNIL). Les mentions légales y renvoient au lieu de promettre « aucune donnée personnelle ». Aucun service d'analyse de Vercel n'est intégré ; en activer un imposerait de revoir cette page.
- **Licences** : chaque logiciel crédité a son texte complet publié tel quel, `/licences/<slug>.txt`, **lu au build** dans le fichier de licence du paquet installé (`src/pages/licences/[slug].txt.ts`, champ `fichier` de `src/lib/tiers.mjs`) : notice de copyright et d'autorisation pour MIT, copie de la licence pour Apache-2.0 ; aucun fichier NOTICE n'est à redistribuer. Les crédits lient « texte complet » et « présentation ». La licence de ripgrep, fournie avec Pagefind, concerne son outil de build, non distribué.
- **Anonymat** : les mentions légales citent désormais l'article 1-1, II de la LCEN (vérifié sur Légifrance) : anonymat permis « sous réserve d'avoir communiqué à ce fournisseur les éléments d'identification personnelle ». **À vérifier par Deltouille** auprès de Vercel ; rien de ces éléments n'est à mettre dans le dépôt.
- **Tests indépendants du contenu** : plusieurs tests et captures visaient l'article Venti en dur ; ils prennent maintenant un **article d'exemple** (`articleExemple()` dans `tests/sources.mjs` : le publié qui a le plus de sections), et la capture de recherche cherche le plus long mot de son titre. Défaut révélé par la suppression des articles de la racine.
- **Tests ajoutés** : confidentialité (sections, adresse IP, sous-traitant, responsable, CNIL, lien Vercel ; plus de « aucune donnée personnelle » ; article 1-1 cité) ; licences (texte complet de chaque logiciel, lié depuis les crédits, notice MIT ou texte Apache complet).
- **Limite signalée** : les droits (accès, effacement…) s'exercent auprès de l'éditeur par les tickets publics du dépôt ; un canal privé (adresse dédiée) serait plus adapté. Décision de Deltouille.
- **Mise à jour (16 oct. 2026)** : Deltouille a vérifié que son compte Vercel contient les quatre éléments exigés par l'article 1-1, I (nom et prénoms, domicile, numéro de téléphone) ; la condition de l'anonymat est remplie et la phrase des mentions légales est exacte. Ces informations restent chez l'hébergeur, jamais dans le dépôt.

## D31 — Articles et tags supprimés : redirigés vers la page la plus proche (16 oct. 2026)

- **Contexte** : Deltouille a supprimé cinq articles (archons, cataclysme, mondstadt, ordre-abysse, venti) et huit tags (abysse, anémo, archontes, barbatos, dvalin, khaenri-ah, liberté, voyageur), sans retour prévu. Treize URL publiées répondaient 404 et quatorze anciennes redirections menaient à des pages disparues : le garde-fou des URL publiées (D14) l'a signalé.
- **Choix** : rediriger plutôt que laisser des 404 (les liens entrants mènent encore quelque part) :
  - `ARTICLES_SUPPRIMES` (`src/lib/redirections.mjs`) : archons → Concepts, cataclysme → Événements, mondstadt → tag Mondstadt (qui existe toujours, plus précis que Régions), ordre-abysse → Factions, venti → Personnages ;
  - `TAGS_SUPPRIMES` → l'index des tags ;
  - **résolution des chaînes** : chaque redirection est suivie jusqu'à une vraie page (`/lore/regions/mondstadt` → `/lore/tags/mondstadt` directement, `/tags/anemo` → `/lore/tags`), boucle détectée ; `vercel.json` régénéré (47 redirections 301).
- **Garde-fous** : les noms des articles supprimés deviennent réservés (leur adresse est une redirection) ; redéclarer un tag supprimé dans `tags.yaml` fait échouer le build en indiquant de le retirer de `TAGS_SUPPRIMES`.
- **Écarté** : laisser ces adresses en 404 en les retirant de la liste des URL publiées.
- **Article de référence des tests** : l'acte I du prologue (`mondstadt-act-i`), choisi par Deltouille comme contenu stable ; à défaut, le publié qui a le plus de sections.
- **Tests** : redirections des articles et tags supprimés, résolution des chaînes ; tag supprimé redéclaré refusé ; les tests unitaires n'utilisent plus `venti` comme nom libre (il est désormais réservé).

## D32 — Contact privé par un alias e-mail (16 oct. 2026)

- **Contexte** : les droits sur les données (D30) ne pouvaient s'exercer que par des tickets publics. Deltouille a d'abord proposé son adresse personnelle ; écartée parce qu'elle contient son nom (elle lèverait l'anonymat des mentions légales) et qu'elle serait revenue dans l'historique git public tout juste nettoyé (D27).
- **Choix** : un **alias Proton Pass** dédié au projet (offre gratuite : 10 alias), qui transfère vers sa boîte sans la révéler et peut être désactivé en cas de spam : `CONTACT_PRIVE` dans `src/lib/projet.mjs`. Canal privé (données personnelles, réclamations) dans Confidentialité, Mentions légales et « À propos » ; les tickets GitHub restent le canal public pour remarques et corrections.
- **Garde-fou** : le test des adresses e-mail n'autorise plus que cet alias ; toute autre adresse dans une page publiée le fait échouer (vu en échec avec une adresse d'essai). Confidentialité et Mentions légales doivent proposer le contact privé.

## D33 — Notice de confidentialité complétée ; analyse SPDX corrigée (16 oct. 2026)

- **Contexte** : seconde relecture : (1) la notice ne donnait ni durée de conservation ni mécanisme de transfert, et rien sur le contact par courriel (RGPD, article 13) ; (2) elle présentait Vercel comme sous-traitant pour tous les traitements, alors que Vercel distingue ce qu'il traite pour ses clients et ce qu'il traite comme responsable ; (3) le test de compatibilité des licences acceptait `(MIT OR Apache-2.0) AND CC-BY-NC-4.0` (parenthèses supprimées).
- **Faits vérifiés** (16 oct. 2026) :
  - le contrat de sous-traitance (DPA) de Vercel « s'applique […] pour les clients des offres Enterprise et Pro » ; le site est sur l'offre **Hobby** (confirmé par Deltouille) : **aucun contrat de sous-traitance** ;
  - Vercel se déclare responsable pour la sécurité (menaces, fraude, accès non autorisés), l'amélioration de ses produits et les « données générées par le service » ;
  - transferts : Vercel certifié **EU-U.S. Data Privacy Framework** (décision d'adéquation de la Commission du 10 juillet 2023) et clauses contractuelles types ;
  - conservation : journaux consultables par le client **1 heure en Hobby** (1 jour en Pro, docs « Runtime Logs ») ; pour ses propres traitements, Vercel supprime ou anonymise « lorsqu'il n'a plus de besoin légitime », sans durée chiffrée.
- **Choix** :
  - la notice présente Vercel comme **responsable** de ses traitements techniques (selon sa politique), et l'éditeur comme simple consultant des journaux de son site (sans export ni conservation) ; durées (1 heure ; critère de Vercel) ; transferts (DPF et clauses types) ; droits à exercer auprès de Vercel pour ses traitements, auprès de l'éditeur par l'alias pour le reste ; CNIL. **Corrige D30**, qui affirmait la sous-traitance.
  - contact privé : alias Proton Pass vers une boîte Proton, donc traitement par **Proton AG (Suisse, pays reconnu adéquat)** ; messages **supprimés dès que la demande est traitée** (engagement choisi par Deltouille).
  - offre et durée des journaux dans `HEBERGEUR` (`src/lib/projet.mjs`) : **passer en Pro** (ou changer d'hébergeur) impose de revoir la notice.
  - l'adresse e-mail de Vercel n'est pas publiée (la notice renvoie vers sa politique) : le test « une seule adresse e-mail, l'alias » reste strict.
- **SPDX** : `tests/spdx.mjs`, analyseur selon la grammaire SPDX 2.3 (parenthèses, priorité `WITH` > `AND` > `OR`, toutes les branches analysées même quand le résultat est connu) ; toute expression malformée est refusée. `tests/spdx.test.mjs` couvre le cas signalé, les priorités, `WITH`, et neuf expressions malformées. Aucune dépendance actuelle n'était concernée.

## D34 — Rôles non établis dits comme tels ; bases juridiques des traitements de l'éditeur (16 oct. 2026)

- **Contexte** : troisième relecture : (1) D33 déduisait de l'absence de contrat de sous-traitance en Hobby que Vercel était responsable de **tous** les traitements ; or les rôles dépendent des activités réelles, pas seulement du contrat, et l'éditeur consulte lui-même les journaux (lignes directrices 07/2020 du CEPD) ; (2) le traitement des courriels n'avait pas de base juridique, et la section des droits ne couvrait pas explicitement les données traitées par l'éditeur.
- **Choix** : la notice ne conclut plus rien qui ne soit établi. Elle distingue :
  - **Ce que Vercel déclare** : traitements pour son propre compte, comme responsable (sécurité, amélioration de ses produits, données générées par le service), avec son critère de conservation ;
  - **Ce qui n'est pas précisé** : le contrat de sous-traitance ne couvre que Pro et Enterprise ; pour l'offre gratuite, la répartition des rôles pour le simple envoi des pages n'est fixée par aucun contrat et n'a pas été confirmée par Vercel ;
  - **Ce que l'éditeur traite**, avec finalité, base juridique et durée : consultation des journaux (intérêt légitime : fonctionnement et sécurité ; consultables une heure, ni exportés ni conservés) ; messages au contact privé (échanges ordinaires : intérêt légitime de répondre ; demandes d'exercice des droits : obligation légale, articles 12 à 22 du RGPD ; Proton AG, Suisse ; supprimés une fois la demande traitée) ;
  - **Vos droits** : accès, rectification, effacement, limitation et opposition pour les données de l'éditeur, via l'alias ; auprès de Vercel pour ses propres traitements ; CNIL.
- **Test** : sections et bases juridiques présentes ; plus aucune affirmation non établie (« Vercel agit ici comme sous-traitant », « Vercel traite donc ces données comme responsable »).
- **Non fait, possible** : demander à Vercel de confirmer la répartition des rôles pour l'offre Hobby ; la notice serait alors complétée par sa réponse.
- **Point signalé à Deltouille** : l'article 13 du RGPD demande aussi l'identité du responsable de traitement ; l'anonymat permis par la LCEN ne règle pas explicitement cette exigence. Contact fourni (alias) ; la question reste ouverte.

## D35 — Confidentialité : informations pratiques et affirmations circonscrites (16 oct. 2026)

- **Contexte** : Deltouille demande de prendre en charge la page après les relectures. Conserver les faits et engagements confirmés dans D32–D34, sans inventer une réponse de Vercel ni publier d'identité personnelle.
- **Choix** : introduction avec contact privé et mentions légales ; absence de cookies limitée au code du site ; retrait de « aucun service tiers », contradictoire avec l'hébergement ; remplacer « aucun contrat » par la limite constatée du DPA publié, avec lien direct. La répartition des rôles en Hobby reste explicitement non confirmée.
- **Informations pratiques** : source et périmètre de la fenêtre Runtime Logs (distincte des autres conservations de Vercel), stockage du thème sans expiration applicative, caractère facultatif des messages, tickets publics cliquables, délai de réponse aux droits (un mois, prolongation maximale de deux mois motivée dans le premier mois).
- **Sources** : politique Vercel <https://vercel.com/legal/privacy-notice>, DPA <https://vercel.com/legal/dpa>, Runtime Logs <https://vercel.com/docs/logs/runtime>, RGPD articles 12–13 <https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3>.
- **Écarté** : présenter le texte comme une conformité juridique acquise ; déduire la qualification de Vercel de son offre commerciale ; ajouter de nouvelles données personnelles. L'identification du responsable de traitement et la confirmation du rôle de Vercel restent des questions externes ouvertes (D34).
- **Vérifié** : `npm run verify` vert (15 fichiers de tests) ; références et informations ajoutées contrôlées dans le HTML publié ; quatre captures `confidentialite` en clair/sombre, bureau/mobile sur preview, vérifications et axe-core sans violation.

## D36 — Notice courte pour un blog de lecture (16 oct. 2026)

- **Contexte** : Deltouille valide une notice en cinq parties, plus courte et adaptée au blog, après comparaison avec un modèle proposé par Gemini.
- **Choix** : navigation, hébergement, préférences et recherche, contact privé, droits. Suppression des répétitions et du débat sur le DPA dans la page publique ; les questions de rôles en Hobby et d'identification du responsable restent ouvertes dans D34, sans être réputées résolues.
- **Conservé** : traitements techniques et transferts de Vercel avec lien vers sa politique ; fenêtre Runtime Logs distincte de sa conservation globale ; bases juridiques de l'éditeur ; Proton et suppression des messages ; stockage local du thème ; contact et recours CNIL. Aucune garantie de non-profilage ni durée générale de conservation n'est inventée.
- **Écarté** : copier le modèle externe tel quel (« aucun traitement direct », « courtes durées ») ou supprimer les informations pertinentes pour raccourcir davantage.
- **Tests** : cinq sections, informations essentielles, liens et absence de qualifications non établies ; vérification complète et captures de la scène existante.
- **Vérifié** : `npm run verify` vert (15 fichiers de tests), quatre captures bureau/mobile et clair/sombre avec axe-core sans violation. Le comptage des cinq sections porte sur l’article, pas sur le titre du dialogue de recherche du layout.

## D35 — Plus de petits textes au-dessus des titres (16 oct. 2026)

- **Contexte** : Deltouille ne veut plus des « sur-titres » (« À la une », « Suivez votre curiosité »…), hérités du prototype.
- **Choix** : retirés partout où ils précédaient un titre : en-têtes de page (`EnTetePage`) et de section (`EnTeteSection`, prop `surTitre` supprimée), Hero (« Bienvenue, voyageur »), carte « À la une » (thème), carte « premiers pas », bandeau des tags, fenêtre de recherche, page 404, cartes d'articles (nation). **Gardés**, parce qu'ils sont eux-mêmes le titre de leur bloc : « Dans cet article » (sommaire), « L'essentiel en quelques mots » (encadré), « Au fil des histoires » (menu mobile).
- **Informations déplacées plutôt que perdues** : nombre de lectures des pages de tag sous la description (masqué à zéro, la page disant déjà « Aucune lecture ») ; temps de lecture des cartes dans le bas de carte, lisible par les lecteurs d'écran (seul « Découvrir » reste décoratif) ; « erreur 404 » dans la phrase de la page introuvable.
- **Test** : aucun élément `sur-titre` dans les pages publiées, hors des trois titres de bloc permis ; nombre de lectures présent si et seulement si le tag en a.

## D37 — Accueil : plus de machine à écrire (20 oct. 2026)

- **Contexte** : sur mobile, la ligne « Ici, on vous raconte … » changeait de longueur à chaque sujet (une à trois lignes) et faisait sauter les boutons et les chiffres du Hero. La capture d'un iPhone montrait aussi les chiffres à moitié sous la vague : la bannière avait une hauteur fixe (`clamp(37.5rem, 100svh, 68.75rem)`) et le contenu, plus haut que l'écran, débordait vers le bas. Deltouille : « on retire tout ça ».
- **Choix** : ligne retirée en entier, avec tout ce qui ne servait qu'à elle : sujets (`sujetDAccueil`), mélange (`src/lib/aleatoire.mjs`), champ de frontmatter `accroche` (aucun article ne l'utilisait), curseur (`animate-clignote`), bouton pause et ses icônes, scènes `machine-a-ecrire*`. Remplace la partie machine à écrire de D12 et D28 (« à la une » choisi par le contenu reste). La bannière d'accueil passe en **hauteur minimale** : elle s'allonge sur un petit écran au lieu de faire glisser les chiffres sous la vague.
- **Écarté** : réserver la hauteur de la ligne la plus longue (`min-h`) : le texte restait animé, et la hauteur dépendait des titres d'articles et de la largeur d'écran ; tronquer les sujets à une ligne : on perdait le sens des titres.
- **Tests** : l'accueil publié ne contient plus la machine à écrire ; capture `accueil-petit-ecran` (fenêtre 320 × 568) : les chiffres finissent au-dessus de la vague (61 px de marge). Vérification sabotée (hauteur fixe + trois lignes de texte en plus, comme l’ancienne machine à écrire) : échoue, chiffres 83 px sous la vague.
