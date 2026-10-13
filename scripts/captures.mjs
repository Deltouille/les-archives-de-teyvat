// Captures d'écran et vérifications interactives, dans un navigateur headless (Brave par défaut) piloté par le
// protocole DevTools. Cf. documentation/decisions.md, D9.
//
//   astro dev --background                 le serveur doit tourner (les pages /demo n'existent qu'en dev)
//   npm run captures                       toutes les scènes, 3 largeurs × 2 thèmes → captures/actuel/
//   npm run captures -- --filtre menu      seulement les scènes dont le nom contient « menu »
//   npm run captures -- --reference        enregistre aussi les captures comme référence (captures/reference/)
//
// Sans --reference, chaque capture est comparée à sa référence si elle existe (octets identiques, ou écart de
// hauteur). Le script échoue si une vérification échoue. NAVIGATEUR=chromium pour changer de navigateur.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const option = nom => { const i = args.indexOf(`--${nom}`); return i === -1 ? undefined : (args[i + 1] ?? true); };
const BASE = option('base') ?? 'http://localhost:4321';
const FILTRE = option('filtre');
const REFERENCE = args.includes('--reference');
const SORTIE = path.resolve('captures/actuel');
const DOSSIER_REFERENCE = path.resolve('captures/reference');
const LARGEURS = [1440, 1024, 390];
const THEMES = ['clair', 'sombre'];

// Une scène : une page, des actions éventuelles, puis une capture (pleine page ou fenêtre) et des vérifications.
// `verifier` est du JavaScript évalué dans la page, qui renvoie la liste des problèmes (vide si tout va bien).
const SCENES = [
  { nom: 'accueil', url: '/' },
  { nom: 'demo', url: '/demo', largeurs: [1440, 390] },
  {
    nom: 'navigation-sur-banniere',
    url: '/demo/navigation',
    fenetre: true,
    verifier: `(() => {
      const barre = document.querySelector('[data-navbar]');
      const p = [];
      if (getComputedStyle(barre).position !== 'fixed') p.push('la barre devrait être fixed sur une page à bannière');
      if (!barre.hasAttribute('data-sur-image')) p.push('la barre devrait être transparente en haut de la bannière');
      return p;
    })()`,
  },
  {
    nom: 'navigation-apres-defilement',
    url: '/demo/navigation',
    fenetre: true,
    actions: `window.scrollTo(0, innerHeight * 1.5); await attendre(400);`,
    verifier: `(() => document.querySelector('[data-navbar]').hasAttribute('data-sur-image') ? ['la barre devrait être opaque une fois la bannière passée'] : [])()`,
  },
  {
    nom: 'menu-lore-au-clavier',
    url: '/',
    largeurs: [1440, 1024],
    fenetre: true,
    actions: `document.querySelector('[data-lien-lore]').focus(); await attendre(300);`,
    verifier: `(() => {
      const menu = getComputedStyle(document.querySelector('[data-menu-lore]'));
      return menu.visibility === 'visible' && menu.opacity === '1' ? [] : ['le menu « Le lore » devrait s’ouvrir au focus clavier'];
    })()`,
  },
  {
    nom: 'menu-mobile-ouvert',
    url: '/demo/navigation',
    largeurs: [390],
    fenetre: true,
    actions: `
      window.scrollTo(0, 400); await attendre(200);
      window.__defilement = scrollY;
      document.querySelector('[aria-controls="menu-mobile"]').click(); await attendre(300);`,
    verifier: `(() => {
      const p = [];
      const panneau = document.getElementById('menu-mobile').getBoundingClientRect();
      if (Math.round(panneau.bottom) !== innerHeight || panneau.top > 70) p.push('le panneau devrait couvrir l’écran sous la barre (' + Math.round(panneau.top) + '→' + Math.round(panneau.bottom) + ')');
      if (getComputedStyle(document.body).overflow !== 'hidden') p.push('le défilement de la page devrait être bloqué');
      if (document.querySelector('[data-navbar]').hasAttribute('data-sur-image')) p.push('la barre devrait être opaque menu ouvert');
      return p;
    })()`,
  },
  {
    nom: 'menu-mobile-referme',
    url: '/demo/navigation',
    largeurs: [390],
    fenetre: true,
    actions: `
      window.scrollTo(0, 400); await attendre(200);
      window.__defilement = scrollY;
      document.querySelector('[aria-controls="menu-mobile"]').click(); await attendre(200);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await attendre(300);`,
    verifier: `(() => {
      const p = [];
      const burger = document.querySelector('[aria-controls="menu-mobile"]');
      if (!document.getElementById('menu-mobile').hidden) p.push('Échap devrait fermer le menu');
      if (scrollY !== window.__defilement) p.push('le défilement a sauté : ' + window.__defilement + ' → ' + scrollY);
      if (document.activeElement !== burger) p.push('le focus devrait revenir sur le bouton du menu');
      if (burger.getAttribute('aria-expanded') !== 'false') p.push('aria-expanded devrait repasser à false');
      return p;
    })()`,
  },
  {
    nom: 'bascule-du-theme',
    url: '/',
    largeurs: [1440],
    fenetre: true,
    actions: `window.__avant = document.documentElement.dataset.theme; document.querySelector('[data-bouton-theme]').click(); await attendre(200);`,
    verifier: `(() => {
      const p = [];
      const apres = document.documentElement.dataset.theme;
      if (apres === window.__avant) p.push('le thème devrait basculer');
      if (localStorage.getItem('genshin-theme') !== apres) p.push('le choix devrait être mémorisé');
      if (document.querySelector('[data-bouton-theme]').getAttribute('aria-pressed') !== String(apres === 'dark')) p.push('aria-pressed devrait suivre le thème');
      localStorage.clear();
      return p;
    })()`,
  },
];

