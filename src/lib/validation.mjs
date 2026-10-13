// Garde-fous du modèle de contenu, exécutés à chaque build (cf. bibliotheque() dans contenu.ts) et testés par
// tests/validation.test.mjs. Chaque erreur nomme le fichier à corriger.
// Ils portent sur tous les articles, brouillons compris : un brouillon mal tagué doit échouer dès le dev.

// /lore/tags est l'index des tags, et /lore/<ancienne catégorie> redirige vers son thème (astro.config.mjs) :
// aucun article ne peut prendre ces noms.
const RESERVES = new Set(['tags', 'teyvat', 'chronologie', 'quetes', 'concepts', 'personnages', 'regions', 'factions', 'evenements']);

/**
 * @param {{ id: string, data: { tags: string[], image: string, publieLe: Date, modifieLe?: Date } }[]} articles
 * @param {{ id: string, data: { theme: boolean, singulier?: string, icone?: string } }[]} tags
 * @param {Set<string>} images noms des .webp de src/assets/images, sans extension
 */
export function validerContenus(articles, tags, images) {
  for (const tag of tags) {
    if (tag.data.theme && (!tag.data.singulier || !tag.data.icone)) {
      throw new Error(`Thème « ${tag.id} » incomplet dans src/content/tags.yaml : il lui faut « singulier » et « icone »`);
    }
  }
  const connus = new Map(tags.map(t => [t.id, t]));
  for (const article of articles) {
    const origine = `src/content/articles/${article.id}.md`;
    const { data } = article;
    if (RESERVES.has(article.id)) throw new Error(`Nom d’article réservé « ${article.id} » : renommez ${origine}`);
    for (const tag of data.tags) {
      if (!connus.has(tag)) throw new Error(`Tag inconnu « ${tag} » dans ${origine} : déclarez-le dans src/content/tags.yaml`);
    }
    if (!data.tags.some(tag => connus.get(tag)?.data.theme)) {
      throw new Error(`Aucun thème dans ${origine} : ajoutez au moins un tag marqué « theme: true » dans tags.yaml`);
    }
    if (!images.has(data.image)) throw new Error(`Image inconnue « ${data.image} » dans ${origine} : ajoutez src/assets/images/${data.image}.webp`);
    if (data.modifieLe && data.modifieLe < data.publieLe) throw new Error(`modifieLe antérieur à publieLe dans ${origine}`);
  }
}
