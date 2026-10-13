import { getCollection, type CollectionEntry } from 'astro:content';
import { trierParLibelle } from './navigation.mjs';

export type Tag = CollectionEntry<'tags'>;

export const cheminTag = (id: string) => `/lore/tags/${id}`;

/** Tous les tags, par ordre alphabétique de libellé, et les thèmes parmi eux. */
export async function registreDesTags() {
  const tags = trierParLibelle(await getCollection('tags'));
  return { tags, themes: tags.filter(t => t.data.theme) };
}
