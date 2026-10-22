// Logique pure de la navigation, testée par tests/navigation.test.mjs.

const sansBarreFinale = chemin => chemin.replace(/\/+$/, '') || '/';
const sous = (chemin, racine) => chemin === racine || chemin.startsWith(`${racine}/`);

export const CHEMIN_QUETES = '/lore/tags/quetes';
/** Les théories ont leur propre entrée dans la barre et dans le menu mobile (D46). */
export const CHEMIN_THEORIES = '/lore/tags/theories';

/**
 * Le lien `href` est-il celui de la page `chemin` ?
 * « Le lore » couvre la bibliothèque et les articles ; « Tags » l'index et les pages de tag, sauf les quêtes et
 * les théories, qui ont leur propre entrée dans le menu mobile.
 * @param {string} chemin
 * @param {string} href
 */
export function lienActif(chemin, href) {
  const page = sansBarreFinale(chemin);
  if (href === '/lore') return sous(page, '/lore') && !sous(page, '/lore/tags');
  if (href === '/lore/tags') return sous(page, '/lore/tags') && page !== CHEMIN_QUETES && page !== CHEMIN_THEORIES;
  return pageExacte(chemin, href);
}

/** La page `chemin` est-elle exactement `href` (à la barre finale près) ? */
export const pageExacte = (chemin, href) => sansBarreFinale(chemin) === sansBarreFinale(href);

/**
 * La page est-elle dans la rubrique « Le lore » de la barre (bibliothèque, articles, quêtes, tags) ?
 * La page des théories n'en est pas : elle a sa propre entrée.
 * @param {string} chemin
 */
export const dansLeLore = chemin => sous(sansBarreFinale(chemin), '/lore') && sansBarreFinale(chemin) !== CHEMIN_THEORIES;

/**
 * Le loader file() ne conserve pas l'ordre du YAML : on trie par libellé, selon l'ordre alphabétique français.
 * @template {{ data: { libelle: string } }} T
 * @param {T[]} tags
 * @returns {T[]}
 */
export const trierParLibelle = tags => [...tags].sort((a, b) => a.data.libelle.localeCompare(b.data.libelle, 'fr', { sensitivity: 'base' }));
