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

test('un tag supprimé (dont l’adresse redirige) ne peut pas être redéclaré', () => {
  assert.throws(() => valider([article('diluc')], [...tags, { id: 'anemo', data: { theme: false } }]), /Tag « anemo » redéclaré dans src\/content\/tags\.yaml/);
});

test('un article tagué avec au moins un thème, et dont l’image existe, est valide', () => {
  assert.doesNotThrow(() => valider([article('diluc', { tags: ['personnages', 'mondstadt'] })]));
});

test('un tag absent de tags.yaml fait échouer le build, en nommant le fichier', () => {
  assert.throws(() => valider([article('diluc', { tags: ['personnages', 'mondstad'] })]), /Tag inconnu « mondstad » dans src\/content\/articles\/diluc\.md : déclarez-le dans src\/content\/tags\.yaml/);
});

test('un article sans thème est refusé', () => {
  assert.throws(() => valider([article('diluc', { tags: ['mondstadt'] })]), /Aucun thème dans src\/content\/articles\/diluc\.md/);
});

test('les noms réservés aux pages de tags et aux redirections sont refusés', () => {
  assert.throws(() => valider([article('tags')]), /Nom d’article réservé « tags »/);
  assert.throws(() => valider([article('regions')]), /Nom d’article réservé « regions »/);
});

test('une image absente de src/assets/images est refusée', () => {
  assert.throws(() => valider([article('diluc', { image: 'mondstad' })]), /Image inconnue « mondstad » dans src\/content\/articles\/diluc\.md : ajoutez src\/assets\/images\/mondstad\.webp/);
});

test('une date de mise à jour antérieure à la publication est refusée', () => {
  assert.throws(() => valider([article('diluc', { modifieLe: new Date('2025-03-01') })]), /modifieLe antérieur à publieLe dans src\/content\/articles\/diluc\.md/);
  assert.doesNotThrow(() => valider([article('diluc', { modifieLe: new Date('2025-04-01') })]));
});

test('un thème doit avoir un singulier et une icône', () => {
  const incomplet = [...tags, { id: 'quetes', data: { theme: true, singulier: 'Quête' } }];
  assert.throws(() => valider([article('diluc')], incomplet), /Thème « quetes » incomplet dans src\/content\/tags\.yaml : il lui faut « singulier » et « icone »/);
});

test('les brouillons sont validés comme les autres', () => {
  assert.throws(() => valider([article('diluc', { brouillon: true, tags: ['inconnu'] })]), /Tag inconnu « inconnu »/);
});

test('un crédit invalide fait échouer le build, en nommant le fichier', () => {
  const credit = { type: 'wiki', titre: 'Venti', url: 'https://genshin-impact.fandom.com/wiki/Venti', modifications: '' };
  assert.throws(() => valider([article('diluc', { credits: [credit] })]), /Crédit invalide dans src\/content\/articles\/diluc\.md : .*modifications/);
  assert.doesNotThrow(() => valider([article('diluc', { credits: [{ ...credit, modifications: 'Traduit.' }] })]));
});

test('épisode de quête : sa série doit être un de ses tags, et sa place unique dans la série', () => {
  const quete = (chapitre, acte) => ({ tags: ['personnages', 'mondstadt'], quete: { serie: 'mondstadt', chapitre, acte } });
  assert.doesNotThrow(() => valider([article('acte-1', quete(0, 1)), article('acte-2', quete(0, 2)), article('intermede', quete(0, 1.5))]));
  assert.throws(() => valider([article('acte-1', { quete: { serie: 'mondstadt', chapitre: 0, acte: 1 } })]), /Série « mondstadt » absente des tags de src\/content\/articles\/acte-1\.md/);
  assert.throws(() => valider([article('acte-1', quete(0, 1)), article('doublon', quete(0, 1))]), /Même place dans la série \(mondstadt \/ chapitre 0 \/ acte 1\) pour src\/content\/articles\/acte-1\.md et src\/content\/articles\/doublon\.md/);
});
