import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { test, expect } from 'vitest';

import { lireTags } from './sources.ts';
import { PLATEFORMES } from '../src/lib/credits.ts';
import { nomDImage } from '../src/lib/images.ts';
import { DEPOT } from '../src/lib/projet.ts';
import { NOMS_RESERVES } from '../src/lib/redirections.ts';

// La fiche donnée aux agents de rédaction (D40) répète des règles du code : elle doit les suivre.
const fiche = await readFile(path.resolve('documentation/rediger-un-article.md'), 'utf8');
const codes = (texte: string) => [...texte.matchAll(/`([^`]+)`/g)].map(m => m[1]);

test('fiche de rédaction : chaque champ du frontmatter est décrit', async () => {
  const config = await readFile(path.resolve('src/content.config.ts'), 'utf8');
  const schema = config.split('const articles')[1].split('const tags')[0];
  const champs = [...schema.matchAll(/^ {4}(\w+): z\./gm)].map(m => m[1]);
  expect(champs.length > 5, 'champs du schéma trouvés').toBeTruthy();
  const tableau = new Set(fiche.split('## 3.')[1].split('## 4.')[0].match(/^\| `(\w+)` \|/gm)!.map(l => l.slice(3, -3)));
  expect([...tableau].sort()).toStrictEqual(champs.sort());
});

test('fiche de rédaction : noms interdits, thèmes, plateformes et images suivent le code', async () => {
  const interdits = fiche.split('**Interdit**')[1].split('\n')[0];
  expect(codes(interdits).sort()).toStrictEqual([...NOMS_RESERVES].sort());
  const themes = fiche.split('Thèmes actuels :')[1].split('\n')[0];
  expect(codes(themes).sort()).toStrictEqual((await lireTags()).filter(t => t.theme).map(t => t.id).sort());
  const plateformes = fiche.split('`plateforme` doit correspondre')[1].split('\n')[0];
  for (const p of Object.keys(PLATEFORMES)) expect(codes(plateformes).includes(p), p).toBeTruthy();
  const images = new Set((await readdir(path.resolve('src/assets/images'), { recursive: true })).filter(f => f.endsWith('.webp')).map(nomDImage));
  for (const image of codes(fiche.split('Au moment d\'écrire cette fiche :')[1].split('\n')[0])) expect(images.has(image), image).toBeTruthy();
  expect(fiche.includes(DEPOT), 'adresse du dépôt').toBeTruthy();
});
