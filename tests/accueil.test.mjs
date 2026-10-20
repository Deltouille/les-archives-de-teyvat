import { test } from 'node:test';
import assert from 'node:assert/strict';
import { articleALaUne } from '../src/lib/bibliotheque.mjs';

const article = (id, publieLe, autres = {}) => ({ id, data: { titre: `Titre de ${id}`, publieLe: new Date(publieLe), ...autres } });

test('à la une : l’article marqué aLaUne le plus récent, sinon le plus récent, sinon rien', () => {
  const liste = [article('recent', '2026-01-01'), article('marque-ancien', '2024-01-01', { aLaUne: true }), article('marque', '2025-01-01', { aLaUne: true })];
  assert.equal(articleALaUne(liste).id, 'marque');
  assert.equal(articleALaUne([article('a', '2024-01-01'), article('b', '2026-01-01')]).id, 'b');
  assert.equal(articleALaUne([]), undefined);
});
