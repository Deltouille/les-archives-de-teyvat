import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lienActif, trierParLibelle } from '../src/lib/navigation.mjs';

test('« Accueil » n’est actif que sur la page d’accueil', () => {
  assert.ok(lienActif('/', '/'));
  assert.ok(!lienActif('/lore', '/'));
});

test('« Le lore » couvre la bibliothèque et les articles, pas les pages de tags', () => {
  for (const chemin of ['/lore', '/lore/', '/lore/venti', '/lore/venti/']) assert.ok(lienActif(chemin, '/lore'), chemin);
  for (const chemin of ['/lore/tags', '/lore/tags/mondstadt', '/', '/a-propos']) assert.ok(!lienActif(chemin, '/lore'), chemin);
});

test('« Tags » couvre l’index et les pages de tag, sauf les quêtes qui ont leur entrée', () => {
  for (const chemin of ['/lore/tags', '/lore/tags/', '/lore/tags/mondstadt']) assert.ok(lienActif(chemin, '/lore/tags'), chemin);
  assert.ok(!lienActif('/lore/tags/quetes', '/lore/tags'));
  assert.ok(lienActif('/lore/tags/quetes', '/lore/tags/quetes'));
  assert.ok(!lienActif('/lore/tags/quetes-secondaires', '/lore/tags'.concat('/quetes')));
});

test('les autres liens sont actifs sur leur page exacte', () => {
  assert.ok(lienActif('/a-propos/', '/a-propos'));
  assert.ok(!lienActif('/a-propos/equipe', '/a-propos'));
});

test('les tags se trient par libellé, à la française', () => {
  const tags = ['Événements', 'Personnages', 'Factions', 'Éléments', 'anémo'].map(libelle => ({ data: { libelle } }));
  assert.deepEqual(trierParLibelle(tags).map(t => t.data.libelle), ['anémo', 'Éléments', 'Événements', 'Factions', 'Personnages']);
});
