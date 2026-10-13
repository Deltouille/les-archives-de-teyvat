// Tests sur le site généré : lancer `npm run build` avant (ou `npm run verify`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const racine = path.resolve('dist');
const existe = async fichier => { try { return (await stat(fichier)).isFile(); } catch { return false; } };
const lire = fichier => readFile(path.join(racine, fichier), 'utf8');

test('le site est construit', async () => {
  assert.ok(await existe(path.join(racine, 'index.html')), 'dist/index.html absent : lancer npm run build');
});

test('les pages sont en français', async () => {
  assert.match(await lire('index.html'), /<html[^>]*\blang="fr"/);
});

test('le sitemap et l’index de recherche sont générés', async () => {
  for (const fichier of ['sitemap-index.xml', 'pagefind/pagefind.js']) assert.ok(await existe(path.join(racine, fichier)), fichier);
});
