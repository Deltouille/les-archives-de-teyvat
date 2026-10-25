// Logiciels libres utilisés par le site, crédités sur /credits (decisions.md, D23).
// `distribue: true` : du code ou des ressources du projet partent chez le visiteur (scripts, CSS, tracés d'icônes) ;
// leur licence (MIT, Apache-2.0) exige alors d'en rappeler le titulaire et la licence. Les autres sont des outils de
// construction, crédités par courtoisie. tests/tiers.test.ts vérifie chaque entrée contre le paquet installé.
// Le texte complet de chaque licence est publié tel quel sur /licences/<slug>.txt, lu au build dans `fichier`
// (chemin du fichier de licence dans le paquet), D30.

export const TEXTES_LICENCES = {
  MIT: 'https://opensource.org/license/mit',
  'Apache-2.0': 'https://www.apache.org/licenses/LICENSE-2.0',
};

export interface Tiers { nom: string; slug: string; paquet: string; fichier: string; licence: keyof typeof TEXTES_LICENCES; titulaire: string; url: string; role: string; distribue: boolean }

export const TIERS: Tiers[] = [
  { nom: 'Pagefind', slug: 'pagefind', paquet: 'pagefind', fichier: 'LICENSE/LICENSE', licence: 'MIT', titulaire: 'Pagefind', url: 'https://pagefind.app/', role: 'moteur de recherche (scripts et index)', distribue: true },
  { nom: 'Material Symbols', slug: 'material-symbols', paquet: '@material-symbols/svg-400', fichier: 'LICENSE', licence: 'Apache-2.0', titulaire: 'Google', url: 'https://fonts.google.com/icons', role: 'icônes', distribue: true },
  { nom: 'Tailwind CSS', slug: 'tailwind-css', paquet: 'tailwindcss', fichier: 'LICENSE', licence: 'MIT', titulaire: 'Tailwind Labs, Inc.', url: 'https://tailwindcss.com/', role: 'feuille de style', distribue: true },
  { nom: 'Astro', slug: 'astro', paquet: 'astro', fichier: 'LICENSE', licence: 'MIT', titulaire: 'Fred K. Schott', url: 'https://astro.build/', role: 'construction du site', distribue: false },
  { nom: 'Material Color Utilities', slug: 'material-color-utilities', paquet: '@material/material-color-utilities', fichier: 'LICENSE', licence: 'Apache-2.0', titulaire: 'Google LLC', url: 'https://github.com/material-foundation/material-color-utilities', role: 'calcul de la palette de couleurs', distribue: false },
];

/** Adresse du texte complet de la licence d'un logiciel, publié avec le site. */
export const cheminLicence = (tiers: Tiers) => `/licences/${tiers.slug}.txt`;
