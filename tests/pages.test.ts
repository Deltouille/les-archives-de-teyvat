// Tests sur les pages générées (lancer `npm run build` avant) : liens, articles, tags, pages éditoriales.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { test, expect } from 'vitest';

import { lireArticlesPublies, lireTags, articleExemple, type ArticleSource } from './sources.ts';

const racine = path.resolve('dist');
const existe = async (fichier: string) => { try { return (await stat(fichier)).isFile(); } catch { return false; } };
const lire = (fichier: string) => readFile(path.join(racine, fichier), 'utf8');
async function fichiers(dossier: string): Promise<string[]> {
  const entrees = await readdir(dossier, { withFileTypes: true });
  return (await Promise.all(entrees.map(async (e): Promise<string | string[]> => (e.isDirectory() ? fichiers(path.join(dossier, e.name)) : path.join(dossier, e.name))))).flat();
}
const pages = (await fichiers(racine)).filter(f => f.endsWith('.html'));
const articles = await lireArticlesPublies();
const tags = await lireTags();
const EXEMPLE = `lore/${(await articleExemple()).id}/index.html`;
const cartes = (html: string) => (html.match(/<article\b[^>]*rounded-carte/g) ?? []).length;

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
  expect(erreurs).toStrictEqual([]);
});

test('chaque article publié a sa page, avec bannière, un seul h1 et un corps indexable', async () => {
  for (const article of articles) {
    const html = await lire(`lore/${article.id}/index.html`);
    expect((html.match(/<h1\b/g) ?? []).length, article.id).toBe(1);
    expect(html, `${article.id} : bannière`).toMatch(/data-hero/);
    const entete = /<header[^>]*data-navbar[^>]*>/.exec(html)![0];
    expect(/\bfixed\b/.test(entete) && entete.includes('data-sur-image'), `${article.id} : barre en surimpression`).toBeTruthy();
    expect(html, article.id).toMatch(/data-pagefind-body/);
    expect(html, article.id).toMatch(/property="og:type" content="article"/);
  }
});

