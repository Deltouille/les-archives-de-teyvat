import { test, expect } from 'vitest';

import { articlesPublies, articlesLies, minutesDeLecture, dateFr, rubriqueDe, sujetsDe, ordreDeLecture, episodesVoisins } from '../src/lib/bibliotheque.ts';

interface ArticleDeTest { id: string; data: { publieLe: Date; tags: string[]; brouillon?: boolean; quete?: { serie: string; chapitre: number; acte: number } } }

const article = (id: string, publieLe: string, tags = ['personnages'], brouillon = false): ArticleDeTest => ({ id, data: { publieLe: new Date(publieLe), tags, brouillon } });

test('les listes sont triées du plus récent au plus ancien', () => {
  const liste = articlesPublies([article('a', '2025-01-01'), article('b', '2026-01-01'), article('c', '2025-06-01')], { dev: false });
  expect(liste.map(a => a.id)).toStrictEqual(['b', 'c', 'a']);
});

test('les brouillons sont visibles en dev et absents du build', () => {
  const tous = [article('publie', '2025-01-01'), article('brouillon', '2025-02-01', ['personnages'], true)];
  expect(articlesPublies(tous, { dev: false }).map(a => a.id)).toStrictEqual(['publie']);
  expect(articlesPublies(tous, { dev: true }).map(a => a.id)).toStrictEqual(['brouillon', 'publie']);
});

test('« Pour aller plus loin » : le plus de tags en commun, puis le plus récent', () => {
  const venti = article('venti', '2025-03-15', ['personnages', 'mondstadt', 'anemo']);
  const autres = [
    venti,
    article('mondstadt', '2025-03-10', ['regions', 'mondstadt', 'anemo']),
    article('dvalin', '2025-05-01', ['personnages', 'mondstadt']),
    article('ancien', '2024-01-01', ['personnages', 'mondstadt']),
    article('liyue', '2025-06-01', ['regions', 'liyue']),
  ];
  expect(articlesLies(venti, autres).map(a => a.id)).toStrictEqual(['dvalin', 'mondstadt', 'ancien']);
  expect(articlesLies(venti, autres, 1).map(a => a.id)).toStrictEqual(['dvalin']);
  expect(!articlesLies(venti, autres, 10).some(a => a.id === 'liyue'), 'aucun tag commun : pas lié').toBeTruthy();
});

test('la rubrique d’un article est son tag marqué « rubrique » ; ses sujets, les autres', () => {
  const tags = new Map([['mondstadt', { id: 'mondstadt', data: { rubrique: false } }], ['quetes', { id: 'quetes', data: { rubrique: true } }], ['liyue', { id: 'liyue', data: { rubrique: false } }]]);
  const x = article('x', '2025-01-01', ['mondstadt', 'quetes', 'liyue']);
  expect(rubriqueDe(x, tags).id).toBe('quetes');
  expect(sujetsDe(x, tags).map(t => t.id)).toStrictEqual(['mondstadt', 'liyue']);
});

test('temps de lecture : 200 mots par minute, au moins une minute', () => {
  expect(minutesDeLecture('')).toBe(1);
  expect(minutesDeLecture('mot '.repeat(200))).toBe(1);
  expect(minutesDeLecture('mot '.repeat(201))).toBe(2);
  expect(minutesDeLecture('## Titre\n\nUn **mot** et [un lien](/lore/venti).')).toBe(1);
});

test('les dates s’écrivent à la française, sans décalage de fuseau', () => {
  expect(dateFr(new Date('2025-03-01'))).toBe('1 mars 2025');
  expect(dateFr(new Date('2026-10-13'))).toBe('13 octobre 2026');
});

const episode = (id: string, publieLe: string, chapitre: number, acte: number, serie = 'quete-d-archons'): ArticleDeTest => ({ id, data: { publieLe: new Date(publieLe), tags: ['quetes', serie], quete: { serie, chapitre, acte } } });

test('pages de tag : les épisodes dans l’ordre de l’histoire, puis le reste par date', () => {
  const liste = ordreDeLecture([
    article('recent', '2026-05-01'),
    episode('liyue-1', '2026-03-01', 1, 1),
    episode('prelude', '2026-04-01', 1, 3.5),
    episode('mondstadt-2', '2025-01-01', 0, 2),
    episode('liyue-4', '2026-01-01', 1, 4),
    article('ancien', '2024-01-01'),
    episode('mondstadt-1', '2025-06-01', 0, 1),
  ]);
  expect(liste.map(a => a.id)).toStrictEqual(['mondstadt-1', 'mondstadt-2', 'liyue-1', 'prelude', 'liyue-4', 'recent', 'ancien']);
});

test('épisodes voisins : précédent et suivant dans la même série, rien aux extrémités ni hors série', () => {
  const premier = episode('p1', '2025-01-01', 0, 1);
  const second = episode('p2', '2025-01-01', 0, 2);
  const chapitre = episode('c1', '2025-01-01', 1, 1);
  const autreSerie = episode('autre', '2025-01-01', 0, 1.5, 'quete-legendaire');
  const tous = [chapitre, autreSerie, second, premier, article('libre', '2025-01-01')];
  expect(episodesVoisins(second, tous)).toStrictEqual({ precedent: premier, suivant: chapitre });
  expect(episodesVoisins(premier, tous)).toStrictEqual({ precedent: undefined, suivant: second });
  expect(episodesVoisins(chapitre, tous)).toStrictEqual({ precedent: second, suivant: undefined });
  expect(episodesVoisins(autreSerie, tous)).toStrictEqual({ precedent: undefined, suivant: undefined });
  expect(episodesVoisins(article('libre', '2025-01-01'), tous)).toStrictEqual({});
});
