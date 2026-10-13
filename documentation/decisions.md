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
