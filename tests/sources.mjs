// Lecture minimale des sources (frontmatter des articles, registre des tags) pour que les tests sur dist/
// comparent le site généré à ce qu'il devrait contenir, sans dépendre d'Astro ni d'un parseur YAML.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DOSSIER_ARTICLES = path.resolve('src/content/articles');

const liste = valeur => valeur.replace(/^\[|\]$/g, '').split(',').map(v => v.trim()).filter(Boolean);

/** Les articles, avec les champs dont les tests ont besoin. */
export async function lireArticles() {
  const fichiers = (await readdir(DOSSIER_ARTICLES)).filter(f => f.endsWith('.md'));
  return Promise.all(fichiers.map(async fichier => {
    const texte = await readFile(path.join(DOSSIER_ARTICLES, fichier), 'utf8');
    const entete = texte.split(/^---$/m)[1];
    const champ = nom => entete.match(new RegExp(`^${nom}:\\s*"?(.+?)"?\\s*$`, 'm'))?.[1];
    const blocListe = nom => (entete.match(new RegExp(`^${nom}:\\s*\\n((?:\\s+-.*\\n?)+)`, 'm'))?.[1] ?? '').split('\n').filter(l => /^\s+-/.test(l));
    return {
      id: fichier.replace(/\.md$/, ''),
      titre: champ('titre'),
      tags: liste(champ('tags') ?? ''),
      brouillon: champ('brouillon') === 'true',
      spoilers: Boolean(champ('spoilers')),
      resume: blocListe('resume').length > 0,
      sources: blocListe('sources').length > 0,
      titres: [...texte.split(/^---$/m).slice(2).join('---').matchAll(/^## (.+)$/gm)].map(m => m[1]),
    };
  }));
}

export const lireArticlesPublies = async () => (await lireArticles()).filter(a => !a.brouillon);

/** Les identifiants du registre, et ceux qui sont des thèmes. */
export async function lireTags() {
  const texte = await readFile(path.resolve('src/content/tags.yaml'), 'utf8');
  const blocs = texte.split(/^(?=[a-z][a-z-]*:\s*$)/m).filter(b => /^[a-z]/.test(b));
  return blocs.map(bloc => ({ id: bloc.match(/^([a-z-]+):/)[1], theme: /^\s+theme:\s*true\s*$/m.test(bloc) }));
}