test('les encadrés d’un article suivent son frontmatter, et le sommaire ses titres', async () => {
  for (const article of articles) {
    const html = await lire(`lore/${article.id}/index.html`);
    for (const encadre of ['spoilers', 'resume', 'sources'] as const) {
      expect(html.includes(`data-encadre="${encadre}"`), `${article.id} : encadré ${encadre}`).toBe(article[encadre]);
    }
    const sommaire = html.split('aria-label="Sommaire"')[2]?.split('</nav>')[0] ?? '';
    // Astro rend les apostrophes et guillemets droits en typographiques (’ “ ”) : on compare sans en tenir compte.
    const typo = (texte: string) => texte.replace(/&#39;|['‘’]/g, '\'').replace(/&quot;|["“”]/g, '"');
    for (const titre of article.titres) expect(typo(sommaire).includes(typo(titre)), `${article.id} : « ${titre} » au sommaire`).toBeTruthy();
  }
});

test('chaque article affiche ses tags, et « Pour aller plus loin » au plus 3 lectures', async () => {
  for (const article of articles) {
    const html = await lire(`lore/${article.id}/index.html`);
    const liste = html.split('aria-label="Tags de l’article"')[1].split('</ul>')[0];
    for (const tag of article.tags) expect(liste, `${article.id} → ${tag}`).toMatch(new RegExp(`href="/lore/tags/${tag}"`));
    const lies = html.split('id="lies-titre"')[1] ?? '';
    expect(cartes(lies) <= 3, `${article.id} : ${cartes(lies)} lectures liées`).toBeTruthy();
  }
});

test('chaque tag du registre a sa page, avec exactement ses lectures', async () => {
  for (const { id, theme } of tags) {
    const html = await lire(`lore/tags/${id}/index.html`);
    const attendues = articles.filter(a => a.tags.includes(id));
    expect(cartes(html), `${id} : nombre de cartes`).toBe(attendues.length);
    for (const a of attendues) expect(html, `${id} → ${a.id}`).toMatch(new RegExp(`href="/lore/${a.id}"`));
    expect(html.includes('aria-label="Changer de thème"'), `${id} : filtres de thème seulement sur un thème`).toBe(theme);
  }
});

test('la bibliothèque liste tous les articles, l’index des tags tout le registre', async () => {
  expect(cartes(await lire('lore/index.html'))).toBe(articles.length);
  const index = await lire('lore/tags/index.html');
  for (const { id } of tags) expect(index, id).toMatch(new RegExp(`href="/lore/tags/${id}"`));
});

test('une carte d’article n’a qu’un lien', async () => {
  const html = await lire('lore/index.html');
  for (const carte of html.split(/<article\b/).slice(1)) expect((carte.split('</article>')[0].match(/<a\b/g) ?? []).length).toBe(1);
});

test('les pages éditoriales existent ; la 404 n’est pas indexée ni dans le sitemap', async () => {
  for (const page of ['a-propos/index.html', 'confidentialite/index.html', '404.html']) expect(await existe(path.join(racine, page)), page).toBeTruthy();
  expect(await lire('404.html')).toMatch(/name="robots" content="noindex"/);
  const sitemap = await lire('sitemap-0.xml');
  expect(sitemap).not.toMatch(/404/);
  for (const a of articles) expect(sitemap, a.id).toMatch(new RegExp(`/lore/${a.id}</loc>`));
  expect(await lire('a-propos/index.html')).not.toMatch(/Shirone/);
});

test('accueil : bannière, titre unique, sans machine à écrire (D36)', async () => {
  const html = await lire('index.html');
  expect((html.match(/<h1\b/g) ?? []).length).toBe(1);
  expect(html).toMatch(/data-hero/);
  expect(html).not.toMatch(/data-machine|data-sujets|Ici, on vous raconte/);
});

test('accueil : les chiffres suivent le contenu', async () => {
  const chiffres = (await lire('index.html')).split('data-chiffres')[1].split('</ul>')[0];
  const nombres = [...chiffres.matchAll(/<strong[^>]*>(\d+)<\/strong>/g)].map(m => Number(m[1]));
  expect(nombres).toStrictEqual([articles.length, tags.filter(t => t.theme).length, 7]);
});

test('accueil : les statistiques sont dans une carte après le hero', async () => {
  const html = await lire('index.html');
  const hero = html.split('data-hero')[1].split('</section>')[0];
  expect(hero).not.toMatch(/data-chiffres|data-statistiques/);
  const contenu = html.split('<main')[1];
  expect(contenu).toMatch(/data-statistiques/);
  expect(contenu.indexOf('data-statistiques') < contenu.indexOf('data-a-la-une')).toBeTruthy();
  expect(contenu).toMatch(/aria-labelledby="statistiques-titre"/);
});

test('accueil : à la une, entrées par thème, lectures récentes', async () => {
  const html = await lire('index.html');
  const aLaUne = html.split('data-a-la-une')[1].split('</section>')[0];
  // Le plus récent des articles marqués aLaUne, sinon le plus récent.
  const parDate = [...articles].sort((a, b) => b.publieLe.localeCompare(a.publieLe));
  const attendu = parDate.find(a => a.aLaUne) ?? parDate[0];
  expect(aLaUne, `à la une : ${attendu.id}`).toMatch(new RegExp(`href="/lore/${attendu.id}"`));
  expect(aLaUne).toMatch(/href="\/lore\/tags\/premiers-pas"/);
  expect(aLaUne).toMatch(new RegExp(`${articles.filter(a => a.tags.includes('premiers-pas')).length} lectures`));
  const entrees = html.split('data-entrees')[1].split('</section>')[0];
  for (const id of ['quetes', 'concepts', 'personnages', 'regions']) expect(entrees, id).toMatch(new RegExp(`href="/lore/tags/${id}"`));
  const recents = html.split('id="recents-titre"')[1];
  expect(cartes(recents)).toBe(Math.min(6, articles.length));
  expect(html).toMatch(/href="\/lore\/tags"[^>]*>[\s\S]*Tirez un fil, suivez une histoire/);
});

test('recherche : l’index Pagefind couvre exactement les articles publiés, en français', async () => {
  const entree = JSON.parse(await lire('pagefind/pagefind-entry.json')) as { languages: Record<string, { page_count: number }> };
  expect(Object.keys(entree.languages)).toStrictEqual(['fr']);
  expect(entree.languages.fr.page_count).toBe(articles.length);
  for (const a of articles) {
    const html = await lire(`lore/${a.id}/index.html`);
    expect(html, `${a.id} : filtre de thème`).toMatch(/data-pagefind-filter="theme"/);
    expect(html, `${a.id} : titre`).toMatch(/data-pagefind-meta="title"/);
  }
});

test('recherche : fenêtre accessible et boutons d’ouverture sur chaque page', async () => {
  for (const page of ['index.html', 'lore/index.html', EXEMPLE, '404.html']) {
    const html = await lire(page);
    expect(html, page).toMatch(/<dialog[^>]*id="recherche"[^>]*aria-labelledby="recherche-titre"/);
    expect(html, page).toMatch(/<form role="search"/);
    expect(html, page).toMatch(/<label for="recherche-champ"/);
    expect(html, page).toMatch(/role="status"[^>]*data-etat/);
    expect((html.match(/\sdata-recherche[\s>]/g) ?? []).length, `${page} : bouton large et bouton icône`).toBe(2);
    expect(html, page).toMatch(/<kbd[^>]*data-raccourci>Ctrl K<\/kbd>/);
  }
});

test('aucune URL publiée par le prototype ne disparaît (page ou redirection)', async () => {
  const urls = (await readFile(path.resolve('tests/donnees/urls-publiees.txt'), 'utf8')).split('\n').filter(l => l && !l.startsWith('#'));
  const absentes = [];
  for (const url of urls) {
    const fichier = url.endsWith('/') ? path.join(racine, url, 'index.html') : path.join(racine, url);
    if (!(await existe(fichier))) absentes.push(url);
  }
  expect(absentes).toStrictEqual([]);
});

test('chaque page de redirection mène directement à une vraie page', async () => {
  const erreurs = [];
  let nombre = 0;
  for (const fichier of pages) {
    const cible = (/http-equiv="refresh" content="0;url=([^"]+)"/.exec((await readFile(fichier, 'utf8'))))?.[1];
    if (!cible) continue;
    nombre++;
    const html = await readFile(path.join(racine, cible, 'index.html'), 'utf8').catch(() => null);
    if (!html) erreurs.push(`${path.relative(racine, fichier)} → ${cible} : introuvable`);
    else if (html.includes('http-equiv="refresh"')) erreurs.push(`${path.relative(racine, fichier)} → ${cible} : encore une redirection`);
  }
  expect(nombre >= 33, `${nombre} pages de redirection`).toBeTruthy();
  expect(erreurs).toStrictEqual([]);
});

