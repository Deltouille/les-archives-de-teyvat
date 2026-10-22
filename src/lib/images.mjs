// Logique pure de `npm run image` (scripts/image.mjs), testée par tests/images.test.mjs.
import { identifiantDe } from './identifiant.mjs';

/** Au-delà, l'image est réduite : la plus grande variante servie fait 2400 px (Banniere.astro). */
export const LARGEUR_MAX = 3840;
/** En deçà, une bannière pleine largeur est agrandie, donc floue, sur un écran d'ordinateur. */
export const LARGEUR_MIN = 1600;

/** @param {string} source */
export const estUneUrl = source => /^https?:\/\//i.test(source);

/**
 * Le nom donné à l'image est-il utilisable tel quel dans le frontmatter (`image: <nom>`) ?
 * Renvoie le message d'erreur, ou null.
 * @param {string} nom
 */
export function erreurDeNom(nom) {
  const propre = identifiantDe(nom);
  if (!propre) return 'Nom vide.';
  if (propre !== nom) return `Nom « ${nom} » refusé : minuscules, sans accents, mots séparés par des tirets (par exemple « ${propre} »).`;
  return null;
}

/**
 * Ce qui fera mal rendre l'image en bannière (pleine largeur, recadrée en paysage).
 * @param {{ width?: number, height?: number, hasAlpha?: boolean }} meta
 * @returns {string[]}
 */
export function avertissements({ width = 0, height = 0, hasAlpha = false }) {
  const liste = [];
  if (width < LARGEUR_MIN) liste.push(`Largeur ${width} px, sous ${LARGEUR_MIN} px : la bannière sera floue sur un écran d'ordinateur.`);
  if (height > width) liste.push(`Image en portrait (${width} × ${height}) : la bannière est en paysage, l'image sera fortement recadrée.`);
  if (hasAlpha) liste.push('Fond transparent : la bannière montrera du bleu nuit derrière.');
  return liste;
}
