import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { trierParLibelle } from './navigation.mjs';
import { validerContenus } from './validation.mjs';
import { articlesPublies, themePrincipal } from './bibliotheque.mjs';

export type Article = CollectionEntry<'articles'>;
export type Tag = CollectionEntry<'tags'>;

export const cheminArticle = (article: Article) => `/lore/${article.id}`;
export const cheminTag = (id: string) => `/lore/tags/${id}`;

// Toutes les images, par nom : src/assets/images/<nom>.webp. Astro les optimise à l'usage (<Image />).
const images = Object.fromEntries(
  Object.entries(import.meta.glob<{ default: ImageMetadata }>('../assets/images/*.webp', { eager: true }))
    .map(([chemin, module]) => [chemin.split('/').pop()!.replace(/\.webp$/, ''), module.default]),
);

export function imageDe(nom: string): ImageMetadata {
  const image = images[nom];
  if (!image) throw new Error(`Image inconnue : src/assets/images/${nom}.webp`);
  return image;
}

/** Tous les tags, par ordre alphabétique de libellé, et les thèmes parmi eux. */
export async function registreDesTags() {
  const tags = trierParLibelle(await getCollection('tags'));
  return { tags, themes: tags.filter(t => t.data.theme) };
}

/**
 * Le contenu prêt à afficher, validé : un article mal tagué ou sans image fait échouer le build en nommant son fichier.
 * En production, aucun brouillon ne traverse les props, les pages ou l'index de recherche.
 */
export async function bibliotheque() {
  const [tous, { tags, themes }] = await Promise.all([getCollection('articles'), registreDesTags()]);
  validerContenus(tous, tags, new Set(Object.keys(images)));
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
    themes,
    tag,
    themeDe: (article: Article) => themePrincipal(article, parId),
    avecTag: (id: string) => articles.filter(a => a.data.tags.includes(id)),
  };
}