test('robots.txt autorise l’exploration et donne le sitemap', async () => {
  const robots = await lire('robots.txt');
  expect(robots).toMatch(/^User-agent: \*$/m);
  expect(robots).toMatch(/^Sitemap: https:\/\/[^\s]+\/sitemap-index\.xml$/m);
  expect(await existe(path.join(racine, 'sitemap-index.xml'))).toBeTruthy();
});

test('les anciennes URL redirigées n’entrent pas dans le sitemap', async () => {
  const sitemap = await lire('sitemap-0.xml');
  for (const ancienne of ['/lore/regions/mondstadt/', '/tags/anemo/', '/dossiers/commencer/']) expect(sitemap, ancienne).not.toMatch(new RegExp(`<loc>https?://[^/<]+${ancienne}</loc>`));
});

test('une seule forme d’URL, sans barre finale : canoniques et sitemap comme les liens internes', async () => {
  for (const page of ['lore/index.html', EXEMPLE, 'lore/tags/regions/index.html', 'a-propos/index.html']) {
    expect(await lire(page), page).toMatch(/<link rel="canonical" href="https:\/\/[^"]+[^/]"/);
  }
  const avecBarre = [...(await lire('sitemap-0.xml')).matchAll(/<loc>(https?:\/\/[^/]+\/[^<]*\/)<\/loc>/g)].map(m => m[1]);
  expect(avecBarre).toStrictEqual([]);
});

test('View Transitions : aucun nom en double sur une page (le navigateur abandonnerait toute la transition)', async () => {
  const erreurs = [];
  for (const fichier of pages) {
    const noms = [...(await readFile(fichier, 'utf8')).matchAll(/view-transition-name:\s*([\w-]+)/g)].map(m => m[1]);
    const doublons = noms.filter((nom, i) => noms.indexOf(nom) !== i);
    if (doublons.length) erreurs.push(`${path.relative(racine, fichier)} : ${[...new Set(doublons)].join(', ')}`);
  }
  expect(erreurs).toStrictEqual([]);
});

