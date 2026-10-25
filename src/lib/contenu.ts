import { getCollection, type CollectionEntry } from 'astro:content';

import { articlesPublies, rubriqueDe, sujetsDe } from './bibliotheque.ts';
import { doublonsDIdentifiants } from './identifiant.ts';
import { doublonsDImages, nomDImage } from './images.ts';
import { trierParLibelle } from './navigation.ts';
import { validerContenus } from './validation.ts';

import type { ImageMetadata } from 'astro';

// Chemins de tous les fichiers d'articles, pour repérer deux fichiers de même nom dans deux dossiers : ils voudraient
// la même URL, et le chargeur de contenu garderait l'un en écrasant l'autre sans erreur.
const FICHIERS_ARTICLES = Object.keys(import.meta.glob('../content/articles/**/*.md')).map(c => c.replace(/^\.\.\//, 'src/'));

export type Article = CollectionEntry<'articles'>;
export type Tag = CollectionEntry<'tags'>;

export const cheminArticle = (article: Article) => `/lore/${article.id}`;
export const cheminTag = (id: string) => `/lore/tags/${id}`;
/** Nom de View Transition d'un article : porté en permanence par la bannière de l'article, et donné à sa carte
 *  (data-transition) au seul moment où l'on part vers l'article ou en revient (script de Site.astro). Un nom doit
 *  rester unique sur une page, sinon le navigateur abandonne toute la transition. */
export const transitionImage = (article: Article) => `image-${article.id}`;

// Toutes les images, par nom de fichier : src/assets/images/<dossiers libres>/<nom>.webp. Comme pour les articles,
// le dossier ne compte pas. Astro les optimise à l'usage (<Image />).
const modulesImages = import.meta.glob<{ default: ImageMetadata }>('../assets/images/**/*.webp', { eager: true });
const FICHIERS_IMAGES = Object.keys(modulesImages).map(c => c.replace(/^\.\.\//, 'src/'));
const images = new Map(Object.entries(modulesImages).map(([chemin, module]) => [nomDImage(chemin), module.default]));

export function imageDe(nom: string): ImageMetadata {
  const image = images.get(nom);
  if (!image) throw new Error(`Image inconnue : aucun fichier ${nom}.webp sous src/assets/images`);
  return image;
}

/** Tous les tags, par ordre alphabétique de libellé : les rubriques d'un côté, les sujets de l'autre (D53). */
export async function registreDesTags() {
  const tags = trierParLibelle(await getCollection('tags'));
  return { tags, rubriques: tags.filter(t => t.data.rubrique), sujets: tags.filter(t => !t.data.rubrique) };
}

/**
 * Le contenu prêt à afficher, validé : un article mal tagué ou sans image fait échouer le build en nommant son fichier.
 * En production, aucun brouillon ne traverse les props, les pages ou l'index de recherche.
 */
export async function bibliotheque() {
  const [tous, { tags, rubriques, sujets }] = await Promise.all([getCollection('articles'), registreDesTags()]);
  const doublons = doublonsDIdentifiants(FICHIERS_ARTICLES);
  if (doublons.length) throw new Error(doublons.map(d => `Même URL /lore/${d.identifiant} pour ${d.chemins.join(' et ')} : renommez l'un des fichiers`).join('\n'));
  const memesImages = doublonsDImages(FICHIERS_IMAGES);
  if (memesImages.length) throw new Error(memesImages.map(d => `Même image « ${d.nom} » pour ${d.chemins.join(' et ')} : renommez l'un des fichiers`).join('\n'));
  validerContenus(tous, tags, new Set(images.keys()));
  const articles = articlesPublies(tous, { dev: import.meta.env.DEV });
  const parId = new Map(tags.map(t => [t.id, t]));
  const tag = (id: string) => {
    const trouve = parId.get(id);
    if (!trouve) throw new Error(`Tag inconnu « ${id} » : déclarez-le dans src/content/tags.yaml`);
    return trouve;
  };
  return {
    articles,
    tags,
    rubriques,
    sujets,
    tag,
    rubriqueDe: (article: Article) => rubriqueDe(article, parId),
    sujetsDe: (article: Article) => sujetsDe(article, parId),
    avecTag: (id: string) => articles.filter(a => a.data.tags.includes(id)),
  };
}
