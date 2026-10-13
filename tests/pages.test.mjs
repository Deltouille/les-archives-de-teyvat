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

test('accueil : bannière, titre unique, sujets de la machine à écrire lisibles sans JavaScript', async () => {
  const html = await lire('index.html');
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /data-hero/);
  const machine = html.split('data-machine')[1].split('</p>')[0];
  assert.match(machine, /data-sujets="[^"]*"[^>]*>les sept Archontes</, 'premier sujet écrit en dur');
  assert.match(machine, /class="sr-only">les sept Archontes, le Cataclysme, .+ et les pas du Voyageur\.</, 'phrase complète pour les lecteurs d’écran');
  assert.match(machine, /<button[^>]*aria-label="Pause de l’animation"[^>]*aria-pressed="false"[^>]*hidden/, 'bouton pause caché tant que l’animation ne tourne pas');
});

test('accueil : les chiffres suivent le contenu', async () => {
  const chiffres = (await lire('index.html')).split('data-chiffres')[1].split('</ul>')[0];
  const nombres = [...chiffres.matchAll(/<strong[^>]*>(\d+)<\/strong>/g)].map(m => Number(m[1]));
  assert.deepEqual(nombres, [articles.length, tags.filter(t => t.theme).length, 7]);
});

test('accueil : à la une, entrées par thème, lectures récentes', async () => {
  const html = await lire('index.html');
  const aLaUne = html.split('data-a-la-une')[1].split('</section>')[0];
  assert.match(aLaUne, /href="\/lore\/mondstadt"/);
  assert.match(aLaUne, /href="\/lore\/tags\/premiers-pas"/);
  assert.match(aLaUne, new RegExp(`${articles.filter(a => a.tags.includes('premiers-pas')).length} lectures`));
  const entrees = html.split('data-entrees')[1].split('</section>')[0];
  for (const id of ['quetes', 'concepts', 'personnages', 'regions']) assert.match(entrees, new RegExp(`href="/lore/tags/${id}"`), id);
  const recents = html.split('id="recents-titre"')[1];
  assert.equal(cartes(recents), Math.min(6, articles.length));
  assert.match(html, /href="\/lore\/tags"[^>]*>[\s\S]*Tirez un fil, suivez une histoire/);
});

test('recherche : l’index Pagefind couvre exactement les articles publiés, en français', async () => {
  const entree = JSON.parse(await lire('pagefind/pagefind-entry.json'));
  assert.deepEqual(Object.keys(entree.languages), ['fr']);
  assert.equal(entree.languages.fr.page_count, articles.length);
  for (const a of articles) {
    const html = await lire(`lore/${a.id}/index.html`);
    assert.match(html, /data-pagefind-filter="theme"/, `${a.id} : filtre de thème`);
    assert.match(html, /data-pagefind-meta="title"/, `${a.id} : titre`);
  }
});

test('recherche : fenêtre accessible et boutons d’ouverture sur chaque page', async () => {
  for (const page of ['index.html', 'lore/index.html', 'lore/venti/index.html', '404.html']) {
    const html = await lire(page);
    assert.match(html, /<dialog[^>]*id="recherche"[^>]*aria-labelledby="recherche-titre"/, page);
    assert.match(html, /<form role="search"/, page);
    assert.match(html, /<label for="recherche-champ"/, page);
    assert.match(html, /role="status"[^>]*data-etat/, page);
    assert.equal((html.match(/\sdata-recherche[\s>]/g) ?? []).length, 2, `${page} : bouton large et bouton icône`);
    assert.match(html, /<kbd[^>]*data-raccourci>Ctrl K<\/kbd>/, page);
  }
});

test('aucune URL publiée par le prototype ne disparaît (page ou redirection)', async () => {
  const urls = (await readFile(path.resolve('tests/donnees/urls-publiees.txt'), 'utf8')).split('\n').filter(l => l && !l.startsWith('#'));
  const absentes = [];
  for (const url of urls) {
    const fichier = url.endsWith('/') ? path.join(racine, url, 'index.html') : path.join(racine, url);
    if (!(await existe(fichier))) absentes.push(url);
  }
  assert.deepEqual(absentes, []);
});

test('chaque page de redirection mène directement à une vraie page', async () => {
  const erreurs = [];
  let nombre = 0;
  for (const fichier of pages) {
    const cible = (await readFile(fichier, 'utf8')).match(/http-equiv="refresh" content="0;url=([^"]+)"/)?.[1];
    if (!cible) continue;
    nombre++;
    const html = await readFile(path.join(racine, cible, 'index.html'), 'utf8').catch(() => null);
    if (!html) erreurs.push(`${path.relative(racine, fichier)} → ${cible} : introuvable`);
    else if (html.includes('http-equiv="refresh"')) erreurs.push(`${path.relative(racine, fichier)} → ${cible} : encore une redirection`);
  }
  assert.ok(nombre >= 33, `${nombre} pages de redirection`);
  assert.deepEqual(erreurs, []);
});

test('robots.txt autorise l’exploration et donne le sitemap', async () => {
  const robots = await lire('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Sitemap: https:\/\/[^\s]+\/sitemap-index\.xml$/m);
  assert.ok(await existe(path.join(racine, 'sitemap-index.xml')));
});

test('les anciennes URL redirigées n’entrent pas dans le sitemap', async () => {
  const sitemap = await lire('sitemap-0.xml');
  for (const ancienne of ['/lore/regions/mondstadt/', '/tags/anemo/', '/dossiers/commencer/']) assert.doesNotMatch(sitemap, new RegExp(`<loc>https?://[^/<]+${ancienne}</loc>`), ancienne);
});
