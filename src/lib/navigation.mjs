// Logique pure de la navigation, testée par tests/navigation.test.mjs.

const sansBarreFinale = chemin => chemin.replace(/\/+$/, '') || '/';
const sous = (chemin, racine) => chemin === racine || chemin.startsWith(`${racine}/`);

export const CHEMIN_QUETES = '/lore/tags/quetes';

/**
 * Le lien `href` est-il celui de la page `chemin` ?
 * « Le lore » couvre la bibliothèque et les articles ; « Tags » l'index et les pages de tag, sauf les quêtes,
 * qui ont leur propre entrée dans la barre.
 * @param {string} chemin
 * @param {string} href
 */
export function lienActif(chemin, href) {
  const page = sansBarreFinale(chemin);
  if (href === '/lore') return sous(page, '/lore') && !sous(page, '/lore/tags');
  if (href === '/lore/tags') return sous(page, '/lore/tags') && page !== CHEMIN_QUETES;
  return page === sansBarreFinale(href);
}

/**
 * Le loader file() ne conserve pas l'ordre du YAML : on trie par libellé, selon l'ordre alphabétique français.
 * @template {{ data: { libelle: string } }} T
 * @param {T[]} tags
 * @returns {T[]}
 */
export const trierParLibelle = tags => [...tags].sort((a, b) => a.data.libelle.localeCompare(b.data.libelle, 'fr', { sensitivity: 'base' }));
