// Budgets de poids des pages (lancer `npm run build` avant). Cf. documentation/decisions.md, D15.
// Un budget dépassé n'est pas forcément une erreur : c'est une décision à prendre, puis à consigner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { lireArticlesPublies, articleExemple } from './sources.mjs';

const racine = path.resolve('dist');
const Ko = octets => `${(octets / 1024).toFixed(1)} Ko`;
const PAGES = ['index.html', 'lore/index.html', `lore/${(await articleExemple()).id}/index.html`, 'lore/tags/index.html', 'lore/tags/regions/index.html'];

const BUDGETS = {
  html: 25 * 1024, // par page, compressé
  scriptsEnLigne: 12 * 1024, // JavaScript par page, non compressé
  css: 20 * 1024, // feuille de style, compressée
  image: 400 * 1024, // chaque image affichée (variantes srcset comprises)
  partage: 300 * 1024, // image Open Graph
};

test('HTML : moins de 25 Ko compressés par page', async () => {
  for (const page of PAGES) {
    const taille = gzipSync(await readFile(path.join(racine, page))).length;
    assert.ok(taille < BUDGETS.html, `${page} : ${Ko(taille)}`);
  }
});

test('JavaScript : aucun fichier externe, moins de 12 Ko en ligne par page', async () => {
  for (const page of PAGES) {
    const html = await readFile(path.join(racine, page), 'utf8');
    assert.doesNotMatch(html, /<script[^>]+src=/, `${page} : script externe`);
    const enLigne = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].reduce((total, m) => total + Buffer.byteLength(m[1]), 0);
    assert.ok(enLigne < BUDGETS.scriptsEnLigne, `${page} : ${Ko(enLigne)} de scripts`);
  }
});

test('CSS : une seule feuille, moins de 20 Ko compressés', async () => {
  const feuilles = (await readdir(path.join(racine, '_astro'))).filter(f => f.endsWith('.css'));
  assert.equal(feuilles.length, 1, feuilles.join(', '));
  const taille = gzipSync(await readFile(path.join(racine, '_astro', feuilles[0]))).length;
  assert.ok(taille < BUDGETS.css, Ko(taille));
});

test('images affichées : chaque fichier sous 400 Ko, et jamais l’original', async () => {
  const erreurs = [];
  for (const page of PAGES) {
    const html = await readFile(path.join(racine, page), 'utf8');
    const urls = new Set([...html.matchAll(/(?:src|srcset)="([^"]+)"/g)].flatMap(m => m[1].split(',').map(e => e.trim().split(' ')[0])).filter(u => u.startsWith('/_astro/') && /\.(webp|jpe?g|png|avif)$/.test(u)));
    for (const url of urls) {
      const { size } = await stat(path.join(racine, url));
      if (size > BUDGETS.image) erreurs.push(`${page} → ${url} : ${Ko(size)}`);
    }
  }
  assert.deepEqual(erreurs, []);
});

// Dimensions d'un JPEG : lues dans le segment SOF (0xFFC0 à 0xFFC2).
function dimensionsJpeg(octets) {
  for (let i = 2; i < octets.length;) {
    const marqueur = octets.readUInt16BE(i);
    if (marqueur >= 0xffc0 && marqueur <= 0xffc2) return { largeur: octets.readUInt16BE(i + 7), hauteur: octets.readUInt16BE(i + 5) };
    i += 2 + octets.readUInt16BE(i + 2);
  }
  throw new Error('JPEG sans segment SOF');
}

test('image de partage des articles : JPEG 1200 × 630, moins de 300 Ko', async () => {
  for (const { id } of await lireArticlesPublies()) {
    const html = await readFile(path.join(racine, 'lore', id, 'index.html'), 'utf8');
    const url = new URL(html.match(/property="og:image" content="([^"]+)"/)[1]);
    assert.match(url.pathname, /\.jpg$/, id);
    const octets = await readFile(path.join(racine, url.pathname));
    assert.deepEqual(dimensionsJpeg(octets), { largeur: 1200, hauteur: 630 }, id);
    assert.ok(octets.length < BUDGETS.partage, `${id} : ${Ko(octets.length)}`);
  }
});
