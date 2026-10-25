import rss from '@astrojs/rss';

import { bibliotheque, cheminArticle } from '../lib/contenu';
import { NOM } from '../lib/projet.ts';

import type { APIRoute } from 'astro';

// Flux RSS des articles publiés, du plus récent au plus ancien (D50). Annoncé dans le <head> de chaque page.
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Flux RSS : « site » manque dans astro.config.ts');
  const { articles, tag } = await bibliotheque();
  return rss({
    title: NOM,
    description: 'Le lore de Genshin Impact, raconté simplement. Quêtes, personnages et mystères de Teyvat, en français.',
    site,
    trailingSlash: false,
    customData: '<language>fr</language>',
    items: articles.map(article => ({
      title: article.data.titre,
      description: article.data.description,
      link: cheminArticle(article),
      pubDate: article.data.publieLe,
      categories: article.data.tags.map(id => tag(id).data.libelle),
    })),
  });
};
