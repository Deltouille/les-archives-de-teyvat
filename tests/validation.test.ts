import { test, expect } from 'vitest';

import { validerContenus, type ArticleAValider, type TagAValider } from '../src/lib/validation.ts';

const tags: TagAValider[] = [
  { id: 'personnages', data: { theme: true, singulier: 'Personnage', icone: 'personne' } },
  { id: 'mondstadt', data: { theme: false } },
];
const images = new Set(['mondstadt', 'teyvat']);
const article = (id: string, donnees: Partial<ArticleAValider['data']> & { brouillon?: boolean } = {}): ArticleAValider => ({ id, data: { tags: ['personnages'], image: 'mondstadt', publieLe: new Date('2025-03-15'), ...donnees } });
const valider = (articles: ArticleAValider[], t = tags) => { validerContenus(articles, t, images); };

test('un tag supprimé (dont l’adresse redirige) ne peut pas être redéclaré', () => {
  expect(() => { valider([article('diluc')], [...tags, { id: 'anemo', data: { theme: false } }]); }).toThrow(/Tag « anemo » redéclaré dans src\/content\/tags\.yaml/);
});

test('un article tagué avec au moins un thème, et dont l’image existe, est valide', () => {
  expect(() => { valider([article('diluc', { tags: ['personnages', 'mondstadt'] })]); }).not.toThrow();
});

test('un tag absent de tags.yaml fait échouer le build, en nommant le fichier', () => {
  expect(() => { valider([article('diluc', { tags: ['personnages', 'mondstad'] })]); }).toThrow(/Tag inconnu « mondstad » dans src\/content\/articles\/diluc\.md : déclarez-le dans src\/content\/tags\.yaml/);
});

test('un article sans thème est refusé', () => {
  expect(() => { valider([article('diluc', { tags: ['mondstadt'] })]); }).toThrow(/Aucun thème dans src\/content\/articles\/diluc\.md/);
});

test('les noms réservés aux pages de tags et aux redirections sont refusés', () => {
  expect(() => { valider([article('tags')]); }).toThrow(/Nom d’article réservé « tags »/);
  expect(() => { valider([article('regions')]); }).toThrow(/Nom d’article réservé « regions »/);
});

test('une image absente de src/assets/images est refusée', () => {
  expect(() => { valider([article('diluc', { image: 'mondstad' })]); }).toThrow(/Image inconnue « mondstad » dans src\/content\/articles\/diluc\.md : ajoutez mondstad\.webp sous src\/assets\/images/);
});

test('une image du corps doit exister et avoir un texte alternatif', () => {
  expect(() => { valider([{ ...article('diluc'), body: 'Texte.\n\n![Le ciel de Teyvat](teyvat)\n\n![](https://exemple.fr/x.png)' }]); }).not.toThrow();
  expect(() => { valider([{ ...article('diluc'), body: '![Le ciel](teyva)' }]); }).toThrow(/Image inconnue « teyva » dans le corps de src\/content\/articles\/diluc\.md/);
  expect(() => { valider([{ ...article('diluc'), body: '![](teyvat)' }]); }).toThrow(/Image « teyvat » sans texte alternatif dans src\/content\/articles\/diluc\.md/);
});

test('une date de mise à jour antérieure à la publication est refusée', () => {
  expect(() => { valider([article('diluc', { modifieLe: new Date('2025-03-01') })]); }).toThrow(/modifieLe antérieur à publieLe dans src\/content\/articles\/diluc\.md/);
  expect(() => { valider([article('diluc', { modifieLe: new Date('2025-04-01') })]); }).not.toThrow();
});

test('un thème doit avoir un singulier et une icône', () => {
  const incomplet = [...tags, { id: 'quetes', data: { theme: true, singulier: 'Quête' } }];
  expect(() => { valider([article('diluc')], incomplet); }).toThrow(/Thème « quetes » incomplet dans src\/content\/tags\.yaml : il lui faut « singulier » et « icone »/);
});

test('les brouillons sont validés comme les autres', () => {
  expect(() => { valider([article('diluc', { brouillon: true, tags: ['inconnu'] })]); }).toThrow(/Tag inconnu « inconnu »/);
});

test('un crédit invalide fait échouer le build, en nommant le fichier', () => {
  const credit = { type: 'wiki' as const, titre: 'Venti', url: 'https://genshin-impact.fandom.com/wiki/Venti', modifications: '' };
  expect(() => { valider([article('diluc', { credits: [credit] })]); }).toThrow(/Crédit invalide dans src\/content\/articles\/diluc\.md : .*modifications/);
  expect(() => { valider([article('diluc', { credits: [{ ...credit, modifications: 'Traduit.' }] })]); }).not.toThrow();
});

test('épisode de quête : sa série doit être un de ses tags, et sa place unique dans la série', () => {
  const quete = (chapitre: number, acte: number) => ({ tags: ['personnages', 'mondstadt'], quete: { serie: 'mondstadt', chapitre, acte } });
  expect(() => { valider([article('acte-1', quete(0, 1)), article('acte-2', quete(0, 2)), article('intermede', quete(0, 1.5))]); }).not.toThrow();
  expect(() => { valider([article('acte-1', { quete: { serie: 'mondstadt', chapitre: 0, acte: 1 } })]); }).toThrow(/Série « mondstadt » absente des tags de src\/content\/articles\/acte-1\.md/);
  expect(() => { valider([article('acte-1', quete(0, 1)), article('doublon', quete(0, 1))]); }).toThrow(/Même place dans la série \(mondstadt \/ chapitre 0 \/ acte 1\) pour src\/content\/articles\/acte-1\.md et src\/content\/articles\/doublon\.md/);
});
