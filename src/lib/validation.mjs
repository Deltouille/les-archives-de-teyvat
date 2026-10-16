// Garde-fous du modèle de contenu, exécutés à chaque build (cf. bibliotheque() dans contenu.ts) et testés par
// tests/validation.test.mjs. Chaque erreur nomme le fichier à corriger.
// Ils portent sur tous les articles, brouillons compris : un brouillon mal tagué doit échouer dès le dev.

// /lore/tags est l'index des tags, et plusieurs /lore/<nom> sont des redirections figées : aucun article ne peut
// prendre ces noms (src/lib/redirections.mjs).
import { NOMS_RESERVES as RESERVES, TAGS_SUPPRIMES } from './redirections.mjs';
import { verifierCredit } from './credits.mjs';

/**
 * @param {{ id: string, filePath?: string, data: { tags: string[], image: string, publieLe: Date, modifieLe?: Date, credits?: any[] } }[]} articles
 * @param {{ id: string, data: { theme: boolean, singulier?: string, icone?: string } }[]} tags
 * @param {Set<string>} images noms des .webp de src/assets/images, sans extension
 */
export function validerContenus(articles, tags, images) {
  for (const tag of tags) {
    if (TAGS_SUPPRIMES.includes(tag.id)) throw new Error(`Tag « ${tag.id} » redéclaré dans src/content/tags.yaml alors que son adresse redirige : retirez-le de TAGS_SUPPRIMES (src/lib/redirections.mjs)`);
    if (tag.data.theme && (!tag.data.singulier || !tag.data.icone)) {
      throw new Error(`Thème « ${tag.id} » incomplet dans src/content/tags.yaml : il lui faut « singulier » et « icone »`);
    }
  }
  const connus = new Map(tags.map(t => [t.id, t]));
  for (const article of articles) {
    // Chemin réel (les articles peuvent être rangés en sous-dossiers) ; à défaut, chemin à plat.
    const origine = article.filePath ?? `src/content/articles/${article.id}.md`;
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
    for (const credit of data.credits ?? []) {
      const refus = verifierCredit(credit);
      if (refus) throw new Error(`Crédit invalide dans ${origine} : ${refus}`);
    }
  }
}
