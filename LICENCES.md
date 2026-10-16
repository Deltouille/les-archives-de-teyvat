# Licences

Ce dépôt réunit trois sortes d'éléments, sous des régimes distincts. Ils sont simplement **réunis** (un « agrégat » au sens de la section 5 de la GNU GPL v3) : la licence de l'un ne s'étend pas aux autres. Dépôt : <https://github.com/Deltouille/les-archives-de-teyvat>. Voir aussi la page [Crédits et licences](https://l-histoire-de-genshin-expliquee.vercel.app/credits) du site.

## 1. Le code : GNU GPL v3 ou ultérieure

Le code du site est un logiciel libre sous licence **GNU General Public License, version 3 ou toute version ultérieure** (SPDX : `GPL-3.0-or-later`). Texte complet : [`LICENSE`](LICENSE).

Cela couvre tout ce qui n'est pas listé aux sections 2 et 3 : composants et pages Astro (balisage et logique), TypeScript et JavaScript, CSS, configuration, scripts, tests et documentation du dépôt.

Copyright © 2026 Deltouille et les contributeurs du projet.

## 2. Les textes : Creative Commons BY-SA 3.0

Les textes destinés aux lecteurs sont sous licence **[Creative Commons Attribution – Partage dans les mêmes conditions 3.0](https://creativecommons.org/licenses/by-sa/3.0/deed.fr)** (CC BY-SA 3.0) :

- les articles, `src/content/articles/` ;
- les libellés et descriptions du registre des tags, `src/content/tags.yaml` ;
- les textes éditoriaux écrits dans les pages et composants (`src/pages/`, `src/components/` : page Crédits, À propos, Confidentialité, accroches de l'accueil…). Dans ces fichiers, le balisage et la logique relèvent du code (section 1), les phrases écrites pour les lecteurs relèvent de cette section.

Certains articles adaptent des pages du [Genshin Impact Wiki](https://genshin-impact.fandom.com/) (Fandom, CC BY-SA 3.0) : chacun le déclare dans son champ `credits`, et le site affiche le lien vers la page d'origine, ses contributeurs et les modifications apportées.

## 3. Les éléments de Genshin Impact : aucune licence libre

Genshin Impact, ses personnages, ses illustrations, ses noms et les autres éléments associés au jeu appartiennent à **HoYoverse** et à leurs titulaires de droits respectifs. Ni la GPL ni la CC BY-SA ne s'y appliquent. En particulier :

- les images de `src/assets/images/` ;
- l'image de partage `public/social.webp`.

Ils sont utilisés dans le cadre d'un projet de fans indépendant, non affilié à HoYoverse. Ne les réutilisez pas sans en avoir le droit.

## 4. Composants tiers présents dans le site publié

Tous sont compatibles avec la GNU GPL v3 :

| Composant | Licence | Rôle |
|---|---|---|
| [Material Symbols](https://fonts.google.com/icons) (Google) | Apache-2.0 | tracés des icônes, insérés dans le HTML |
| [Pagefind](https://pagefind.app/) | MIT | index et scripts de recherche |
| [Astro](https://astro.build/), [Tailwind CSS](https://tailwindcss.com/) | MIT | outils de construction (le CSS produit en découle) |

Les outils de développement (TypeScript, axe-core, Material Color Utilities…) ne sont pas distribués avec le site. Leur compatibilité est tout de même vérifiée par `tests/licences.test.mjs`.
