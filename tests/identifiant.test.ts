import { test, expect } from 'vitest';

import { identifiantDe, doublonsDIdentifiants, homonymes } from '../src/lib/identifiant.ts';

test('l’identifiant (donc l’URL) vient du nom du fichier seul, pas du dossier', () => {
  expect(identifiantDe('venti.md')).toBe('venti');
  expect(identifiantDe('mondstadt/mondstadt-act-I.md')).toBe('mondstadt-act-i');
  expect(identifiantDe('regions/mondstadt/quetes/mondstadt-act-II.md')).toBe('mondstadt-act-ii');
  expect(identifiantDe('src/content/articles/x/venti.md')).toBe('venti');
});

test('l’identifiant est un slug d’URL : minuscules, sans accents, tirets', () => {
  expect(identifiantDe('Khaenri’ah, la chute.md')).toBe('khaenri-ah-la-chute');
  expect(identifiantDe('Événements  du   Prologue.md')).toBe('evenements-du-prologue');
  expect(identifiantDe('--acte_III--.md')).toBe('acte-iii');
});

test('deux fichiers qui donneraient la même URL sont signalés, avec leurs chemins', () => {
  expect(doublonsDIdentifiants(['a/venti.md', 'b/venti.md', 'mondstadt.md'])).toStrictEqual([{ identifiant: 'venti', chemins: ['a/venti.md', 'b/venti.md'] }]);
  expect(doublonsDIdentifiants(['Venti.md', 'personnages/venti.md']).map(d => d.identifiant)).toStrictEqual(['venti']);
  expect(doublonsDIdentifiants(['venti.md', 'mondstadt.md'])).toStrictEqual([]);
});

test('homonymes : les autres fichiers du même identifiant (article déplacé en dev)', () => {
  const fichiers = ['mondstadt/quest/mondstadt-act-I.md', 'venti.md', 'mondstadt/quest/mondstadt-act-II.md'];
  expect(homonymes(fichiers, 'mondstadt/mondstadt-act-I.md')).toStrictEqual(['mondstadt/quest/mondstadt-act-I.md']);
  expect(homonymes(fichiers, 'venti.md')).toStrictEqual([]);
  expect(homonymes(fichiers, 'supprime.md')).toStrictEqual([]);
});
