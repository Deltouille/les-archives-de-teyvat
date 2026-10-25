import { test, expect } from 'vitest';

import { lienActif, dansLeLore, pageExacte, trierParLibelle } from '../src/lib/navigation.ts';

test('« Accueil » n’est actif que sur la page d’accueil', () => {
  expect(lienActif('/', '/')).toBeTruthy();
  expect(!lienActif('/lore', '/')).toBeTruthy();
});

test('« Le lore » couvre la bibliothèque et les articles, pas les pages de tags', () => {
  for (const chemin of ['/lore', '/lore/', '/lore/venti', '/lore/venti/']) expect(lienActif(chemin, '/lore'), chemin).toBeTruthy();
  for (const chemin of ['/lore/tags', '/lore/tags/mondstadt', '/', '/a-propos']) expect(!lienActif(chemin, '/lore'), chemin).toBeTruthy();
});

test('« Tags » couvre l’index et les pages de tag, sauf les quêtes qui ont leur entrée', () => {
  for (const chemin of ['/lore/tags', '/lore/tags/', '/lore/tags/mondstadt']) expect(lienActif(chemin, '/lore/tags'), chemin).toBeTruthy();
  expect(!lienActif('/lore/tags/quetes', '/lore/tags')).toBeTruthy();
  expect(!lienActif('/lore/tags/theories', '/lore/tags')).toBeTruthy();
  expect(lienActif('/lore/tags/theories/', '/lore/tags/theories')).toBeTruthy();
  expect(lienActif('/lore/tags/quetes', '/lore/tags/quetes')).toBeTruthy();
  expect(!lienActif('/lore/tags/quetes-secondaires', '/lore/tags'.concat('/quetes'))).toBeTruthy();
});

test('la rubrique « Le lore » de la barre couvre aussi les quêtes et les tags', () => {
  for (const chemin of ['/lore', '/lore/venti', '/lore/tags', '/lore/tags/', '/lore/tags/quetes']) expect(dansLeLore(chemin), chemin).toBeTruthy();
  for (const chemin of ['/', '/a-propos', '/lorem', '/lore/tags/theories', '/lore/tags/theories/']) expect(!dansLeLore(chemin), chemin).toBeTruthy();
});

test('pageExacte ignore la barre finale, pas les sous-pages', () => {
  expect(pageExacte('/lore/tags/', '/lore/tags')).toBeTruthy();
  expect(!pageExacte('/lore/tags/mondstadt', '/lore/tags')).toBeTruthy();
});

test('les autres liens sont actifs sur leur page exacte', () => {
  expect(lienActif('/a-propos/', '/a-propos')).toBeTruthy();
  expect(!lienActif('/a-propos/equipe', '/a-propos')).toBeTruthy();
});

test('les tags se trient par libellé, à la française', () => {
  const tags = ['Événements', 'Personnages', 'Factions', 'Éléments', 'anémo'].map(libelle => ({ data: { libelle } }));
  expect(trierParLibelle(tags).map(t => t.data.libelle)).toStrictEqual(['anémo', 'Éléments', 'Événements', 'Factions', 'Personnages']);
});
