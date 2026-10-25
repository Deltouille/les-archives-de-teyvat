// Logique pure de la navigation, testée par tests/navigation.test.ts.

const sansBarreFinale = (chemin: string) => chemin.replace(/\/+$/, '') || '/';
const sous = (chemin: string, racine: string) => chemin === racine || chemin.startsWith(`${racine}/`);

export const CHEMIN_QUETES = '/lore/tags/quetes';
/** Les théories ont leur propre entrée dans la barre et dans le menu mobile (D46). */
export const CHEMIN_THEORIES = '/lore/tags/theories';

/**
 * Le lien `href` est-il celui de la page `chemin` ?
 * « Le lore » couvre la bibliothèque et les articles ; « Tags » l'index et les pages de tag, sauf les quêtes et
 * les théories, qui ont leur propre entrée dans le menu mobile.
 */
export function lienActif(chemin: string, href: string): boolean {
  const page = sansBarreFinale(chemin);
  if (href === '/lore') return sous(page, '/lore') && !sous(page, '/lore/tags');
  if (href === '/lore/tags') return sous(page, '/lore/tags') && page !== CHEMIN_QUETES && page !== CHEMIN_THEORIES;
  return pageExacte(chemin, href);
}

/** La page `chemin` est-elle exactement `href` (à la barre finale près) ? */
export const pageExacte = (chemin: string, href: string) => sansBarreFinale(chemin) === sansBarreFinale(href);

/**
 * La page est-elle dans la rubrique « Le lore » de la barre (bibliothèque, articles, quêtes, tags) ?
 * La page des théories n'en est pas : elle a sa propre entrée.
 */
export const dansLeLore = (chemin: string) => sous(sansBarreFinale(chemin), '/lore') && sansBarreFinale(chemin) !== CHEMIN_THEORIES;

/** Le loader file() ne conserve pas l'ordre du YAML : on trie par libellé, selon l'ordre alphabétique français. */
export const trierParLibelle = <T extends { data: { libelle: string } }>(tags: T[]): T[] => [...tags].sort((a, b) => a.data.libelle.localeCompare(b.data.libelle, 'fr', { sensitivity: 'base' }));
