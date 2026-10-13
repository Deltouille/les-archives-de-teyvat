// Tests sur les pages générées (lancer `npm run build` avant) : liens, articles, tags, pages éditoriales.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { lireArticlesPublies, lireTags } from './sources.mjs';

const racine = path.resolve('dist');
const existe = async fichier => { try { return (await stat(fichier)).isFile(); } catch { return false; } };
const lire = fichier => readFile(path.join(racine, fichier), 'utf8');
async function fichiers(dossier) {
  const entrees = await readdir(dossier, { withFileTypes: true });
  return (await Promise.all(entrees.map(e => (e.isDirectory() ? fichiers(path.join(dossier, e.name)) : path.join(dossier, e.name))))).flat();
}
const pages = (await fichiers(racine)).filter(f => f.endsWith('.html'));
const articles = await lireArticlesPublies();
const tags = await lireTags();
const cartes = html => (html.match(/<article\b[^>]*rounded-carte/g) ?? []).length;

test('chaque lien interne et chaque ancre du HTML généré a une cible', async () => {
  const erreurs = [];
  for (const fichier of pages) {
    const html = await readFile(fichier, 'utf8');
    const base = new URL(`https://local.test/${path.relative(racine, fichier).replace(/index\.html$/, '')}`);
    for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
      if (!href.startsWith('/') && !href.startsWith('#')) continue;
      const url = new URL(href.replaceAll('&amp;', '&'), base);
      const nom = decodeURIComponent(url.pathname).replace(/^\//, '');
      let cible;
      for (const candidat of [path.join(racine, nom), path.join(racine, nom, 'index.html')]) if (await existe(candidat)) { cible = candidat; break; }
      if (!cible) { erreurs.push(`${path.relative(racine, fichier)} → ${href}`); continue; }
      if (url.hash && cible.endsWith('.html') && !(await readFile(cible, 'utf8')).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)) {
        erreurs.push(`${path.relative(racine, fichier)} → ancre absente ${href}`);
      }
    }
  }
  assert.deepEqual(erreurs, []);
});

test('chaque article publié a sa page, avec bannière, un seul h1 et un corps indexable', async () => {
  for (const article of articles) {
    const html = await lire(`lore/${article.id}/index.html`);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, article.id);
    assert.match(html, /data-hero/, `${article.id} : bannière`);
    const entete = html.match(/<header[^>]*data-navbar[^>]*>/)[0];
    assert.ok(/\bfixed\b/.test(entete) && entete.includes('data-sur-image'), `${article.id} : barre en surimpression`);
    assert.match(html, /data-pagefind-body/, article.id);
    assert.match(html, /property="og:type" content="article"/, article.id);
  }
});

test('les encadrés d’un article suivent son frontmatter, et le sommaire ses titres', async () => {
  for (const article of articles) {
    const html = await lire(`lore/${article.id}/index.html`);
    for (const encadre of ['spoilers', 'resume', 'sources']) {
      assert.equal(html.includes(`data-encadre="${encadre}"`), article[encadre], `${article.id} : encadré ${encadre}`);
    }
    const sommaire = html.split('aria-label="Sommaire"')[2]?.split('</nav>')[0] ?? '';
    for (const titre of article.titres) assert.ok(sommaire.includes(titre), `${article.id} : « ${titre} » au sommaire`);
  }
});

test('chaque article affiche ses tags, et « Pour aller plus loin » au plus 3 lectures', async () => {
  for (const article of articles) {
    const html = await lire(`lore/${article.id}/index.html`);
    const liste = html.split('aria-label="Tags de l’article"')[1].split('</ul>')[0];
    for (const tag of article.tags) assert.match(liste, new RegExp(`href="/lore/tags/${tag}"`), `${article.id} → ${tag}`);
    const lies = html.split('id="lies-titre"')[1] ?? '';
    assert.ok(cartes(lies) <= 3, `${article.id} : ${cartes(lies)} lectures liées`);
  }
});

test('chaque tag du registre a sa page, avec exactement ses lectures', async () => {
  for (const { id, theme } of tags) {
    const html = await lire(`lore/tags/${id}/index.html`);
    const attendues = articles.filter(a => a.tags.includes(id));
    assert.equal(cartes(html), attendues.length, `${id} : nombre de cartes`);
    for (const a of attendues) assert.match(html, new RegExp(`href="/lore/${a.id}"`), `${id} → ${a.id}`);
    assert.equal(html.includes('aria-label="Changer de thème"'), theme, `${id} : filtres de thème seulement sur un thème`);
  }
});

test('la bibliothèque liste tous les articles, l’index des tags tout le registre', async () => {
  assert.equal(cartes(await lire('lore/index.html')), articles.length);
  const index = await lire('lore/tags/index.html');
  for (const { id } of tags) assert.match(index, new RegExp(`href="/lore/tags/${id}"`), id);
});

test('une carte d’article n’a qu’un lien', async () => {
  const html = await lire('lore/index.html');
  for (const carte of html.split(/<article\b/).slice(1)) assert.equal((carte.split('</article>')[0].match(/<a\b/g) ?? []).length, 1);
});

test('les pages éditoriales existent ; la 404 n’est pas indexée ni dans le sitemap', async () => {
  for (const page of ['a-propos/index.html', 'confidentialite/index.html', '404.html']) assert.ok(await existe(path.join(racine, page)), page);
  assert.match(await lire('404.html'), /name="robots" content="noindex"/);
  const sitemap = await lire('sitemap-0.xml');
  assert.doesNotMatch(sitemap, /404/);
  for (const a of articles) assert.match(sitemap, new RegExp(`/lore/${a.id}/</loc>`), a.id);
  assert.doesNotMatch(await lire('a-propos/index.html'), /Shirone/);
});
