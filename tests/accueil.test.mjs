import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sujetDAccueil, articleALaUne } from '../src/lib/bibliotheque.mjs';
import { melanger } from '../src/lib/aleatoire.mjs';

const article = (id, publieLe, autres = {}) => ({ id, data: { titre: `Titre de ${id}`, publieLe: new Date(publieLe), ...autres } });

test('sujet de la machine à écrire : l’accroche si elle existe, sinon le titre entre guillemets', () => {
  assert.equal(sujetDAccueil(article('archons', '2025-01-01', { accroche: 'les sept Archontes' })), 'les sept Archontes');
  assert.equal(sujetDAccueil(article('venti', '2025-01-01')), '« Titre de venti »');
});

test('à la une : l’article marqué aLaUne le plus récent, sinon le plus récent, sinon rien', () => {
  const liste = [article('recent', '2026-01-01'), article('marque-ancien', '2024-01-01', { aLaUne: true }), article('marque', '2025-01-01', { aLaUne: true })];
  assert.equal(articleALaUne(liste).id, 'marque');
  assert.equal(articleALaUne([article('a', '2024-01-01'), article('b', '2026-01-01')]).id, 'b');
  assert.equal(articleALaUne([]), undefined);
});

test('melanger : une permutation de la liste, sans la modifier, reproductible avec un tirage fixé', () => {
  const liste = ['a', 'b', 'c', 'd', 'e'];
  const tirages = [0.1, 0.9, 0.5, 0.3];
  let i = 0;
  const resultat = melanger(liste, () => tirages[i++ % tirages.length]);
  assert.deepEqual([...resultat].sort(), liste);
  assert.deepEqual(liste, ['a', 'b', 'c', 'd', 'e'], 'la liste d’origine est intacte');
  i = 0;
  assert.deepEqual(melanger(liste, () => tirages[i++ % tirages.length]), resultat, 'même tirage, même ordre');
  assert.deepEqual(melanger([]), []);
});
