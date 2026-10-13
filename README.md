# L'Histoire de Genshin

Blog statique qui raconte le lore de Genshin Impact, en français. Projet de fans indépendant, non affilié à HoYoverse.

Astro (sortie statique), Tailwind CSS v4 avec un système de design Material 3 généré, Pagefind pour la recherche. Aucune webfont, aucun service tiers.

## Commandes

| Commande | Action |
| :-- | :-- |
| `npm install` | Installe les dépendances (Node ≥ 22.12) |
| `npm run dev` | Serveur de dev sur `localhost:4321` (planche du système de design sur `/demo`) |
| `npm run build` | Build dans `dist/`, puis index de recherche Pagefind |
| `npm run check` | Vérification des types (`astro check`) |
| `npm test` | Tests (`node --test`) ; ceux qui lisent `dist/` exigent un build |
| `npm run verify` | `check` + `build` + `test` : à faire passer avant chaque commit |
| `npm run captures` | Captures d'écran, vérifications interactives et audit d'accessibilité (axe-core) dans Brave headless ; serveur de dev requis, et un build récent pour la recherche |
| `npm run palette` | Régénère `src/styles/palette.css` depuis `scripts/palette.mjs` |
| `npm run vercel` | Régénère `vercel.json` (redirections 301) depuis `src/lib/redirections.mjs` |
| `npm run preview` | Sert le build localement |

## Écrire un article

Un fichier Markdown dans `src/content/articles/` ; son nom donne l'URL (`/lore/<nom>`). Les tags sont déclarés dans `src/content/tags.yaml`, les images sont des `.webp` dans `src/assets/images/`. Le build échoue, en nommant le fichier, si un tag est inconnu, si aucun tag n'est un thème ou si l'image manque. Détails : `CLAUDE.md`, section « Modèle de contenu ».

## Mise en ligne (Vercel)

1. Importer le dépôt dans Vercel : Astro est détecté, et `vercel.json` impose `npm run build` (qui génère aussi l'index de recherche) et le dossier `dist`.
2. Domaine autre que `l-histoire-de-genshin-expliquee.vercel.app` : définir la variable d'environnement `SITE_URL` (URL canoniques, Open Graph, sitemap, `robots.txt`).
3. Après le premier déploiement, vérifier une ancienne adresse (par exemple `/lore/regions/mondstadt`) : elle doit répondre par une redirection 301.

## Documentation

- [`documentation/plan-implementation.md`](documentation/plan-implementation.md) : le plan, étape par étape.
- [`documentation/decisions.md`](documentation/decisions.md) : le journal des décisions.
