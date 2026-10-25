// Tests sur le site généré : lancer `npm run build` avant (ou `npm run verify`).
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { test, expect } from 'vitest';

const racine = path.resolve('dist');
const existe = async (fichier: string) => { try { return (await stat(fichier)).isFile(); } catch { return false; } };
const lire = (fichier: string) => readFile(path.join(racine, fichier), 'utf8');

test('le site est construit', async () => {
  expect(await existe(path.join(racine, 'index.html')), 'dist/index.html absent : lancer npm run build').toBeTruthy();
});

test('les pages sont en français', async () => {
  expect(await lire('index.html')).toMatch(/<html[^>]*\blang="fr"/);
});

test('le favicon ICO reprend l’étoile SVG, sans ancien logo de secours', async () => {
  const { default: sharp } = await import('sharp');
  const ico = await readFile(path.join(racine, 'favicon.ico'));
  expect(ico.readUInt16LE(2), 'conteneur ICO').toBe(1);
  expect(ico.readUInt16LE(4), 'une image').toBe(1);
  expect(ico[6]).toBe(32);
  expect(ico[7]).toBe(32);
  const debut = ico.readUInt32LE(18);
  const taille = ico.readUInt32LE(14);
  const pixels = await sharp(ico.subarray(debut, debut + taille)).ensureAlpha().raw().toBuffer();
  const etoile = await sharp(path.join(racine, 'favicon.svg')).resize(32, 32).ensureAlpha().raw().toBuffer();
  expect(pixels).toStrictEqual(etoile);
  const html = await lire('index.html');
  expect(html).toMatch(/href="\/favicon\.ico\?v=2"/);
  expect(html).toMatch(/href="\/favicon\.svg\?v=2" sizes="any"/);
});

test('le sitemap et l’index de recherche sont générés', async () => {
  for (const fichier of ['sitemap-index.xml', 'pagefind/pagefind.js']) expect(await existe(path.join(racine, fichier)), fichier).toBeTruthy();
});

test('le CSS publié porte les jetons M3 des deux thèmes', async () => {
  const { readdir } = await import('node:fs/promises');
  const feuilles = (await readdir(path.join(racine, '_astro'))).filter(f => f.endsWith('.css'));
  const css = (await Promise.all(feuilles.map(f => lire(path.join('_astro', f))))).join('');
  expect(css).toMatch(/--primaire:\s*#/);
  expect(css).toMatch(/\[data-theme=["']?dark["']?\]/);
  expect(css).toMatch(/prefers-color-scheme:\s*dark/);
});

test('la planche du système de design reste hors du site publié', async () => {
  expect(!(await existe(path.join(racine, 'demo/index.html')))).toBeTruthy();
});

test('la mise en page : un seul h1, canonique, Open Graph, lien d’évitement vers <main>', async () => {
  const html = await lire('index.html');
  expect((html.match(/<h1\b/g) ?? []).length).toBe(1);
  expect(html).toMatch(/<link rel="canonical" href="https:\/\/[^"]+\/"/);
  for (const propriete of ['og:title', 'og:description', 'og:url', 'og:image', 'og:locale']) expect(html, propriete).toMatch(new RegExp(`property="${propriete}"`));
  expect(html).toMatch(/<a href="#contenu"[^>]*>Aller au contenu<\/a>/);
  expect(html).toMatch(/<main id="contenu"/);
});

test('le thème est posé dans le <head>, avant le premier rendu', async () => {
  const tete = (await lire('index.html')).split('</head>')[0];
  expect(tete).toMatch(/localStorage\.getItem\('genshin-theme'\)/);
  expect(tete).toMatch(/name="theme-color"[^>]*prefers-color-scheme: dark/);
});

test('la navigation : lien actif signalé, rubriques du registre dans le menu, bouton de thème accessible', async () => {
  const html = await lire('index.html');
  expect(html).toMatch(/<a href="\/"[^>]*aria-current="page"[^>]*>Accueil<\/a>/);
  expect((html.match(/aria-current="page"/g) ?? []).length, 'Accueil, dans la barre et dans le menu mobile').toBe(2);
  const menuLore = html.split('data-menu-lore')[1].split('</div>')[0];
  for (const rubrique of ['quetes', 'personnages', 'bandes-annonces']) expect(menuLore, rubrique).toMatch(new RegExp(`href="/lore/tags/${rubrique}"`));
  expect(menuLore, 'la page des sujets est dans le menu « Le lore »').toMatch(/href="\/lore\/tags"/);
  const barre = html.split('aria-label="Navigation principale"')[1].split('</nav>')[0].replace(/data-menu-lore[\s\S]*?<\/div>/, '');
  expect(menuLore, 'les théories ont leur entrée dans la barre').not.toMatch(/href="\/lore\/tags\/theories"/);
  expect([...barre.matchAll(/href="(\/lore\/tags[^"]*)"/g)].map(m => m[1]), 'seules les théories ont une entrée de premier niveau sous /lore/tags').toStrictEqual(['/lore/tags/theories']);
  // Sur l'index des tags, « Le lore » signale la rubrique (aria-current="true") et l'entrée du menu la page.
  const tags = await lire('lore/tags/index.html');
  expect(tags).toMatch(/<a href="\/lore"[^>]*aria-current="true"[^>]*data-lien-lore/);
  expect(tags.split('data-menu-lore')[1].split('</div>')[0]).toMatch(/<a href="\/lore\/tags"[^>]*aria-current="page"/);
  // Sur la page des théories, c'est l'entrée « Théories » qui est la page courante, pas la rubrique « Le lore ».
  const theories = await lire('lore/tags/theories/index.html');
  expect(theories).toMatch(/<a href="\/lore\/tags\/theories"[^>]*aria-current="page"[^>]*>Théories<\/a>/);
  expect(theories).not.toMatch(/<a href="\/lore"[^>]*aria-current=/);
  expect(html).toMatch(/<button[^>]*data-bouton-theme[^>]*aria-label="Thème sombre"[^>]*aria-pressed="false"/);
  expect(html).toMatch(/aria-controls="menu-mobile"[^>]*>/);
  expect(html).toMatch(/<div id="menu-mobile"[^>]*hidden/);
});

test('sans bannière, la barre reste dans le flux (sticky) et opaque', async () => {
  const entete = /<header[^>]*data-navbar[^>]*>/.exec((await lire('lore/index.html')))![0];
  expect(entete).toMatch(/\bsticky\b/);
  expect(entete).not.toMatch(/data-sur-image/);
});

test('les icônes sont des tracés SVG insérés dans le HTML (aucune webfont)', async () => {
  const html = await lire('index.html');
  expect(html).toMatch(/<svg[^>]*viewBox="0 -960 960 960"[^>]*fill="currentColor"/);
  expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
});
