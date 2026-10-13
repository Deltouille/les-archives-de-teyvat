// Anciennes URL des versions précédentes du site, et leur nouvelle adresse. Listes FIGÉES : elles décrivent ce qui
// a existé et doit continuer de répondre. Ne jamais les dériver du contenu actuel : un article ajouté recevrait une
// redirection depuis une URL qui n'a jamais existé, un article supprimé perdrait la sienne (cf. decisions.md, D14).
// Lu par astro.config.mjs (redirections) et validation.mjs (noms d'articles réservés).

/** Articles du modèle par catégories (/lore/<catégorie>/<article>) → URL à plat. */
const ANCIENS_ARTICLES = { 'regions/mondstadt': 'mondstadt', 'quetes/prologue-mondstadt': 'prologue-mondstadt', 'personnages/venti': 'venti', 'factions/archons': 'archons', 'factions/ordre-abysse': 'ordre-abysse', 'evenements/cataclysme': 'cataclysme' };
/** Anciennes pages de catégorie /lore/<catégorie> → page du thème. */
export const ANCIENNES_CATEGORIES = ['quetes', 'concepts', 'personnages', 'regions', 'factions', 'evenements'];
/** Anciennes pages de tag /tags/<tag>. */
const ANCIENS_TAGS = ['abysse', 'anemo', 'archontes', 'barbatos', 'dvalin', 'elements', 'histoire', 'khaenri-ah', 'liberte', 'mondstadt', 'quete-d-archons', 'teyvat', 'voyageur'];
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

/** @type {Record<string, string>} ancienne URL → nouvelle */
export const REDIRECTIONS = {
  ...Object.fromEntries(Object.entries(ANCIENS_ARTICLES).map(([avant, apres]) => [`/lore/${avant}`, `/lore/${apres}`])),
  ...Object.fromEntries(ANCIENNES_CATEGORIES.map(c => [`/lore/${c}`, `/lore/tags/${c}`])),
  ...Object.fromEntries(ANCIENS_TAGS.map(t => [`/tags/${t}`, `/lore/tags/${t}`])),
  ...AUTRES,
};

/** Noms qu'aucun article ne peut prendre : /lore/<nom> est déjà une redirection, ou l'index des tags. */
export const NOMS_RESERVES = new Set(['tags', ...Object.keys(REDIRECTIONS).filter(url => /^\/lore\/[^/]+$/.test(url)).map(url => url.slice('/lore/'.length))]);
