// Logique pure de la bibliothèque d'articles, testée par tests/bibliotheque.test.mjs.
// contenu.ts l'applique aux collections Astro.

const plusRecentDAbord = (a, b) => b.data.publieLe.getTime() - a.data.publieLe.getTime();
// Ordre de l'histoire (champ `quete`) : série, puis chapitre, puis acte (décimales permises pour un intermède).
const ordreDeQuete = (a, b) => a.data.quete.serie.localeCompare(b.data.quete.serie, 'fr') || a.data.quete.chapitre - b.data.quete.chapitre || a.data.quete.acte - b.data.quete.acte;

/**
 * Articles à afficher : les brouillons ne sortent pas du dev. Du plus récent au plus ancien.
 * @template {{ data: { publieLe: Date, brouillon?: boolean } }} A
 * @param {A[]} articles
 * @param {{ dev: boolean }} options
 * @returns {A[]}
 */
export const articlesPublies = (articles, { dev }) => articles.filter(a => dev || !a.data.brouillon).sort(plusRecentDAbord);

/**
 * « Pour aller plus loin » : les articles qui partagent le plus de tags, les plus récents d'abord à égalité.
 * @template {{ id: string, data: { publieLe: Date, tags: string[] } }} A
 * @param {A} article
 * @param {A[]} articles
 * @returns {A[]}
 */
export function articlesLies(article, articles, nombre = 3) {
  return articles
    .filter(a => a.id !== article.id)
    .map(a => ({ a, communs: a.data.tags.filter(t => article.data.tags.includes(t)).length }))
    .filter(({ communs }) => communs > 0)
    .sort((x, y) => y.communs - x.communs || plusRecentDAbord(x.a, y.a))
    .slice(0, nombre)
    .map(({ a }) => a);
}

/**
 * Le thème principal d'un article est son premier tag-thème : il donne le badge des cartes et le fil d'Ariane.
 * La validation garantit qu'il existe.
 * @template {{ data: { theme: boolean } }} T
 * @param {{ data: { tags: string[] } }} article
 * @param {Map<string, T>} tagsParId
 * @returns {T}
 */
export const themePrincipal = (article, tagsParId) => /** @type {T} */ (article.data.tags.map(id => tagsParId.get(id)).find(t => t?.data.theme));

/** Minutes de lecture, à 200 mots par minute, au moins une. @param {string} texte */
export const minutesDeLecture = texte => Math.max(1, Math.ceil(texte.split(/\s+/).filter(Boolean).length / 200));

/** « 13 octobre 2026 ». En UTC : les dates du frontmatter sont des jours, pas des instants. @param {Date} date */
export const dateFr = date => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * Article « à la une » : le plus récent des articles marqués `aLaUne`, sinon le plus récent tout court.
 * Aucun article : undefined (la section ne s'affiche pas).
 * @template {{ data: { publieLe: Date, aLaUne?: boolean } }} A
 * @param {A[]} articles
 * @returns {A | undefined}
 */
export function articleALaUne(articles) {
  const parDate = [...articles].sort(plusRecentDAbord);
  return parDate.find(a => a.data.aLaUne) ?? parDate[0];
}

/**
 * Ordre d'une page de tag : les épisodes de quête d'abord, dans l'ordre de l'histoire, puis les autres articles du plus
 * récent au plus ancien. Les listes de nouveautés (Explorer, accueil) restent par date.
 * @template {{ data: { publieLe: Date, quete?: { serie: string, chapitre: number, acte: number } } }} A
 * @param {A[]} articles
 * @returns {A[]}
 */
export const ordreDeLecture = articles => [
  ...articles.filter(a => a.data.quete).sort(ordreDeQuete),
  ...articles.filter(a => !a.data.quete).sort(plusRecentDAbord),
];

/**
 * Épisodes précédent et suivant d'un article dans sa série (champ `quete`), parmi les articles affichés.
 * @template {{ id: string, data: { quete?: { serie: string, chapitre: number, acte: number } } }} A
 * @param {A} article
 * @param {A[]} articles
 * @returns {{ precedent?: A, suivant?: A }}
 */
export function episodesVoisins(article, articles) {
  if (!article.data.quete) return {};
  const serie = articles.filter(a => a.data.quete?.serie === article.data.quete.serie).sort(ordreDeQuete);
  const position = serie.findIndex(a => a.id === article.id);
  return position === -1 ? {} : { precedent: serie[position - 1], suivant: serie[position + 1] };
}
