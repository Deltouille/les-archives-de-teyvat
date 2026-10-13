import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validerContenus } from '../src/lib/validation.mjs';

const tags = [
  { id: 'personnages', data: { theme: true, singulier: 'Personnage', icone: 'personne' } },
  { id: 'mondstadt', data: { theme: false } },
];
const images = new Set(['mondstadt', 'teyvat']);
const article = (id, donnees = {}) => ({ id, data: { tags: ['personnages'], image: 'mondstadt', publieLe: new Date('2025-03-15'), ...donnees } });
const valider = (articles, t = tags) => validerContenus(articles, t, images);

test('un article tagué avec au moins un thème, et dont l’image existe, est valide', () => {
  assert.doesNotThrow(() => valider([article('venti', { tags: ['personnages', 'mondstadt'] })]));
});

test('un tag absent de tags.yaml fait échouer le build, en nommant le fichier', () => {
  assert.throws(() => valider([article('venti', { tags: ['personnages', 'mondstad'] })]), /Tag inconnu « mondstad » dans src\/content\/articles\/venti\.md : déclarez-le dans src\/content\/tags\.yaml/);
});

test('un article sans thème est refusé', () => {
  assert.throws(() => valider([article('venti', { tags: ['mondstadt'] })]), /Aucun thème dans src\/content\/articles\/venti\.md/);
});

test('les noms réservés aux pages de tags et aux redirections sont refusés', () => {
  assert.throws(() => valider([article('tags')]), /Nom d’article réservé « tags »/);
  assert.throws(() => valider([article('regions')]), /Nom d’article réservé « regions »/);
});

test('une image absente de src/assets/images est refusée', () => {
  assert.throws(() => valider([article('venti', { image: 'mondstad' })]), /Image inconnue « mondstad » dans src\/content\/articles\/venti\.md : ajoutez src\/assets\/images\/mondstad\.webp/);
});

test('une date de mise à jour antérieure à la publication est refusée', () => {
  assert.throws(() => valider([article('venti', { modifieLe: new Date('2025-03-01') })]), /modifieLe antérieur à publieLe dans src\/content\/articles\/venti\.md/);
  assert.doesNotThrow(() => valider([article('venti', { modifieLe: new Date('2025-04-01') })]));
});

test('un thème doit avoir un singulier et une icône', () => {
  const incomplet = [...tags, { id: 'quetes', data: { theme: true, singulier: 'Quête' } }];
  assert.throws(() => valider([article('venti')], incomplet), /Thème « quetes » incomplet dans src\/content\/tags\.yaml : il lui faut « singulier » et « icone »/);
});

test('les brouillons sont validés comme les autres', () => {
  assert.throws(() => valider([article('venti', { brouillon: true, tags: ['inconnu'] })]), /Tag inconnu « inconnu »/);
});
