import { test, expect } from 'vitest';

import { articleALaUne } from '../src/lib/bibliotheque.ts';

const article = (id: string, publieLe: string, autres: { aLaUne?: boolean } = {}) => ({ id, data: { titre: `Titre de ${id}`, publieLe: new Date(publieLe), ...autres } });

test('à la une : l’article marqué aLaUne le plus récent, sinon le plus récent, sinon rien', () => {
  const liste = [article('recent', '2026-01-01'), article('marque-ancien', '2024-01-01', { aLaUne: true }), article('marque', '2025-01-01', { aLaUne: true })];
  expect(articleALaUne(liste)?.id).toBe('marque');
  expect(articleALaUne([article('a', '2024-01-01'), article('b', '2026-01-01')])?.id).toBe('b');
  expect(articleALaUne(liste.slice(0, 0))).toBeUndefined();
});
