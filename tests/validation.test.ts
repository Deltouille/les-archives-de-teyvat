import { test, expect } from 'vitest';

import { validerContenus, type ArticleAValider, type TagAValider } from '../src/lib/validation.ts';

const tags: TagAValider[] = [
  { id: 'personnages', data: { rubrique: true, singulier: 'Personnage', icone: 'personne' } },
  { id: 'theories', data: { rubrique: true, singulier: 'Théorie', icone: 'ampoule' } },
  { id: 'mondstadt', data: { rubrique: false, famille: 'lieu' } },
];
const images = new Set(['mondstadt', 'teyvat']);
const article = (id: string, donnees: Partial<ArticleAValider['data']> & { brouillon?: boolean } = {}): ArticleAValider => ({ id, data: { tags: ['personnages'], image: 'mondstadt', publieLe: new Date('2025-03-15'), ...donnees } });
const valider = (articles: ArticleAValider[], t = tags) => { validerContenus(articles, t, images); };

test('un tag supprimé (dont l’adresse redirige) ne peut pas être redéclaré', () => {
  expect(() => { valider([article('diluc')], [...tags, { id: 'anemo', data: { rubrique: false, famille: 'notion' } }]); }).toThrow(/Tag « anemo » redéclaré dans src\/content\/tags\.yaml/);
});

test('un article avec une rubrique et des sujets, dont l’image existe, est valide', () => {
  expect(() => { valider([article('diluc', { tags: ['personnages', 'mondstadt'] })]); }).not.toThrow();
});

test('un tag absent de tags.yaml fait échouer le build, en nommant le fichier', () => {
  expect(() => { valider([article('diluc', { tags: ['personnages', 'mondstad'] })]); }).toThrow(/Tag inconnu « mondstad » dans src\/content\/articles\/diluc\.md : déclarez-le dans src\/content\/tags\.yaml/);
});

test('un article a exactement une rubrique (D53)', () => {
  expect(() => { valider([article('diluc', { tags: ['mondstadt'] })]); }).toThrow(/Aucune rubrique dans src\/content\/articles\/diluc\.md/);
  expect(() => { valider([article('diluc', { tags: ['personnages', 'theories', 'mondstadt'] })]); }).toThrow(/Plusieurs rubriques dans src\/content\/articles\/diluc\.md \(personnages, theories\)/);
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

test('une rubrique a un singulier et une icône, mais pas de famille', () => {
  const incomplete = [...tags, { id: 'quetes', data: { rubrique: true, singulier: 'Quête' } }];
  expect(() => { valider([article('diluc')], incomplete); }).toThrow(/Rubrique « quetes » incomplète dans src\/content\/tags\.yaml : il lui faut « singulier » et « icone »/);
  const avecFamille = [...tags, { id: 'quetes', data: { rubrique: true, singulier: 'Quête', icone: 'livre', famille: 'serie' } }];
  expect(() => { valider([article('diluc')], avecFamille); }).toThrow(/Rubrique « quetes » avec une famille/);
});

test('un sujet a une famille', () => {
  expect(() => { valider([article('diluc')], [...tags, { id: 'liyue', data: { rubrique: false } }]); }).toThrow(/Sujet « liyue » sans famille dans src\/content\/tags\.yaml/);
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
