import { test } from 'node:test';
import assert from 'node:assert/strict';
import { articlesPublies, articlesLies, minutesDeLecture, dateFr, themePrincipal, ordreDeLecture, episodesVoisins } from '../src/lib/bibliotheque.mjs';

const article = (id, publieLe, tags = ['personnages'], brouillon = false) => ({ id, data: { publieLe: new Date(publieLe), tags, brouillon } });

test('les listes sont triées du plus récent au plus ancien', () => {
  const liste = articlesPublies([article('a', '2025-01-01'), article('b', '2026-01-01'), article('c', '2025-06-01')], { dev: false });
  assert.deepEqual(liste.map(a => a.id), ['b', 'c', 'a']);
});

test('les brouillons sont visibles en dev et absents du build', () => {
  const tous = [article('publie', '2025-01-01'), article('brouillon', '2025-02-01', ['personnages'], true)];
  assert.deepEqual(articlesPublies(tous, { dev: false }).map(a => a.id), ['publie']);
  assert.deepEqual(articlesPublies(tous, { dev: true }).map(a => a.id), ['brouillon', 'publie']);
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
  assert.deepEqual(articlesLies(venti, autres).map(a => a.id), ['dvalin', 'mondstadt', 'ancien']);
  assert.deepEqual(articlesLies(venti, autres, 1).map(a => a.id), ['dvalin']);
  assert.ok(!articlesLies(venti, autres, 10).some(a => a.id === 'liyue'), 'aucun tag commun : pas lié');
});

test('le thème principal est le premier tag-thème de l’article', () => {
  const tags = new Map([['mondstadt', { id: 'mondstadt', data: { theme: false } }], ['regions', { id: 'regions', data: { theme: true } }], ['concepts', { id: 'concepts', data: { theme: true } }]]);
  assert.equal(themePrincipal(article('x', '2025-01-01', ['mondstadt', 'regions', 'concepts']), tags).id, 'regions');
});

test('temps de lecture : 200 mots par minute, au moins une minute', () => {
  assert.equal(minutesDeLecture(''), 1);
  assert.equal(minutesDeLecture('mot '.repeat(200)), 1);
  assert.equal(minutesDeLecture('mot '.repeat(201)), 2);
  assert.equal(minutesDeLecture('## Titre\n\nUn **mot** et [un lien](/lore/venti).'), 1);
});

test('les dates s’écrivent à la française, sans décalage de fuseau', () => {
  assert.equal(dateFr(new Date('2025-03-01')), '1 mars 2025');
  assert.equal(dateFr(new Date('2026-10-13')), '13 octobre 2026');
});

const episode = (id, publieLe, chapitre, acte, serie = 'quete-d-archons') => ({ id, data: { publieLe: new Date(publieLe), tags: ['quetes', serie], quete: { serie, chapitre, acte } } });

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
  assert.deepEqual(liste.map(a => a.id), ['mondstadt-1', 'mondstadt-2', 'liyue-1', 'prelude', 'liyue-4', 'recent', 'ancien']);
});

test('épisodes voisins : précédent et suivant dans la même série, rien aux extrémités ni hors série', () => {
  const premier = episode('p1', '2025-01-01', 0, 1);
  const second = episode('p2', '2025-01-01', 0, 2);
  const chapitre = episode('c1', '2025-01-01', 1, 1);
  const autreSerie = episode('autre', '2025-01-01', 0, 1.5, 'quete-legendaire');
  const tous = [chapitre, autreSerie, second, premier, article('libre', '2025-01-01')];
  assert.deepEqual(episodesVoisins(second, tous), { precedent: premier, suivant: chapitre });
  assert.deepEqual(episodesVoisins(premier, tous), { precedent: undefined, suivant: second });
  assert.deepEqual(episodesVoisins(chapitre, tous), { precedent: second, suivant: undefined });
  assert.deepEqual(episodesVoisins(autreSerie, tous), { precedent: undefined, suivant: undefined });
  assert.deepEqual(episodesVoisins(article('libre', '2025-01-01'), tous), {});
});
