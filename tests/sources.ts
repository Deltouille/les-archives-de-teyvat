// Lecture minimale des sources (frontmatter des articles, registre des tags) pour que les tests sur dist/
// comparent le site généré à ce qu'il devrait contenir, sans dépendre d'Astro ni d'un parseur YAML.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { identifiantDe } from '../src/lib/identifiant.ts';

const DOSSIER_ARTICLES = path.resolve('src/content/articles');

const liste = (valeur: string) => valeur.replace(/^\[|\]$/g, '').split(',').map(v => v.trim()).filter(Boolean);

/** Champ quete (série, chapitre, acte), ou undefined. */
function queteDe(entete: string): { serie: string; chapitre: number; acte: number } | undefined {
  const bloc = (/^quete:\s*\n((?:[ \t]+.*(?:\n|$))+)/m.exec(entete))?.[1];
  if (!bloc) return undefined;
  const valeur = (nom: string) => (new RegExp(`^\\s+${nom}:\\s*(\\S+)`, 'm').exec(bloc))?.[1];
  return { serie: valeur('serie') ?? '', chapitre: Number(valeur('chapitre')), acte: Number(valeur('acte')) };
}

/** Les articles, avec les champs dont les tests ont besoin. */
export async function lireArticles() {
  // Récursif : les articles peuvent être rangés en sous-dossiers.
  const fichiers = (await readdir(DOSSIER_ARTICLES, { recursive: true })).filter(f => f.endsWith('.md'));
  return Promise.all(fichiers.map(async fichier => {
    const texte = await readFile(path.join(DOSSIER_ARTICLES, fichier), 'utf8');
    const entete = texte.split(/^---$/m)[1] ?? '';
    const champ = (nom: string) => (new RegExp(`^${nom}:\\s*"?(.+?)"?\\s*$`, 'm').exec(entete))?.[1];
    const blocListe = (nom: string) => ((new RegExp(`^${nom}:\\s*\\n((?:\\s+-.*\\n?)+)`, 'm').exec(entete))?.[1] ?? '').split('\n').filter(l => /^\s+-/.test(l));
    return {
      id: identifiantDe(fichier),
      titre: champ('titre') ?? '',
      tags: liste(champ('tags') ?? ''),
      brouillon: champ('brouillon') === 'true',
      aLaUne: champ('aLaUne') === 'true',
      publieLe: champ('publieLe') ?? '',
      spoilers: Boolean(champ('spoilers')),
      resume: blocListe('resume').length > 0,
      sources: blocListe('sources').length > 0,
      // Crédits : nombre d'entrées de chaque type (champ credits).
      creditsWiki: (entete.match(/^\s+(?:-\s+)?type:\s*wiki\s*$/gm) ?? []).length,
      creditsCommunaute: (entete.match(/^\s+(?:-\s+)?type:\s*communaute\s*$/gm) ?? []).length,
      quete: queteDe(entete),
      titres: [...texte.split(/^---$/m).slice(2).join('---').matchAll(/^## (.+)$/gm)].map(m => m[1]),
    };
  }));
}

export type ArticleSource = Awaited<ReturnType<typeof lireArticles>>[number];

export const lireArticlesPublies = async () => (await lireArticles()).filter(a => !a.brouillon);

/** Les identifiants du registre, et ceux qui sont des rubriques. */
export async function lireTags() {
  const texte = await readFile(path.resolve('src/content/tags.yaml'), 'utf8');
  const blocs = texte.split(/^(?=[a-z][a-z-]*:\s*$)/m).filter(b => /^[a-z]/.test(b));
  return blocs.map(bloc => ({ id: /^([a-z-]+):/.exec(bloc)?.[1] ?? '', rubrique: /^\s+rubrique:\s*true\s*$/m.test(bloc) }));
}

/** Article de référence pour les tests et les captures : l'acte I du prologue de Mondstadt, choisi par Deltouille comme
 *  contenu qui ne changera pas. S'il disparaissait, on prend le publié qui a le plus de sections (D30, D31). */
export const ARTICLE_DE_REFERENCE = 'mondstadt-act-i';
export async function articleExemple() {
  const articles = await lireArticlesPublies();
  if (!articles.length) throw new Error('Aucun article publié : impossible de choisir un article d’exemple');
  return articles.find(a => a.id === ARTICLE_DE_REFERENCE) ?? [...articles].sort((a, b) => b.titres.length - a.titres.length || a.id.localeCompare(b.id))[0];
}
