// Logique pure de la bibliothèque d'articles, testée par tests/bibliotheque.test.mjs.
// contenu.ts l'applique aux collections Astro.

const plusRecentDAbord = (a, b) => b.data.publieLe.getTime() - a.data.publieLe.getTime();

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
