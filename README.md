# L'Histoire de Genshin

Blog statique qui raconte le lore de Genshin Impact, en français. Projet de fans indépendant, non affilié à HoYoverse.

Astro (sortie statique), Tailwind CSS v4, Pagefind pour la recherche. Aucune webfont, aucun service tiers.

## Commandes

| Commande | Action |
| :-- | :-- |
| `npm install` | Installe les dépendances (Node ≥ 22.12) |
| `npm run dev` | Serveur de dev sur `localhost:4321` |
| `npm run build` | Build dans `dist/`, puis index de recherche Pagefind |
| `npm run check` | Vérification des types (`astro check`) |
| `npm test` | Tests (`node --test`) ; ceux de `tests/site.test.mjs` exigent un build |
| `npm run verify` | `check` + `build` + `test` : à faire passer avant chaque commit |
| `npm run preview` | Sert le build localement |

`SITE_URL` remplace l'URL de production (`https://l-histoire-de-genshin-expliquee.vercel.app`) pour les URL canoniques et le sitemap.

## Documentation

- [`documentation/plan-implementation.md`](documentation/plan-implementation.md) : le plan, étape par étape.
- [`documentation/decisions.md`](documentation/decisions.md) : le journal des décisions.
