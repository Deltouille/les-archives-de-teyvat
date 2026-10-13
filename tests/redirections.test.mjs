import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REDIRECTIONS, NOMS_RESERVES, ANCIENNES_CATEGORIES } from '../src/lib/redirections.mjs';

test('aucune redirection ne mène à une autre redirection', () => {
  const chaines = Object.entries(REDIRECTIONS).filter(([, cible]) => cible in REDIRECTIONS);
  assert.deepEqual(chaines, []);
});

test('toutes les redirections mènent vers le modèle actuel (/lore…)', () => {
  for (const [avant, apres] of Object.entries(REDIRECTIONS)) assert.match(apres, /^\/lore(\/|$)/, avant);
});

test('les noms réservés couvrent l’index des tags et chaque /lore/<nom> redirigé', () => {
  for (const nom of ['tags', 'chronologie', 'teyvat', ...ANCIENNES_CATEGORIES]) assert.ok(NOMS_RESERVES.has(nom), nom);
  assert.ok(!NOMS_RESERVES.has('venti'), 'un nom d’article ordinaire reste libre');
});
