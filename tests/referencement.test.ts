// Référencement (D50) : données structurées et dates du sitemap, sans build.
import { test, expect } from 'vitest';

import { NOM } from '../src/lib/projet.ts';
import { datesDeModification, donneesArticle, donneesFil, donneesSite, jsonLd } from '../src/lib/referencement.ts';

const SITE = 'https://exemple.fr';

test('JSON-LD : contexte schema.org, et aucun texte ne peut fermer la balise <script>', () => {
  const texte = jsonLd({ '@type': 'Thing', name: 'Fin </script><script>alert(1)</script>' });
  expect(texte).not.toMatch(/</);
  expect(JSON.parse(texte)).toStrictEqual({ '@context': 'https://schema.org', '@type': 'Thing', name: 'Fin </script><script>alert(1)</script>' });
});

test('article : dates ISO, modification = publication à défaut, auteur et éditeur = le site, jamais une personne', () => {
  const base = { url: `${SITE}/lore/a`, titre: 'T', description: 'D', image: `${SITE}/i.jpg`, publieLe: new Date('2026-10-13'), section: 'Quêtes', motsCles: ['Mondstadt'], site: SITE };
  const article = donneesArticle(base);
  expect(article['@type']).toBe('BlogPosting');
  expect(article.datePublished).toBe('2026-10-13T00:00:00.000Z');
  expect(article.dateModified).toBe(article.datePublished);
  expect(donneesArticle({ ...base, modifieLe: new Date('2026-10-20') }).dateModified).toBe('2026-10-20T00:00:00.000Z');
  for (const role of [article.author, article.publisher]) expect(role).toStrictEqual({ '@type': 'Organization', name: NOM, url: `${SITE}/` });
  expect(JSON.stringify(article)).not.toMatch(/Person/);
});

test('site : nom et adresse racine, en français', () => {
  expect(donneesSite(SITE)).toStrictEqual({ '@type': 'WebSite', name: NOM, url: `${SITE}/`, inLanguage: 'fr' });
});

test('fil d’Ariane : positions à partir de 1, adresses absolues, la dernière étape est la page', () => {
  const fil = donneesFil([{ libelle: 'Accueil', href: '/' }, { libelle: 'Explorer', href: '/lore' }, { libelle: 'Venti' }], `${SITE}/lore/venti`, SITE);
  expect(fil.itemListElement.map(e => [e.position, e.name, e.item])).toStrictEqual([[1, 'Accueil', `${SITE}/`], [2, 'Explorer', `${SITE}/lore`], [3, 'Venti', `${SITE}/lore/venti`]]);
});

test('dates du sitemap : modifieLe l’emporte sur publieLe ; identifiant tiré du seul nom de fichier', () => {
  const dates = datesDeModification([
    { fichier: 'mondstadt/quest/Acte-I.md', texte: '---\ntitre: "A"\npublieLe: 2026-10-13\n---\n\nmodifieLe: 2030-01-01 (dans le corps : ignoré)\n' },
    { fichier: 'b.md', texte: '---\npublieLe: 2026-10-13\nmodifieLe: "2026-10-20"\n---\n' },
    { fichier: 'sans-date.md', texte: '---\ntitre: C\n---\n' },
  ]);
  expect([...dates]).toStrictEqual([['acte-i', '2026-10-13'], ['b', '2026-10-20']]);
});
