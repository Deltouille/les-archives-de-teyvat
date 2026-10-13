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
