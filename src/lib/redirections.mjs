// Anciennes URL des versions précédentes du site, et leur nouvelle adresse. Listes FIGÉES : elles décrivent ce qui
// a existé et doit continuer de répondre. Ne jamais les dériver du contenu actuel : un article ajouté recevrait une
// redirection depuis une URL qui n'a jamais existé, un article supprimé perdrait la sienne (cf. decisions.md, D14).
// Lu par astro.config.mjs (redirections) et validation.mjs (noms d'articles réservés).

/** Articles du modèle par catégories (/lore/<catégorie>/<article>) → URL à plat. */
const ANCIENS_ARTICLES = { 'regions/mondstadt': 'mondstadt', 'quetes/prologue-mondstadt': 'mondstadt-act-i', 'personnages/venti': 'venti', 'factions/archons': 'archons', 'factions/ordre-abysse': 'ordre-abysse', 'evenements/cataclysme': 'cataclysme' };
/** Anciennes pages de catégorie /lore/<catégorie> → page du thème. */
export const ANCIENNES_CATEGORIES = ['quetes', 'concepts', 'personnages', 'regions', 'factions', 'evenements'];
/** Anciennes pages de tag /tags/<tag>. */
const ANCIENS_TAGS = ['abysse', 'anemo', 'archontes', 'barbatos', 'dvalin', 'elements', 'histoire', 'khaenri-ah', 'liberte', 'mondstadt', 'quete-d-archons', 'teyvat', 'voyageur'];
/** Articles renommés depuis la réécriture : /lore/<ancien nom> → /lore/<nouveau nom>. */
const ARTICLES_RENOMMES = {
  // 14 oct. 2026 : prologue-mondstadt.md → mondstadt/mondstadt-act-I.md (découpage du prologue en actes).
  'prologue-mondstadt': 'mondstadt-act-i',
};
/** Articles supprimés (16 oct. 2026, sans retour prévu) : /lore/<nom> → la page la plus proche (D31). */
const ARTICLES_SUPPRIMES = {
  archons: '/lore/tags/concepts',
  cataclysme: '/lore/tags/evenements',
  mondstadt: '/lore/tags/mondstadt',
  'ordre-abysse': '/lore/tags/factions',
  venti: '/lore/tags/personnages',
};
/** Tags supprimés (16 oct. 2026) : /lore/tags/<tag> → l'index des tags. Lu par la validation, qui interdit de les
 *  redéclarer sans les retirer d'ici (leur adresse est une redirection). */
export const TAGS_SUPPRIMES = ['abysse', 'anemo', 'archontes', 'barbatos', 'dvalin', 'khaenri-ah', 'liberte', 'voyageur'];
/** Autres adresses, dont celles du tout premier site. */
const AUTRES = {
  '/dossiers/commencer': '/lore/tags/premiers-pas',
  '/lore/chronologie': '/lore',
  '/lore/teyvat/mondstadt': '/lore/mondstadt',
  '/lore/teyvat': '/lore/tags/regions',
  '/categories/regions': '/lore/tags/regions',
  '/categories/personnages': '/lore/tags/personnages',
  '/categories/factions': '/lore/tags/factions',
  '/categories/evenements': '/lore/tags/evenements',
};

/** Toutes les redirections, avant résolution des chaînes. */
const BRUTES = {
  ...Object.fromEntries(Object.entries(ANCIENS_ARTICLES).map(([avant, apres]) => [`/lore/${avant}`, `/lore/${apres}`])),
  ...Object.fromEntries(ANCIENNES_CATEGORIES.map(c => [`/lore/${c}`, `/lore/tags/${c}`])),
  ...Object.fromEntries(ANCIENS_TAGS.map(t => [`/tags/${t}`, `/lore/tags/${t}`])),
  ...Object.fromEntries(Object.entries(ARTICLES_RENOMMES).map(([avant, apres]) => [`/lore/${avant}`, `/lore/${apres}`])),
  ...AUTRES,
  ...Object.fromEntries(Object.entries(ARTICLES_SUPPRIMES).map(([avant, apres]) => [`/lore/${avant}`, apres])),
  ...Object.fromEntries(TAGS_SUPPRIMES.map(t => [`/lore/tags/${t}`, '/lore/tags'])),
};

/** Destination finale d'une adresse : on suit les redirections jusqu'à une vraie page (pas de chaîne servie). */
function destination(url, vues = new Set()) {
  if (!(url in BRUTES)) return url;
  if (vues.has(url)) throw new Error(`Boucle de redirections : ${[...vues, url].join(' → ')}`);
  return destination(BRUTES[url], new Set([...vues, url]));
}

/** @type {Record<string, string>} ancienne URL → page finale */
export const REDIRECTIONS = Object.fromEntries(Object.keys(BRUTES).map(url => [url, destination(url)]));

/** Noms qu'aucun article ne peut prendre : /lore/<nom> est déjà une redirection, ou l'index des tags. */
export const NOMS_RESERVES = new Set(['tags', ...Object.keys(REDIRECTIONS).filter(url => /^\/lore\/[^/]+$/.test(url)).map(url => url.slice('/lore/'.length))]);
