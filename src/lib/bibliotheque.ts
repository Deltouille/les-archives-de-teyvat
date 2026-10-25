// Logique pure de la bibliothèque d'articles, testée par tests/bibliotheque.test.ts.
// contenu.ts l'applique aux collections Astro.

interface Quete { serie: string; chapitre: number; acte: number }
interface Publie { data: { publieLe: Date } }

const plusRecentDAbord = (a: Publie, b: Publie) => b.data.publieLe.getTime() - a.data.publieLe.getTime();
// Ordre de l'histoire (champ `quete`) : série, puis chapitre, puis acte (décimales permises pour un intermède).
// N'est appliqué qu'à des épisodes (articles avec `quete`).
const ordreDeQuete = (a: { data: { quete?: Quete } }, b: { data: { quete?: Quete } }) => {
  const [x, y] = [a.data.quete, b.data.quete];
  if (!x || !y) return 0;
  return x.serie.localeCompare(y.serie, 'fr') || x.chapitre - y.chapitre || x.acte - y.acte;
};

/** Articles à afficher : les brouillons ne sortent pas du dev. Du plus récent au plus ancien. */
export const articlesPublies = <A extends { data: { publieLe: Date; brouillon?: boolean } }>(articles: A[], { dev }: { dev: boolean }): A[] =>
  articles.filter(a => dev || !a.data.brouillon).sort(plusRecentDAbord);

/** « Pour aller plus loin » : les articles qui partagent le plus de tags, les plus récents d'abord à égalité. */
export function articlesLies<A extends { id: string; data: { publieLe: Date; tags: string[] } }>(article: A, articles: A[], nombre = 3): A[] {
  return articles
    .filter(a => a.id !== article.id)
    .map(a => ({ a, communs: a.data.tags.filter(t => article.data.tags.includes(t)).length }))
    .filter(({ communs }) => communs > 0)
    .sort((x, y) => y.communs - x.communs || plusRecentDAbord(x.a, y.a))
    .slice(0, nombre)
    .map(({ a }) => a);
}

/**
 * La rubrique d'un article, son seul tag marqué « rubrique » : elle donne le badge des cartes, le fil d'Ariane et le
 * filtre de recherche. La validation garantit qu'il y en a exactement une.
 */
export function rubriqueDe<T extends { data: { rubrique: boolean } }>(article: { data: { tags: string[] } }, tagsParId: Map<string, T>): T {
  const rubrique = article.data.tags.map(id => tagsParId.get(id)).find(t => t?.data.rubrique);
  if (!rubrique) throw new Error(`Aucune rubrique parmi les tags « ${article.data.tags.join(', ')} »`);
  return rubrique;
}

/** Les sujets d'un article : ses tags, rubrique exceptée. */
export const sujetsDe = <T extends { data: { rubrique: boolean } }>(article: { data: { tags: string[] } }, tagsParId: Map<string, T>): T[] =>
  article.data.tags.map(id => tagsParId.get(id)).filter((t): t is T => t !== undefined && !t.data.rubrique);

/** Minutes de lecture, à 200 mots par minute, au moins une. */
export const minutesDeLecture = (texte: string) => Math.max(1, Math.ceil(texte.split(/\s+/).filter(Boolean).length / 200));

/** « 13 octobre 2026 ». En UTC : les dates du frontmatter sont des jours, pas des instants. */
export const dateFr = (date: Date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * Article « à la une » : le plus récent des articles marqués `aLaUne`, sinon le plus récent tout court.
 * Aucun article : undefined (la section ne s'affiche pas).
 */
export function articleALaUne<A extends { data: { publieLe: Date; aLaUne?: boolean } }>(articles: A[]): A | undefined {
  const parDate = [...articles].sort(plusRecentDAbord);
  return parDate.find(a => a.data.aLaUne) ?? parDate[0];
}

/**
 * Ordre d'une page de tag : les épisodes de quête d'abord, dans l'ordre de l'histoire, puis les autres articles du plus
 * récent au plus ancien. Les listes de nouveautés (Explorer, accueil) restent par date.
 */
export const ordreDeLecture = <A extends { data: { publieLe: Date; quete?: Quete } }>(articles: A[]): A[] => [
  ...articles.filter(a => a.data.quete).sort(ordreDeQuete),
  ...articles.filter(a => !a.data.quete).sort(plusRecentDAbord),
];

/** Épisodes précédent et suivant d'un article dans sa série (champ `quete`), parmi les articles affichés. */
export function episodesVoisins<A extends { id: string; data: { quete?: Quete } }>(article: A, articles: A[]): { precedent?: A; suivant?: A } {
  const quete = article.data.quete;
  if (!quete) return {};
  const serie = articles.filter(a => a.data.quete?.serie === quete.serie).sort(ordreDeQuete);
  const position = serie.findIndex(a => a.id === article.id);
  return position === -1 ? {} : { precedent: serie[position - 1], suivant: serie[position + 1] };
}
