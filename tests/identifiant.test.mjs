import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identifiantDe, doublonsDIdentifiants } from '../src/lib/identifiant.mjs';

test('l’identifiant (donc l’URL) vient du nom du fichier seul, pas du dossier', () => {
  assert.equal(identifiantDe('venti.md'), 'venti');
  assert.equal(identifiantDe('mondstadt/mondstadt-act-I.md'), 'mondstadt-act-i');
  assert.equal(identifiantDe('regions/mondstadt/quetes/mondstadt-act-II.md'), 'mondstadt-act-ii');
  assert.equal(identifiantDe('src/content/articles/x/venti.md'), 'venti');
});

test('l’identifiant est un slug d’URL : minuscules, sans accents, tirets', () => {
  assert.equal(identifiantDe('Khaenri’ah, la chute.md'), 'khaenri-ah-la-chute');
  assert.equal(identifiantDe('Événements  du   Prologue.md'), 'evenements-du-prologue');
  assert.equal(identifiantDe('--acte_III--.md'), 'acte-iii');
});

test('deux fichiers qui donneraient la même URL sont signalés, avec leurs chemins', () => {
  assert.deepEqual(doublonsDIdentifiants(['a/venti.md', 'b/venti.md', 'mondstadt.md']), [{ identifiant: 'venti', chemins: ['a/venti.md', 'b/venti.md'] }]);
  assert.deepEqual(doublonsDIdentifiants(['Venti.md', 'personnages/venti.md']).map(d => d.identifiant), ['venti']);
  assert.deepEqual(doublonsDIdentifiants(['venti.md', 'mondstadt.md']), []);
});
