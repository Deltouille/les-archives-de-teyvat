// Référencement : données structurées schema.org (JSON-LD) et dates de modification des articles (decisions.md, D50).
// Fonctions pures, testées sans build (tests/referencement.test.ts).
import { identifiantDe } from './identifiant.ts';
import { NOM } from './projet.ts';

/** Contenu d'un <script type="application/ld+json"> : « < » échappé, aucun texte (titre, description) ne peut fermer
 *  la balise. */
export const jsonLd = (donnees: object) => JSON.stringify({ '@context': 'https://schema.org', ...donnees }).replace(/</g, '\\u003c');

/** L'éditeur et l'auteur des articles : le site lui-même, jamais une personne (aucune information personnelle, D22). */
export const editeur = (site: URL | string) => ({ '@type': 'Organization', name: NOM, url: new URL('/', site).href });

export const donneesSite = (site: URL | string) => ({ '@type': 'WebSite', name: NOM, url: new URL('/', site).href, inLanguage: 'fr' });

export interface ArticleDecrit { url: string; titre: string; description: string; image: string; publieLe: Date; modifieLe?: Date | undefined; section: string; motsCles: string[]; site: URL | string }

export const donneesArticle = ({ url, titre, description, image, publieLe, modifieLe, section, motsCles, site }: ArticleDecrit) => ({
  '@type': 'BlogPosting',
  headline: titre,
  description,
  image: [image],
  datePublished: publieLe.toISOString(),
  dateModified: (modifieLe ?? publieLe).toISOString(),
  author: editeur(site),
  publisher: editeur(site),
  mainEntityOfPage: url,
  url,
  inLanguage: 'fr',
  articleSection: section,
  keywords: motsCles,
});

/** Fil d'Ariane : la dernière étape, sans lien, est la page elle-même. */
export const donneesFil = (etapes: { libelle: string; href?: string | undefined }[], urlPage: string, site: URL | string) => ({
  '@type': 'BreadcrumbList',
  itemListElement: etapes.map(({ libelle, href }, i) => ({ '@type': 'ListItem', position: i + 1, name: libelle, item: new URL(href ?? urlPage, site).href })),
});

/**
 * Date de dernière modification de chaque article (`modifieLe`, sinon `publieLe`), par identifiant, pour le `lastmod`
 * du sitemap. Lue dans le texte des fichiers : astro.config.ts n'a pas accès aux collections. Les deux dates sont des
 * clés de premier niveau du frontmatter (AAAA-MM-JJ) ; tests/pages.test.ts vérifie l'accord avec les pages générées.
 * `fichier` est relatif à src/content/articles ; renvoie identifiant → AAAA-MM-JJ.
 */
export function datesDeModification(fichiers: { fichier: string; texte: string }[]): Map<string, string> {
  const dates = new Map<string, string>();
  for (const { fichier, texte } of fichiers) {
    const entete = texte.split(/^---\s*$/m)[1] ?? '';
    const date = (nom: string) => (new RegExp(`^${nom}:\\s*["']?(\\d{4}-\\d{2}-\\d{2})`, 'm').exec(entete))?.[1];
    const derniere = date('modifieLe') ?? date('publieLe');
    if (derniere) dates.set(identifiantDe(fichier), derniere);
  }
  return dates;
}
