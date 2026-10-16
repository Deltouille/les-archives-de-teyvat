// Logiciels libres utilisés par le site, crédités sur /credits (decisions.md, D23).
// `distribue: true` : du code ou des ressources du projet partent chez le visiteur (scripts, CSS, tracés d'icônes) ;
// leur licence (MIT, Apache-2.0) exige alors d'en rappeler le titulaire et la licence. Les autres sont des outils de
// construction, crédités par courtoisie. tests/tiers.test.mjs vérifie chaque entrée contre le paquet installé.

/** @typedef {{ nom: string, paquet: string, licence: keyof typeof TEXTES_LICENCES, titulaire: string, url: string, role: string, distribue: boolean }} Tiers */

export const TEXTES_LICENCES = {
  MIT: 'https://opensource.org/license/mit',
  'Apache-2.0': 'https://www.apache.org/licenses/LICENSE-2.0',
};

/** @type {Tiers[]} */
export const TIERS = [
  { nom: 'Pagefind', paquet: 'pagefind', licence: 'MIT', titulaire: 'Pagefind', url: 'https://pagefind.app/', role: 'moteur de recherche (scripts et index)', distribue: true },
  { nom: 'Material Symbols', paquet: '@material-symbols/svg-400', licence: 'Apache-2.0', titulaire: 'Google', url: 'https://fonts.google.com/icons', role: 'icônes', distribue: true },
  { nom: 'Tailwind CSS', paquet: 'tailwindcss', licence: 'MIT', titulaire: 'Tailwind Labs, Inc.', url: 'https://tailwindcss.com/', role: 'feuille de style', distribue: true },
  { nom: 'Astro', paquet: 'astro', licence: 'MIT', titulaire: 'Fred K. Schott', url: 'https://astro.build/', role: 'construction du site', distribue: false },
  { nom: 'Material Color Utilities', paquet: '@material/material-color-utilities', licence: 'Apache-2.0', titulaire: 'Google LLC', url: 'https://github.com/material-foundation/material-color-utilities', role: 'calcul de la palette de couleurs', distribue: false },
];
