// Logique pure de `npm run image` (scripts/image.mjs), testée par tests/images.test.mjs.
import { identifiantDe } from './identifiant.mjs';

/** Au-delà, l'image est réduite : la plus grande variante servie fait 2400 px (Banniere.astro). */
export const LARGEUR_MAX = 3840;
/** En deçà, une bannière pleine largeur est agrandie, donc floue, sur un écran d'ordinateur. */
export const LARGEUR_MIN = 1600;

// Une image se désigne par le nom de son fichier seul, sans extension : src/assets/images/<dossiers libres>/<nom>.webp
// se cite « image: <nom> ». Ranger ou déplacer une image ne touche donc à aucun article (decisions.md, D47).

/** « snezhnaya/monomakh.webp » → « monomakh » : le nom du fichier, sans dossier ni extension. @param {string} chemin */
export const nomDImage = chemin => chemin.split('/').pop().replace(/\.webp$/i, '');

/**
 * Images qui porteraient le même nom (même fichier dans deux dossiers) : « image: <nom> » serait ambigu.
 * @param {string[]} chemins
 * @returns {{ nom: string, chemins: string[] }[]}
 */
export function doublonsDImages(chemins) {
  const parNom = new Map();
  for (const chemin of chemins) parNom.set(nomDImage(chemin), [...(parNom.get(nomDImage(chemin)) ?? []), chemin]);
  return [...parNom].filter(([, liste]) => liste.length > 1).map(([nom, liste]) => ({ nom, chemins: liste }));
}

/** Dans le corps d'un article, `![texte](<nom>)` désigne une image par son nom, comme le frontmatter. */
export const estUnNomDImage = url => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(url);

/**
 * Images du site citées dans le texte Markdown d'un article : `![texte](<nom>)`. Les liens d'images externes ou par
 * chemin sont ignorés (le build les traite comme Astro le fait d'ordinaire).
 * @param {string} corps
 * @returns {{ nom: string, alt: string }[]}
 */
export const imagesDuCorps = corps => [...corps.matchAll(/!\[([^\]]*)\]\(\s*([^)\s]+)[^)]*\)/g)]
  .filter(([, , url]) => estUnNomDImage(url))
  .map(([, alt, nom]) => ({ nom, alt }));

/**
 * Chemin relatif qui mène de l'article à l'image `nom`, pour Astro (qui optimise les images locales du Markdown).
 * Lève une erreur nommant l'article si l'image n'existe pas ou n'a pas de texte alternatif.
 * @param {{ article: string, nom: string, alt: string, images: string[] }} p chemins relatifs à la racine du projet
 */
export function cheminDImageDansLArticle({ article, nom, alt, images }) {
  const image = images.find(chemin => nomDImage(chemin) === nom);
  if (!image) throw new Error(`Image inconnue « ${nom} » dans ${article} : ajoutez ${nom}.webp sous src/assets/images (dans le dossier de votre choix)`);
  if (!alt.trim()) throw new Error(`Image « ${nom} » sans texte alternatif dans ${article} : écrivez ![description de l'image](${nom})`);
  const dossier = article.split('/').slice(0, -1);
  const cible = image.split('/');
  let commun = 0;
  while (commun < dossier.length && dossier[commun] === cible[commun]) commun++;
  return [...dossier.slice(commun).map(() => '..'), ...cible.slice(commun)].join('/').replace(/^(?!\.)/, './');
}

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
