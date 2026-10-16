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
    // Astro rend les apostrophes et guillemets droits en typographiques (’ “ ”) : on compare sans en tenir compte.
    const typo = texte => texte.replace(/&#39;|['‘’]/g, '\'').replace(/&quot;|["“”]/g, '"');
    for (const titre of article.titres) assert.ok(typo(sommaire).includes(typo(titre)), `${article.id} : « ${titre} » au sommaire`);
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
  for (const a of articles) assert.match(sitemap, new RegExp(`/lore/${a.id}</loc>`), a.id);
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

test('une seule forme d’URL, sans barre finale : canoniques et sitemap comme les liens internes', async () => {
  for (const page of ['lore/index.html', 'lore/venti/index.html', 'lore/tags/regions/index.html', 'a-propos/index.html']) {
    assert.match(await lire(page), /<link rel="canonical" href="https:\/\/[^"]+[^/]"/, page);
  }
  const avecBarre = [...(await lire('sitemap-0.xml')).matchAll(/<loc>(https?:\/\/[^/]+\/[^<]*\/)<\/loc>/g)].map(m => m[1]);
  assert.deepEqual(avecBarre, []);
});

test('View Transitions : aucun nom en double sur une page (le navigateur abandonnerait toute la transition)', async () => {
  const erreurs = [];
  for (const fichier of pages) {
    const noms = [...(await readFile(fichier, 'utf8')).matchAll(/view-transition-name:\s*([\w-]+)/g)].map(m => m[1]);
    const doublons = noms.filter((nom, i) => noms.indexOf(nom) !== i);
    if (doublons.length) erreurs.push(`${path.relative(racine, fichier)} : ${[...new Set(doublons)].join(', ')}`);
  }
  assert.deepEqual(erreurs, []);
});

test('View Transitions : la bannière d’un article porte son nom, la carte le même en data-transition (sans nom statique)', async () => {
  const bibliotheque = await lire('lore/index.html');
  assert.doesNotMatch(bibliotheque, /view-transition-name:\s*image-/, 'aucune carte nommée d’avance (sinon toutes s’animeraient)');
  for (const { id } of articles) {
    assert.match(bibliotheque, new RegExp(`data-transition="image-${id}"`), `carte ${id}`);
    const banniere = (await lire(`lore/${id}/index.html`)).match(/<section[^>]*data-hero>/)[0];
    assert.match(banniere, new RegExp(`view-transition-name: image-${id}\\b`), `bannière ${id}`);
  }
  const tete = bibliotheque.split('</head>')[0];
  assert.match(tete, /addEventListener\('pageswap'/, 'script de nommage dans le <head>');
  assert.match(tete, /addEventListener\('pagereveal'/);
});

test('View Transitions : activées entre documents, désactivées en mouvement réduit', async () => {
  const feuille = (await readdir(path.join(racine, '_astro'))).find(f => f.endsWith('.css'));
  const css = await readFile(path.join(racine, '_astro', feuille), 'utf8');
  assert.match(css, /@view-transition\s*\{\s*navigation:\s*auto/);
  assert.match(css, /prefers-reduced-motion:\s*reduce\)\s*\{\s*@view-transition\s*\{\s*navigation:\s*none/);
});

test('page Crédits et licences : texte, licence déclarée, lien dans le pied de page de chaque page', async () => {
  const html = await lire('credits/index.html');
  for (const titre of ['Contenus provenant du Genshin Impact Wiki', 'Contenus originaux', 'Propriété intellectuelle de Genshin Impact']) assert.ok(html.includes(titre), titre);
  assert.match(html, /<a href="https:\/\/creativecommons\.org\/licenses\/by-sa\/3\.0\/deed\.fr" rel="license">/);
  for (const page of ['index.html', 'lore/venti/index.html', '404.html']) assert.match(await lire(page), /<a href="\/credits"[^>]*>Crédits et licences<\/a>/, page);
  assert.match(await lire('sitemap-0.xml'), /\/credits<\/loc>/);
  const originaux = html.split('Contenus originaux</h2>')[1].split('<h2')[0];
  assert.match(originaux, /CC BY-SA 3\.0/, 'les contenus originaux sont sous CC BY-SA 3.0 (D18)');
  assert.doesNotMatch(originaux, /restent soumis aux droits/);
  const code = html.split('Code source</h2>')[1].split('<h2')[0];
  assert.match(code, /href="https:\/\/www\.gnu\.org\/licenses\/gpl-3\.0\.fr\.html">GNU GPL version 3 ou ultérieure/, 'code sous GPL (D19)');
});

test('tous les textes du site sont sous CC BY-SA 3.0 : licence déclarée sur chaque page et rappelée en pied de page', async () => {
  for (const fichier of pages) {
    const html = await readFile(fichier, 'utf8');
    if (html.includes('http-equiv="refresh"')) continue; // pages de redirection
    assert.match(html, /<link rel="license" href="https:\/\/creativecommons\.org\/licenses\/by-sa\/3\.0\/deed\.fr">/, path.relative(racine, fichier));
  }
  assert.match(await lire('index.html'), /Textes sous licence <a href="https:\/\/creativecommons\.org\/licenses\/by-sa\/3\.0\/deed\.fr"[^>]*>CC BY-SA 3\.0<\/a>, code sous licence <a href="https:\/\/www\.gnu\.org\/licenses\/gpl-3\.0\.fr\.html"[^>]*>GNU GPL v3<\/a>/);
});

test('crédits d’un article : encadré seulement quand le frontmatter en déclare', async () => {
  for (const a of articles) {
    const html = await lire(`lore/${a.id}/index.html`);
    assert.equal(html.includes('data-encadre="credits"'), a.creditsWiki + a.creditsCommunaute > 0, `${a.id} : encadré Crédits`);
    if (a.creditsWiki) {
      assert.match(html, /\?action=history"/, `${a.id} : lien vers les contributeurs du wiki`);
      assert.match(html, /Modifications :/, `${a.id} : modifications mentionnées`);
    }
  }
});

test('page Crédits : les listes d’adaptations et de théories suivent les articles', async () => {
  const html = await lire('credits/index.html');
  const wiki = articles.filter(a => a.creditsWiki > 0);
  const communaute = articles.filter(a => a.creditsCommunaute > 0);
  assert.equal(html.includes('data-liste="adaptations"'), wiki.length > 0);
  assert.equal(html.includes('data-liste="theories"'), communaute.length > 0);
  for (const a of [...wiki, ...communaute]) assert.match(html, new RegExp(`href="/lore/${a.id}"`), a.id);
});

test('lecture : barre de progression décorative et sommaire suivi sur chaque article, ancres hors de la barre fixe', async () => {
  for (const a of articles) {
    const html = await lire(`lore/${a.id}/index.html`);
    assert.match(html, /<div[^>]*aria-hidden="true"[^>]*>\s*<div[^>]*data-progression/, `${a.id} : barre de progression`);
    assert.match(html, /<article[^>]*data-lecture/, `${a.id} : article mesuré`);
    if (a.titres.length) assert.equal((html.match(/data-sommaire/g) ?? []).length >= 2, true, `${a.id} : deux sommaires suivis`);
    assert.doesNotMatch(html, /aria-current="true"/, `${a.id} : aucune section active dans le HTML statique`);
  }
  assert.doesNotMatch(await lire('lore/index.html'), /data-progression/, 'pas de barre hors des articles');
  const feuille = (await readdir(path.join(racine, '_astro'))).find(f => f.endsWith('.css'));
  assert.match(await readFile(path.join(racine, '_astro', feuille), 'utf8'), /scroll-padding-top:\s*5rem/);
});

test('aucune adresse e-mail ni lien mailto: dans le site publié (contact par GitLab, D22)', async () => {
  const erreurs = [];
  for (const fichier of pages) {
    const html = await readFile(fichier, 'utf8');
    for (const [adresse] of html.matchAll(/(?:mailto:)?[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}/gi)) erreurs.push(`${path.relative(racine, fichier)} : ${adresse}`);
  }
  assert.deepEqual(erreurs, []);
});

test('mentions légales : éditeur anonyme, contact GitLab, hébergeur identifié ; liens en pied de page', async () => {
  const { DEPOT, TICKETS, HEBERGEUR } = await import('../src/lib/projet.mjs');
  const html = await lire('mentions-legales/index.html');
  for (const attendu of ['Éditeur', 'Hébergeur', HEBERGEUR.nom, HEBERGEUR.adresse, 'à titre non professionnel']) assert.ok(html.includes(attendu), attendu);
  assert.ok(html.includes(`href="${TICKETS}"`), 'contact par les tickets GitLab');
  for (const page of ['index.html', 'lore/venti/index.html']) {
    const pied = (await lire(page)).split('<footer')[1];
    assert.match(pied, /href="\/mentions-legales"/, page);
    assert.ok(pied.includes(`href="${DEPOT}"`), `${page} : lien vers le code source`);
  }
  assert.ok((await lire('a-propos/index.html')).includes(`href="${TICKETS}"`), 'À propos : contact par GitLab');
  assert.ok((await lire('credits/index.html')).includes(`href="${DEPOT}"`), 'Crédits : lien vers le dépôt');
  assert.match(await lire('sitemap-0.xml'), /\/mentions-legales<\/loc>/);
});

test('page Crédits : chaque logiciel libre du registre est crédité, avec titulaire et licence (D23)', async () => {
  const { TIERS, TEXTES_LICENCES } = await import('../src/lib/tiers.mjs');
  const html = await lire('credits/index.html');
  for (const t of TIERS) {
    const liste = html.split(`data-liste="${t.distribue ? 'distribues' : 'construction'}"`)[1].split('</ul>')[0];
    assert.ok(liste.includes(`href="${t.url}"`) && liste.includes(t.titulaire) && liste.includes(`href="${TEXTES_LICENCES[t.licence]}"`), t.nom);
  }
});

test('le site s’appelle « Les Archives de Teyvat » partout, et plus jamais par son ancien nom (D24)', async () => {
  const { NOM } = await import('../src/lib/projet.mjs');
  assert.equal(NOM, 'Les Archives de Teyvat');
  for (const fichier of pages) {
    const html = await readFile(fichier, 'utf8');
    if (html.includes('http-equiv="refresh"')) continue;
    assert.doesNotMatch(html, /Histoire de Genshin/, path.relative(racine, fichier));
    assert.match(html, new RegExp(`<title>[^<]* · ${NOM}</title>`), path.relative(racine, fichier));
    assert.match(html, new RegExp(`property="og:site_name" content="${NOM}"`), path.relative(racine, fichier));
  }
});
