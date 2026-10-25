// Familles de sujets (D53) : chaque tag qui n'est pas une rubrique appartient à une famille, qui le range sur la
// page des sujets (/lore/tags). L'ordre de cet objet est l'ordre d'affichage.

export const FAMILLES = {
  lieu: 'Régions',
  serie: 'Séries',
  groupe: 'Groupes',
  notion: 'Notions',
  selection: 'Sélections',
} as const;

export type Famille = keyof typeof FAMILLES;
export const NOMS_FAMILLES = Object.keys(FAMILLES) as [Famille, ...Famille[]];
