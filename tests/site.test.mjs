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

test('le CSS publié porte les jetons M3 des deux thèmes', async () => {
  const { readdir } = await import('node:fs/promises');
  const feuilles = (await readdir(path.join(racine, '_astro'))).filter(f => f.endsWith('.css'));
  const css = (await Promise.all(feuilles.map(f => lire(path.join('_astro', f))))).join('');
  assert.match(css, /--primaire:\s*#/);
  assert.match(css, /\[data-theme=["']?dark["']?\]/);
  assert.match(css, /prefers-color-scheme:\s*dark/);
});

test('la planche du système de design reste hors du site publié', async () => {
  assert.ok(!(await existe(path.join(racine, 'demo/index.html'))));
});

test('la mise en page : un seul h1, canonique, Open Graph, lien d’évitement vers <main>', async () => {
  const html = await lire('index.html');
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<link rel="canonical" href="https:\/\/[^"]+\/"/);
  for (const propriete of ['og:title', 'og:description', 'og:url', 'og:image', 'og:locale']) assert.match(html, new RegExp(`property="${propriete}"`), propriete);
  assert.match(html, /<a href="#contenu"[^>]*>Aller au contenu<\/a>/);
  assert.match(html, /<main id="contenu"/);
});

test('le thème est posé dans le <head>, avant le premier rendu', async () => {
  const tete = (await lire('index.html')).split('</head>')[0];
  assert.match(tete, /localStorage\.getItem\('genshin-theme'\)/);
  assert.match(tete, /name="theme-color"[^>]*prefers-color-scheme: dark/);
});

test('la navigation : lien actif signalé, thèmes du registre dans le menu, bouton de thème accessible', async () => {
  const html = await lire('index.html');
  assert.match(html, /<a href="\/"[^>]*aria-current="page"[^>]*>Accueil<\/a>/);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 2, 'Accueil, dans la barre et dans le menu mobile');
  const menuLore = html.split('data-menu-lore')[1].split('</div>')[0];
  for (const theme of ['concepts', 'evenements', 'factions', 'personnages', 'regions']) assert.match(menuLore, new RegExp(`href="/lore/tags/${theme}"`), theme);
  assert.doesNotMatch(menuLore, /href="\/lore\/tags\/quetes"/, 'les quêtes ont leur propre entrée');
  assert.match(html, /<button[^>]*data-bouton-theme[^>]*aria-label="Thème sombre"[^>]*aria-pressed="false"/);
  assert.match(html, /aria-controls="menu-mobile"[^>]*>/);
  assert.match(html, /<div id="menu-mobile"[^>]*hidden/);
});

test('sans bannière, la barre reste dans le flux (sticky) et opaque', async () => {
  const entete = (await lire('index.html')).match(/<header[^>]*data-navbar[^>]*>/)[0];
  assert.match(entete, /\bsticky\b/);
  assert.doesNotMatch(entete, /data-sur-image/);
});

test('les icônes sont des tracés SVG insérés dans le HTML (aucune webfont)', async () => {
  const html = await lire('index.html');
  assert.match(html, /<svg[^>]*viewBox="0 -960 960 960"[^>]*fill="currentColor"/);
  assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/);
});
