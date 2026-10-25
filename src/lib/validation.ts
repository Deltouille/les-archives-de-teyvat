// Garde-fous du modèle de contenu, exécutés à chaque build (cf. bibliotheque() dans contenu.ts) et testés par
// tests/validation.test.ts. Chaque erreur nomme le fichier à corriger.
// Ils portent sur tous les articles, brouillons compris : un brouillon mal tagué doit échouer dès le dev.

// /lore/tags est l'index des tags, et plusieurs /lore/<nom> sont des redirections figées : aucun article ne peut
// prendre ces noms (src/lib/redirections.ts).
import { verifierCredit, type Credit } from './credits.ts';
import { imagesDuCorps } from './images.ts';
import { NOMS_RESERVES as RESERVES, TAGS_SUPPRIMES } from './redirections.ts';

export interface ArticleAValider {
  id: string;
  filePath?: string | undefined;
  body?: string | undefined;
  data: { tags: string[]; image: string; publieLe: Date; modifieLe?: Date | undefined; credits?: Credit[]; quete?: { serie: string; chapitre: number; acte: number } | undefined };
}
export interface TagAValider { id: string; data: { rubrique: boolean; singulier?: string | undefined; icone?: string | undefined; famille?: string | undefined } }

function validerTags(tags: TagAValider[]) {
  for (const tag of tags) {
    if (TAGS_SUPPRIMES.includes(tag.id)) throw new Error(`Tag « ${tag.id} » redéclaré dans src/content/tags.yaml alors que son adresse redirige : retirez-le de TAGS_SUPPRIMES (src/lib/redirections.ts)`);
    if (tag.data.rubrique) {
      if (!tag.data.singulier || !tag.data.icone) throw new Error(`Rubrique « ${tag.id} » incomplète dans src/content/tags.yaml : il lui faut « singulier » et « icone »`);
      if (tag.data.famille) throw new Error(`Rubrique « ${tag.id} » avec une famille dans src/content/tags.yaml : seuls les sujets en ont une`);
    } else if (!tag.data.famille) {
      throw new Error(`Sujet « ${tag.id} » sans famille dans src/content/tags.yaml : ajoutez « famille » (lieu, serie, groupe, notion ou selection)`);
    }
  }
}

function validerTagsDeLArticle({ data }: ArticleAValider, origine: string, connus: Map<string, TagAValider>) {
  for (const tag of data.tags) {
    if (!connus.has(tag)) throw new Error(`Tag inconnu « ${tag} » dans ${origine} : déclarez-le dans src/content/tags.yaml`);
  }
  const rubriques = data.tags.filter(tag => connus.get(tag)?.data.rubrique);
  if (rubriques.length === 0) throw new Error(`Aucune rubrique dans ${origine} : ajoutez à « tags » une rubrique (tag marqué « rubrique: true » dans tags.yaml)`);
  if (rubriques.length > 1) throw new Error(`Plusieurs rubriques dans ${origine} (${rubriques.join(', ')}) : gardez-en une seule`);
}

function validerImages(article: ArticleAValider, origine: string, images: Set<string>) {
  const { image } = article.data;
  if (!images.has(image)) throw new Error(`Image inconnue « ${image} » dans ${origine} : ajoutez ${image}.webp sous src/assets/images (dans le dossier de votre choix)`);
  // Images du corps (![texte](<nom>)) : le plugin Markdown signale aussi l'erreur, mais Astro la journalise sans
  // arrêter le build ; c'est ici qu'elle le fait échouer.
  for (const { nom, alt } of imagesDuCorps(article.body ?? '')) {
    if (!images.has(nom)) throw new Error(`Image inconnue « ${nom} » dans le corps de ${origine} : ajoutez ${nom}.webp sous src/assets/images (dans le dossier de votre choix)`);
    if (!alt.trim()) throw new Error(`Image « ${nom} » sans texte alternatif dans ${origine} : écrivez ![description de l'image](${nom})`);
  }
}

/** Place de chaque épisode dans sa série : deux articles au même endroit rendraient l'ordre ambigu. */
function validerPlace({ data }: ArticleAValider, origine: string, places: Map<string, string>) {
  if (!data.quete) return;
  const { serie, chapitre, acte } = data.quete;
  if (!data.tags.includes(serie)) throw new Error(`Série « ${serie} » absente des tags de ${origine} : ajoutez-la à « tags »`);
  const place = `${serie} / chapitre ${chapitre} / acte ${acte}`;
  const occupee = places.get(place);
  if (occupee) throw new Error(`Même place dans la série (${place}) pour ${occupee} et ${origine}`);
  places.set(place, origine);
}

/** `images` : noms des .webp de src/assets/images (sous-dossiers compris), sans dossier ni extension. */
export function validerContenus(articles: ArticleAValider[], tags: TagAValider[], images: Set<string>): void {
  validerTags(tags);
  const connus = new Map(tags.map(t => [t.id, t]));
  const places = new Map<string, string>();
  for (const article of articles) {
    // Chemin réel (les articles peuvent être rangés en sous-dossiers) ; à défaut, chemin à plat.
    const origine = article.filePath ?? `src/content/articles/${article.id}.md`;
    const { data } = article;
    if (RESERVES.has(article.id)) throw new Error(`Nom d’article réservé « ${article.id} » : renommez ${origine}`);
    validerTagsDeLArticle(article, origine, connus);
    validerImages(article, origine, images);
    if (data.modifieLe && data.modifieLe < data.publieLe) throw new Error(`modifieLe antérieur à publieLe dans ${origine}`);
    validerPlace(article, origine, places);
    for (const credit of data.credits ?? []) {
      const refus = verifierCredit(credit);
      if (refus) throw new Error(`Crédit invalide dans ${origine} : ${refus}`);
    }
  }
}
