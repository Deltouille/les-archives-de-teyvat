import { test } from 'node:test';
import assert from 'node:assert/strict';
import { articlesPublies, articlesLies, minutesDeLecture, dateFr, themePrincipal } from '../src/lib/bibliotheque.mjs';

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
