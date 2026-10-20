import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { NOMS_RESERVES } from '../src/lib/redirections.mjs';
import { PLATEFORMES } from '../src/lib/credits.mjs';
import { DEPOT } from '../src/lib/projet.mjs';
import { lireTags } from './sources.mjs';

// La fiche donnée aux agents de rédaction (D40) répète des règles du code : elle doit les suivre.
const fiche = await readFile(path.resolve('documentation/rediger-un-article.md'), 'utf8');
const codes = texte => [...texte.matchAll(/`([^`]+)`/g)].map(m => m[1]);

test('fiche de rédaction : chaque champ du frontmatter est décrit', async () => {
  const config = await readFile(path.resolve('src/content.config.ts'), 'utf8');
  const schema = config.split('const articles')[1].split('const tags')[0];
  const champs = [...schema.matchAll(/^ {4}(\w+): z\./gm)].map(m => m[1]);
  assert.ok(champs.length > 5, 'champs du schéma trouvés');
  const tableau = new Set(fiche.split('## 3.')[1].split('## 4.')[0].match(/^\| `(\w+)` \|/gm).map(l => l.slice(3, -3)));
  assert.deepEqual([...tableau].sort(), champs.sort());
});

test('fiche de rédaction : noms interdits, thèmes, plateformes et images suivent le code', async () => {
  const interdits = fiche.split('**Interdit**')[1].split('\n')[0];
  assert.deepEqual(codes(interdits).sort(), [...NOMS_RESERVES].sort());
  const themes = fiche.split('Thèmes actuels :')[1].split('\n')[0];
  assert.deepEqual(codes(themes).sort(), (await lireTags()).filter(t => t.theme).map(t => t.id).sort());
  const plateformes = fiche.split('`plateforme` doit correspondre')[1].split('\n')[0];
  for (const p of Object.keys(PLATEFORMES)) assert.ok(codes(plateformes).includes(p), p);
  const images = new Set((await readdir(path.resolve('src/assets/images'))).map(f => f.replace(/\.webp$/, '')));
  for (const image of codes(fiche.split('Au moment d\'écrire cette fiche :')[1].split('\n')[0])) assert.ok(images.has(image), image);
  assert.ok(fiche.includes(DEPOT), 'adresse du dépôt');
});
