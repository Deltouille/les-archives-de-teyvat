// Identifiant d'un article = son URL (/lore/<identifiant>). Il vient du NOM DU FICHIER seul : l'organisation en
// dossiers de src/content/articles est libre et déplacer un fichier ne change pas son URL (decisions.md, D21).
// Lu par content.config.ts (generateId), contenu.ts (doublons) et tests/sources.mjs.

/** « mondstadt/Mondstadt-act-I.md » → « mondstadt-act-i » : minuscules, sans accents, tirets. @param {string} chemin */
export const identifiantDe = chemin => chemin
  .split('/').pop()
  .replace(/\.md$/i, '')
  .normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/**
 * Fichiers qui revendiqueraient la même URL (même nom dans deux dossiers).
 * @param {string[]} chemins
 * @returns {{ identifiant: string, chemins: string[] }[]}
 */
export function doublonsDIdentifiants(chemins) {
  const parIdentifiant = new Map();
  for (const chemin of chemins) {
    const id = identifiantDe(chemin);
    parIdentifiant.set(id, [...(parIdentifiant.get(id) ?? []), chemin]);
  }
  return [...parIdentifiant].filter(([, liste]) => liste.length > 1).map(([identifiant, liste]) => ({ identifiant, chemins: liste }));
}

/**
 * Fichiers qui portent le même identifiant que `chemin` (lui excepté). En dev, déplacer un article fait arriver le
 * nouveau chemin puis partir l'ancien : même identifiant, et le départ efface l'article tout juste relu
 * (decisions.md, D25). On relit donc ses homonymes après chaque suppression.
 * @param {string[]} chemins
 * @param {string} chemin
 */
export const homonymes = (chemins, chemin) => chemins.filter(c => c !== chemin && identifiantDe(c) === identifiantDe(chemin));
