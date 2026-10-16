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
  assert.ok(!NOMS_RESERVES.has('diluc'), 'un nom d’article ordinaire reste libre');
  assert.ok(NOMS_RESERVES.has('venti'), 'un article supprimé et redirigé réserve son nom');
});

test('articles et tags supprimés : redirigés vers la page la plus proche, sans chaîne (D31)', () => {
  assert.equal(REDIRECTIONS['/lore/venti'], '/lore/tags/personnages');
  assert.equal(REDIRECTIONS['/lore/mondstadt'], '/lore/tags/mondstadt');
  assert.equal(REDIRECTIONS['/lore/tags/anemo'], '/lore/tags');
  // Les anciennes adresses qui menaient à un article supprimé vont directement à la page finale.
  assert.equal(REDIRECTIONS['/lore/personnages/venti'], '/lore/tags/personnages');
  assert.equal(REDIRECTIONS['/lore/regions/mondstadt'], '/lore/tags/mondstadt');
  assert.equal(REDIRECTIONS['/lore/teyvat/mondstadt'], '/lore/tags/mondstadt');
  assert.equal(REDIRECTIONS['/tags/anemo'], '/lore/tags');
  assert.equal(REDIRECTIONS['/lore/quetes/prologue-mondstadt'], '/lore/mondstadt-act-i');
});