test('View Transitions : la bannière d’un article porte son nom, la carte le même en data-transition (sans nom statique)', async () => {
  const bibliotheque = await lire('lore/index.html');
  expect(bibliotheque, 'aucune carte nommée d’avance (sinon toutes s’animeraient)').not.toMatch(/view-transition-name:\s*image-/);
  for (const { id } of articles) {
    expect(bibliotheque, `carte ${id}`).toMatch(new RegExp(`data-transition="image-${id}"`));
    const banniere = /<section[^>]*data-hero>/.exec((await lire(`lore/${id}/index.html`)))![0];
    expect(banniere, `bannière ${id}`).toMatch(new RegExp(`view-transition-name: image-${id}\\b`));
  }
  const tete = bibliotheque.split('</head>')[0];
  expect(tete, 'script de nommage dans le <head>').toMatch(/addEventListener\('pageswap'/);
  expect(tete).toMatch(/addEventListener\('pagereveal'/);
});

test('View Transitions : activées entre documents, désactivées en mouvement réduit', async () => {
  const feuille = (await readdir(path.join(racine, '_astro'))).find(f => f.endsWith('.css'))!;
  const css = await readFile(path.join(racine, '_astro', feuille), 'utf8');
  expect(css).toMatch(/@view-transition\s*\{\s*navigation:\s*auto/);
  expect(css).toMatch(/prefers-reduced-motion:\s*reduce\)\s*\{\s*@view-transition\s*\{\s*navigation:\s*none/);
});

test('page Crédits et licences : texte, licence déclarée, lien dans le pied de page de chaque page', async () => {
  const html = await lire('credits/index.html');
  for (const titre of ['Contenus provenant du Genshin Impact Wiki', 'Contenus originaux', 'Propriété intellectuelle de Genshin Impact']) expect(html.includes(titre), titre).toBeTruthy();
  expect(html).toMatch(/<a href="https:\/\/creativecommons\.org\/licenses\/by-sa\/3\.0\/deed\.fr" rel="license">/);
  for (const page of ['index.html', EXEMPLE, '404.html']) expect(await lire(page), page).toMatch(/<a href="\/credits"[^>]*>Crédits et licences<\/a>/);
  expect(await lire('sitemap-0.xml')).toMatch(/\/credits<\/loc>/);
  const originaux = html.split('Contenus originaux</h2>')[1].split('<h2')[0];
  expect(originaux, 'les contenus originaux sont sous CC BY-SA 3.0 (D18)').toMatch(/CC BY-SA 3\.0/);
  expect(originaux).not.toMatch(/restent soumis aux droits/);
  const code = html.split('Code source</h2>')[1].split('<h2')[0];
  expect(code, 'code sous GPL (D19)').toMatch(/href="https:\/\/www\.gnu\.org\/licenses\/gpl-3\.0\.fr\.html">GNU GPL version 3 ou ultérieure/);
});

test('tous les textes du site sont sous CC BY-SA 3.0 : licence déclarée sur chaque page et rappelée en pied de page', async () => {
  for (const fichier of pages) {
    const html = await readFile(fichier, 'utf8');
    if (html.includes('http-equiv="refresh"')) continue; // pages de redirection
    expect(html, path.relative(racine, fichier)).toMatch(/<link rel="license" href="https:\/\/creativecommons\.org\/licenses\/by-sa\/3\.0\/deed\.fr">/);
  }
  expect(await lire('index.html')).toMatch(/Textes sous licence <a href="https:\/\/creativecommons\.org\/licenses\/by-sa\/3\.0\/deed\.fr"[^>]*>CC BY-SA 3\.0<\/a>, code sous licence <a href="https:\/\/www\.gnu\.org\/licenses\/gpl-3\.0\.fr\.html"[^>]*>GNU GPL v3<\/a>/);
});

test('crédits d’un article : encadré seulement quand le frontmatter en déclare', async () => {
  for (const a of articles) {
    const html = await lire(`lore/${a.id}/index.html`);
    expect(html.includes('data-encadre="credits"'), `${a.id} : encadré Crédits`).toBe(a.creditsWiki + a.creditsCommunaute > 0);
    if (a.creditsWiki) {
      expect(html, `${a.id} : lien vers les contributeurs du wiki`).toMatch(/\?action=history"/);
      expect(html, `${a.id} : modifications mentionnées`).toMatch(/Modifications :/);
    }
  }
});

test('page Crédits : les listes d’adaptations et de théories suivent les articles', async () => {
  const html = await lire('credits/index.html');
  const wiki = articles.filter(a => a.creditsWiki > 0);
  const communaute = articles.filter(a => a.creditsCommunaute > 0);
  expect(html.includes('data-liste="adaptations"')).toBe(wiki.length > 0);
  expect(html.includes('data-liste="theories"')).toBe(communaute.length > 0);
  for (const a of [...wiki, ...communaute]) expect(html, a.id).toMatch(new RegExp(`href="/lore/${a.id}"`));
});

test('lecture : barre de progression décorative et sommaire suivi sur chaque article, ancres hors de la barre fixe', async () => {
  for (const a of articles) {
    const html = await lire(`lore/${a.id}/index.html`);
    expect(html, `${a.id} : barre de progression`).toMatch(/<div[^>]*aria-hidden="true"[^>]*>\s*<div[^>]*data-progression/);
    expect(html, `${a.id} : article mesuré`).toMatch(/<article[^>]*data-lecture/);
    if (a.titres.length) expect((html.match(/data-sommaire/g) ?? []).length >= 2, `${a.id} : deux sommaires suivis`).toBe(true);
    expect(html, `${a.id} : aucune section active dans le HTML statique`).not.toMatch(/aria-current="true"/);
  }
  expect(await lire('lore/index.html'), 'pas de barre hors des articles').not.toMatch(/data-progression/);
  const feuille = (await readdir(path.join(racine, '_astro'))).find(f => f.endsWith('.css'))!;
  expect(await readFile(path.join(racine, '_astro', feuille), 'utf8')).toMatch(/scroll-padding-top:\s*5rem/);
});

test('aucune adresse e-mail dans le site publié, sauf l’alias du contact privé (D22, D32)', async () => {
  const { CONTACT_PRIVE } = await import('../src/lib/projet.ts');
  const erreurs = [];
  for (const fichier of pages) {
    const html = await readFile(fichier, 'utf8');
    for (const [, adresse] of html.matchAll(/(?:mailto:)?([\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,})/gi)) {
      if (adresse !== CONTACT_PRIVE) erreurs.push(`${path.relative(racine, fichier)} : ${adresse}`);
    }
  }
  expect(erreurs).toStrictEqual([]);
  for (const page of ['confidentialite/index.html', 'mentions-legales/index.html']) expect((await lire(page)).includes(`href="mailto:${CONTACT_PRIVE}"`), `${page} : contact privé`).toBeTruthy();
});

test('mentions légales : éditeur anonyme, contact par les tickets, hébergeur identifié ; liens en pied de page', async () => {
  const { DEPOT, TICKETS, HEBERGEUR } = await import('../src/lib/projet.ts');
  const html = await lire('mentions-legales/index.html');
  for (const attendu of ['Éditeur', 'Hébergeur', HEBERGEUR.nom, HEBERGEUR.adresse, 'à titre non professionnel']) expect(html.includes(attendu), attendu).toBeTruthy();
  expect(html.includes(`href="${TICKETS}"`), 'contact par les tickets du dépôt').toBeTruthy();
  for (const page of ['index.html', EXEMPLE]) {
    const pied = (await lire(page)).split('<footer')[1];
    expect(pied, page).toMatch(/href="\/mentions-legales"/);
    expect(pied.includes(`href="${DEPOT}"`), `${page} : lien vers le code source`).toBeTruthy();
  }
  expect((await lire('a-propos/index.html')).includes(`href="${TICKETS}"`), 'À propos : contact par les tickets').toBeTruthy();
  expect((await lire('credits/index.html')).includes(`href="${DEPOT}"`), 'Crédits : lien vers le dépôt').toBeTruthy();
  expect(await lire('sitemap-0.xml')).toMatch(/\/mentions-legales<\/loc>/);
});

test('page Crédits : chaque logiciel libre du registre est crédité, avec titulaire et licence (D23)', async () => {
  const { TIERS, TEXTES_LICENCES } = await import('../src/lib/tiers.ts');
  const html = await lire('credits/index.html');
  for (const t of TIERS) {
    const liste = html.split(`data-liste="${t.distribue ? 'distribues' : 'construction'}"`)[1].split('</ul>')[0];
    expect(liste.includes(`href="${t.url}"`) && liste.includes(t.titulaire) && liste.includes(`href="${TEXTES_LICENCES[t.licence]}"`), t.nom).toBeTruthy();
  }
});

test('le site s’appelle « Les Archives de Teyvat » partout, et plus jamais par son ancien nom (D24)', async () => {
  const { NOM } = await import('../src/lib/projet.ts');
  expect(NOM).toBe('Les Archives de Teyvat');
  for (const fichier of pages) {
    const html = await readFile(fichier, 'utf8');
    if (html.includes('http-equiv="refresh"')) continue;
    expect(html, path.relative(racine, fichier)).not.toMatch(/Histoire de Genshin/);
    expect(html, path.relative(racine, fichier)).toMatch(new RegExp(`<title>[^<]* · ${NOM}</title>`));
    expect(html, path.relative(racine, fichier)).toMatch(new RegExp(`property="og:site_name" content="${NOM}"`));
  }
});

test('le dépôt est sur GitHub : plus aucune mention de l’ancienne plateforme GitLab (D26)', async () => {
  const { PLATEFORME, DEPOT, TICKETS } = await import('../src/lib/projet.ts');
  expect(PLATEFORME).toBe('GitHub');
  expect(DEPOT.startsWith('https://github.com/') && TICKETS === `${DEPOT}/issues`).toBeTruthy();
  for (const fichier of pages) expect(await readFile(fichier, 'utf8'), path.relative(racine, fichier)).not.toMatch(/gitlab/i);
});

test('en-tête d’un thème : l’emblème est à gauche du titre ; un tag simple n’a pas d’emblème', async () => {
  for (const { id, theme } of tags) {
    const entete = /<header class="mt-4 mb-8[\s\S]*?<\/header>/.exec((await lire(`lore/tags/${id}/index.html`)))![0];
    const ligne = /<div class="mb-4[^"]*">([\s\S]*?)<\/h1>/.exec(entete)!;
    expect(ligne, `${id} : ligne du titre`).toBeTruthy();
    expect(ligne[0].includes('flex items-center') && ligne[1].split('<h1')[0].includes('<svg'), `${id} : emblème à gauche du titre seulement pour un thème`).toBe(theme);
    expect(!entete.includes('sur-titre'), `${id} : pas de petit texte au-dessus du titre (D35)`).toBeTruthy();
    const nombre = articles.filter(a => a.tags.includes(id)).length;
    if (nombre) expect(entete, `${id} : nombre de lectures sous la description`).toMatch(new RegExp(`data-nombre-lectures>${nombre} lectures?<`));
    else expect(!entete.includes('data-nombre-lectures'), `${id} : pas de « 0 lecture » (la page dit déjà qu’il n’y en a aucune)`).toBeTruthy();
  }
});

test('licences des logiciels : texte complet publié et lié depuis les crédits (MIT : notice ; Apache : copie) (D30)', async () => {
  const { TIERS, cheminLicence } = await import('../src/lib/tiers.ts');
  const credits = await lire('credits/index.html');
  for (const t of TIERS) {
    const texte = await lire(cheminLicence(t).slice(1));
    expect(credits.includes(`href="${cheminLicence(t)}"`), `${t.nom} : lien depuis les crédits`).toBeTruthy();
    if (t.licence === 'MIT') {
      expect(texte.includes(t.titulaire) && texte.includes('Copyright'), `${t.nom} : notice de copyright`).toBeTruthy();
      expect(texte, `${t.nom} : notice d’autorisation`).toMatch(/Permission is hereby granted[\s\S]*The above copyright notice and this permission notice shall be included/);
    } else expect(texte, `${t.nom} : copie complète de la licence Apache`).toMatch(/Apache License\s+Version 2\.0[\s\S]*TERMS AND CONDITIONS[\s\S]*END OF TERMS AND CONDITIONS/);
  }
});

test('confidentialité : ni publicité ni mesure d’audience, mais les traitements de l’hébergement sont décrits (D30)', async () => {
  const { HEBERGEUR } = await import('../src/lib/projet.ts');
  const confidentialite = await lire('confidentialite/index.html');
  // D36 : notice en cinq parties, informations utiles et absence de rôles non établis.
  expect(((/<article\b[\s\S]*?<\/article>/.exec(confidentialite))?.[0].match(/<h2\b/g) ?? []).length).toBe(5);
  for (const attendu of ['Votre navigation', 'L’hébergement', 'Vos préférences et la recherche', 'Le contact privé', 'Vos droits', 'adresse IP', HEBERGEUR.journaux, 'Data Privacy Framework', 'clauses contractuelles types', 'intérêt légitime', 'obligation légale', 'Proton AG', 'supprimés dès que votre demande est traitée', 'rectification', 'limitation', 'CNIL']) expect(confidentialite.includes(attendu), attendu).toBeTruthy();
  for (const affirmation of [/Vercel agit ici comme sous-traitant/, /Vercel traite donc ces données comme responsable/]) expect(confidentialite, 'aucune affirmation non établie sur le rôle de Vercel').not.toMatch(affirmation);
  expect(confidentialite.includes(`href="${HEBERGEUR.confidentialite}"`), 'lien vers la politique de l’hébergeur').toBeTruthy();
  for (const href of ['/mentions-legales', 'https://vercel.com/docs/logs/runtime', 'https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3']) {
    expect(confidentialite.includes(`href="${href}"`), `confidentialité : référence accessible ${href}`).toBeTruthy();
  }
  for (const attendu of ['un délai d’un mois', 'deux mois', 'sans date d’expiration', 'L’envoi d’un message est facultatif', 'cela ne signifie pas que Vercel efface toutes ses données']) expect(confidentialite.includes(attendu), attendu).toBeTruthy();
  expect(confidentialite, 'ne pas affirmer l’absence de tout contrat ou prestataire').not.toMatch(/n’est fixée par aucun contrat|aucun script de suivi ni service tiers/);
  const mentions = await lire('mentions-legales/index.html');
  expect(mentions, 'plus de promesse « aucune donnée personnelle »').not.toMatch(/aucune donnée personnelle/);
  expect(mentions, 'base légale de l’anonymat citée').toMatch(/article 1-1, II de la loi n° 2004-575/);
});

test('aucun petit texte au-dessus des titres (sur-titre), sauf les titres de bloc eux-mêmes (D35)', async () => {
  // Restent permis : « Dans cet article » (sommaire), « L’essentiel en quelques mots » (encadré), « Au fil des
  // histoires » (menu mobile) : ce sont les titres de leur bloc, pas des textes posés au-dessus d’un titre.
  const permis = /(Dans cet article|L’essentiel en quelques mots|Au fil des histoires)/;
  const erreurs = [];
  for (const fichier of pages) {
    const html = await readFile(fichier, 'utf8');
    for (const [element] of html.matchAll(/<[^>]*class="[^"]*\bsur-titre\b[^"]*"[^>]*>[\s\S]*?<\/(p|h2|span)>/g)) {
      if (!permis.test(element)) erreurs.push(`${path.relative(racine, fichier)} : ${element.replace(/<[^>]+>/g, '').trim().slice(0, 40)}`);
    }
  }
  expect([...new Set(erreurs)]).toStrictEqual([]);
});

// Ordre de l'histoire (champ quete, D41) : série, chapitre, acte.
const ordreDeQuete = (a: ArticleSource, b: ArticleSource) => a.quete!.serie.localeCompare(b.quete!.serie, 'fr') || a.quete!.chapitre - b.quete!.chapitre || a.quete!.acte - b.quete!.acte;

test('pages de tag : les épisodes de quête d’abord, dans l’ordre de l’histoire', async () => {
  for (const { id } of tags) {
    const grille = (await lire(`lore/tags/${id}/index.html`)).split('data-grille-articles')[1]?.split('</main>')[0] ?? '';
    const liens = [...grille.matchAll(/href="\/lore\/([^"/]+)"/g)].map(m => m[1]);
    const episodes = articles.filter(a => a.tags.includes(id) && a.quete).sort(ordreDeQuete).map(a => a.id);
    expect(liens.slice(0, episodes.length), id).toStrictEqual(episodes);
  }
});

test('épisodes de quête : liens vers le précédent et le suivant de la série, rien pour les autres articles', async () => {
  for (const article of articles) {
    const html = await lire(`lore/${article.id}/index.html`);
    const navigation = html.split('data-episodes')[1]?.split('</nav>')[0];
    if (!article.quete) { expect(navigation, article.id).toBe(undefined); continue; }
    const serie = articles.filter(a => a.quete?.serie === article.quete!.serie).sort(ordreDeQuete);
    const position = serie.indexOf(article);
    const voisin = (rel: string) => (new RegExp(`href="/lore/([^"]+)"[^>]*rel="${rel}"`).exec(navigation))?.[1];
    expect(voisin('prev'), `${article.id} : précédent`).toBe(serie[position - 1]?.id);
    expect(voisin('next'), `${article.id} : suivant`).toBe(serie[position + 1]?.id);
  }
});

// Référencement (D50) : données structurées, balises article:*, lastmod du sitemap, flux RSS.
// JSON-LD lu tel quel : sa forme est justement ce que les tests vérifient ; ces types disent ce qu'ils en lisent.
type DonneesLd = Record<string, unknown> & { '@context': string; '@type': string };
interface BlogPosting { headline: string; url: string; image: string[]; datePublished: string; dateModified: string; keywords: string[] }
interface FilLd { itemListElement: { name: string; item: string }[] }
const donneesDe = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]) as DonneesLd);
const deType = (html: string, type: string) => donneesDe(html).find(d => d['@type'] === type);
const blogDe = (html: string) => deType(html, 'BlogPosting') as (DonneesLd & BlogPosting) | undefined;
const filDe = (html: string) => deType(html, 'BreadcrumbList') as (DonneesLd & FilLd) | undefined;
const meta = (html: string, propriete: string) => [...html.matchAll(new RegExp(`<meta property="${propriete}" content="([^"]*)"`, 'g'))].map(m => m[1]);
const decoder = (texte: string) => texte.replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

test('données structurées : JSON valide, contexte schema.org, aucune personne nommée', async () => {
  for (const page of pages) {
    for (const donnees of donneesDe(await readFile(page, 'utf8'))) {
      expect(donnees['@context'], page).toBe('https://schema.org');
      expect(JSON.stringify(donnees), page).not.toMatch(/"Person"/);
    }
  }
  expect(donneesDe(await lire('index.html')).map(d => d['@type'])).toStrictEqual(['WebSite']);
});

test('chaque article : BlogPosting et balises article:* conformes à la page, lastmod du sitemap à la même date', async () => {
  const sitemap = await lire('sitemap-0.xml');
  for (const article of articles) {
    const html = await lire(`lore/${article.id}/index.html`);
    const blog = blogDe(html);
    expect(blog, article.id).toBeTruthy();
    if (!blog) continue;
    expect(blog.headline, article.id).toBe(article.titre.replace(/\\"/g, '"'));
    expect(blog.url, article.id).toBe(/<link rel="canonical" href="([^"]+)"/.exec(html)![1]);
    expect(blog.image, article.id).toStrictEqual(meta(html, 'og:image'));
    expect(blog.datePublished.slice(0, 10), article.id).toBe(article.publieLe);
    expect(meta(html, 'article:published_time'), article.id).toStrictEqual([blog.datePublished]);
    expect(meta(html, 'article:modified_time'), article.id).toStrictEqual([blog.dateModified]);
    expect(meta(html, 'article:tag').map(decoder), article.id).toStrictEqual(blog.keywords);
    expect(meta(html, 'article:tag').length, article.id).toBe(article.tags.length);
    expect(meta(html, 'og:type'), article.id).toStrictEqual(['article']);
    expect([meta(html, 'og:image:width'), meta(html, 'og:image:height')], article.id).toStrictEqual([['1200'], ['630']]);
    const lastmod = (new RegExp(`<loc>[^<]+/lore/${article.id}</loc><lastmod>([^<]+)</lastmod>`).exec(sitemap))?.[1];
    expect(lastmod?.slice(0, 10), `${article.id} : lastmod`).toBe(blog.dateModified.slice(0, 10));
  }
});

test('hors articles : ni balise article:*, ni BlogPosting, ni lastmod dans le sitemap', async () => {
  for (const page of ['index.html', 'lore/index.html', 'lore/tags/regions/index.html', 'a-propos/index.html']) {
    const html = await lire(page);
    expect(meta(html, 'article:published_time'), page).toStrictEqual([]);
    expect(meta(html, 'og:type'), page).toStrictEqual(['website']);
    expect(!donneesDe(html).some(d => d['@type'] === 'BlogPosting'), page).toBeTruthy();
  }
  const avecDate = [...(await lire('sitemap-0.xml')).matchAll(/<loc>[^<]+?(\/[^<]*)<\/loc><lastmod>/g)].map(m => m[1].replace(/^\/\/[^/]+/, ''));
  expect(avecDate.sort()).toStrictEqual(articles.map(a => `/lore/${a.id}`).sort());
});

test('fil d’Ariane : décrit aux moteurs (BreadcrumbList) avec les mêmes étapes que la page', async () => {
  for (const page of [EXEMPLE, 'lore/tags/regions/index.html']) {
    const html = await lire(page);
    const fil = filDe(html);
    expect(fil, page).toBeTruthy();
    if (!fil) continue;
    const visibles = [...html.split('aria-label="Fil d’Ariane"')[1].split('</ol>')[0].matchAll(/<(?:a|span)\b[^>]*>([^<]+)<\/(?:a|span)>/g)].map(m => decoder(m[1]));
    expect(fil.itemListElement.map(e => e.name), page).toStrictEqual(visibles);
    expect(fil.itemListElement.at(-1)?.item, page).toBe(/<link rel="canonical" href="([^"]+)"/.exec(html)![1]);
  }
});

test('flux RSS : exactement les articles publiés, du plus récent au plus ancien, annoncé sur chaque page', async () => {
  const flux = await lire('rss.xml');
  expect(flux).toMatch(/<language>fr<\/language>/);
  const liens = [...flux.matchAll(/<item>.*?<link>https:\/\/[^/<]+(\/[^<]*)<\/link>/g)].map(m => m[1]);
  expect([...liens].sort()).toStrictEqual(articles.map(a => `/lore/${a.id}`).sort());
  const dates = [...flux.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map(m => Date.parse(m[1]));
  expect(dates).toStrictEqual([...dates].sort((a, b) => b - a));
  for (const page of ['index.html', EXEMPLE, 'a-propos/index.html']) expect(await lire(page), page).toMatch(/<link rel="alternate" type="application\/rss\+xml" title="[^"]+" href="\/rss\.xml"/);
});