// Vérifications communes à toutes les captures.
const VERIFICATIONS_COMMUNES = `(() => document.documentElement.scrollWidth > innerWidth ? ['défilement horizontal : ' + document.documentElement.scrollWidth + ' px pour ' + innerWidth] : [])()`;

// --- Protocole DevTools, juste ce qu'il faut ---

async function lancerNavigateur() {
  const profil = await mkdtemp(path.join(tmpdir(), 'captures-'));
  const port = 9300 + Math.floor(Math.random() * 600);
  const processus = spawn(process.env.NAVIGATEUR ?? 'brave', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`, '--hide-scrollbars', '--disable-gpu', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  for (let essai = 0; essai < 50; essai++) {
    try {
      const cibles = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = cibles.find(c => c.type === 'page');
      if (page) return { url: page.webSocketDebuggerUrl, fermer: async () => { processus.kill(); await rm(profil, { recursive: true, force: true }); } };
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  processus.kill();
  throw new Error('Le navigateur headless ne répond pas (NAVIGATEUR=… pour en choisir un autre).');
}

function connecter(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const attente = new Map();
  const ecouteurs = new Map();
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && attente.has(message.id)) {
      const { resoudre, rejeter } = attente.get(message.id);
      attente.delete(message.id);
      message.error ? rejeter(new Error(message.error.message)) : resoudre(message.result);
    } else if (message.method) ecouteurs.get(message.method)?.splice(0).forEach(f => f(message.params));
  });
  const envoyer = (method, params = {}) => new Promise((resoudre, rejeter) => { attente.set(++id, { resoudre, rejeter }); ws.send(JSON.stringify({ id, method, params })); });
  const evenement = method => new Promise(resoudre => { if (!ecouteurs.has(method)) ecouteurs.set(method, []); ecouteurs.get(method).push(resoudre); });
  return new Promise((resoudre, rejeter) => {
    ws.addEventListener('open', () => resoudre({ envoyer, evenement, fermer: () => ws.close() }));
    ws.addEventListener('error', rejeter);
  });
}

async function evaluer(cdp, expression) {
  const { result, exceptionDetails } = await cdp.envoyer('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
}

const hauteurPng = octets => octets.readUInt32BE(20);

// --- Déroulé ---

await mkdir(SORTIE, { recursive: true });
if (REFERENCE) await mkdir(DOSSIER_REFERENCE, { recursive: true });
const navigateur = await lancerNavigateur();
const cdp = await connecter(navigateur.url);
await cdp.envoyer('Page.enable');
await cdp.envoyer('Runtime.enable');

const problemes = [];
const ecarts = [];
let nombre = 0;
try {
  for (const scene of SCENES.filter(s => !FILTRE || s.nom.includes(FILTRE))) {
    for (const largeur of scene.largeurs ?? LARGEURS) {
      for (const theme of THEMES) {
        const nom = `${scene.nom}-${largeur}-${theme}`;
        const hauteurFenetre = largeur < 600 ? 844 : 900;
        await cdp.envoyer('Emulation.setDeviceMetricsOverride', { width: largeur, height: hauteurFenetre, deviceScaleFactor: 1, mobile: largeur < 600 });
        // Mouvement réduit : les transitions sont instantanées, la capture ne tombe pas au milieu d'une animation.
        await cdp.envoyer('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme === 'sombre' ? 'dark' : 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
        // En dev, Vite peut recharger la page au premier passage (optimisation des dépendances) : on rejoue la scène.
        let trouves;
        for (let essai = 1; ; essai++) {
          try {
            const charge = cdp.evenement('Page.loadEventFired');
            await cdp.envoyer('Page.navigate', { url: new URL(scene.url, BASE).href });
            await charge;
            await evaluer(cdp, `document.fonts.ready.then(() => new Promise(r => setTimeout(r, 150)))`);
            if (scene.actions) await evaluer(cdp, `(async () => { const attendre = ms => new Promise(r => setTimeout(r, ms)); ${scene.actions} })()`);
            trouves = [];
            for (const verification of [VERIFICATIONS_COMMUNES, scene.verifier].filter(Boolean)) trouves.push(...await evaluer(cdp, verification));
            break;
          } catch (erreur) {
            if (essai === 3 || !/navigated|closed|context/i.test(erreur.message)) throw erreur;
            await new Promise(r => setTimeout(r, 1500));
          }
        }
        for (const probleme of trouves) problemes.push(`${nom} : ${probleme}`);

        if (!scene.fenetre) {
          const { cssContentSize } = await cdp.envoyer('Page.getLayoutMetrics');
          await cdp.envoyer('Emulation.setDeviceMetricsOverride', { width: largeur, height: Math.ceil(cssContentSize.height), deviceScaleFactor: 1, mobile: largeur < 600 });
        }
        const { data } = await cdp.envoyer('Page.captureScreenshot', { format: 'png' });
        const octets = Buffer.from(data, 'base64');
        await writeFile(path.join(SORTIE, `${nom}.png`), octets);
        nombre++;

        if (REFERENCE) await copyFile(path.join(SORTIE, `${nom}.png`), path.join(DOSSIER_REFERENCE, `${nom}.png`));
        else {
          const reference = await readFile(path.join(DOSSIER_REFERENCE, `${nom}.png`)).catch(() => null);
          if (reference && !reference.equals(octets)) {
            const delta = hauteurPng(octets) - hauteurPng(reference);
            ecarts.push(`${nom}${delta ? ` (hauteur ${delta > 0 ? '+' : ''}${delta} px)` : ''}`);
          }
        }
      }
    }
  }
} finally {
  cdp.fermer();
  await navigateur.fermer();
}

console.log(`${nombre} captures dans ${path.relative(process.cwd(), SORTIE)}/${REFERENCE ? ', copiées comme référence' : ''}.`);
if (ecarts.length) console.log(`Différentes de la référence (à regarder) :\n  ${ecarts.join('\n  ')}`);
if (problemes.length) {
  console.error(`\n${problemes.length} vérification(s) en échec :\n  ${problemes.join('\n  ')}`);
  process.exitCode = 1;
} else console.log('Toutes les vérifications passent.');
