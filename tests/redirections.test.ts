import { test, expect } from 'vitest';

import { REDIRECTIONS, NOMS_RESERVES, ANCIENNES_CATEGORIES } from '../src/lib/redirections.ts';

test('aucune redirection ne mène à une autre redirection', () => {
  const chaines = Object.entries(REDIRECTIONS).filter(([, cible]) => cible in REDIRECTIONS);
  expect(chaines).toStrictEqual([]);
});

test('toutes les redirections mènent vers le modèle actuel (/lore…)', () => {
  for (const [avant, apres] of Object.entries(REDIRECTIONS)) expect(apres, avant).toMatch(/^\/lore(\/|$)/);
});

test('les noms réservés couvrent l’index des tags et chaque /lore/<nom> redirigé', () => {
  for (const nom of ['tags', 'chronologie', 'teyvat', ...ANCIENNES_CATEGORIES]) expect(NOMS_RESERVES.has(nom), nom).toBeTruthy();
  expect(!NOMS_RESERVES.has('diluc'), 'un nom d’article ordinaire reste libre').toBeTruthy();
  expect(NOMS_RESERVES.has('venti'), 'un article supprimé et redirigé réserve son nom').toBeTruthy();
});

test('articles et tags supprimés : redirigés vers la page la plus proche, sans chaîne (D31)', () => {
  expect(REDIRECTIONS['/lore/venti']).toBe('/lore/tags/personnages');
  expect(REDIRECTIONS['/lore/mondstadt']).toBe('/lore/tags/mondstadt');
  expect(REDIRECTIONS['/lore/tags/anemo']).toBe('/lore/tags');
  // Les anciennes adresses qui menaient à un article supprimé vont directement à la page finale.
  expect(REDIRECTIONS['/lore/personnages/venti']).toBe('/lore/tags/personnages');
  expect(REDIRECTIONS['/lore/regions/mondstadt']).toBe('/lore/tags/mondstadt');
  expect(REDIRECTIONS['/lore/teyvat/mondstadt']).toBe('/lore/tags/mondstadt');
  expect(REDIRECTIONS['/tags/anemo']).toBe('/lore/tags');
  expect(REDIRECTIONS['/lore/quetes/prologue-mondstadt']).toBe('/lore/mondstadt-act-i');
});
