// Captures d'écran et vérifications interactives, dans un navigateur headless (Brave par défaut) piloté par le
// protocole DevTools. Cf. documentation/decisions.md, D9.
//
//   astro dev --background                 le serveur doit tourner (les pages /demo n'existent qu'en dev)
//   npm run captures                       toutes les scènes, 3 largeurs × 2 thèmes → captures/actuel/
//   npm run captures -- --filtre menu      seulement les scènes dont le nom contient « menu »
//   npm run captures -- --reference        enregistre aussi les captures comme référence (captures/reference/)
//
// Chaque page est aussi auditée par axe-core (WCAG 2.2 A et AA, plus les bonnes pratiques) : toute violation fait
// échouer le script. `audit: false` sur une scène pour l'en dispenser.
//
// Sans --reference, chaque capture est comparée à sa référence si elle existe (octets identiques, ou écart de
// hauteur). Le script échoue si une vérification échoue. Contre `astro preview` (--base), les scènes /demo, qui n'existent
// qu'en dev, sont sautées et signalées. NAVIGATEUR=chromium pour changer de navigateur.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { articleExemple } from '../tests/sources.mjs';

const args = process.argv.slice(2);
const option = nom => { const i = args.indexOf(`--${nom}`); return i === -1 ? undefined : (args[i + 1] ?? true); };
const BASE = option('base') ?? 'http://localhost:4321';
const FILTRE = option('filtre');
const REFERENCE = args.includes('--reference');
const SORTIE = path.resolve('captures/actuel');
const DOSSIER_REFERENCE = path.resolve('captures/reference');
const LARGEURS = [1440, 1024, 390];
const THEMES = ['clair', 'sombre'];
// Article d'exemple (le publié qui a le plus de sections) et mot à y chercher (le plus long mot de son titre) :
// aucune scène ne dépend d'un article précis (D30).
const EXEMPLE = await articleExemple();
const ARTICLE = `/lore/${EXEMPLE.id}`;
const MOT = EXEMPLE.titre.split(/[^\p{L}]+/u).sort((a, b) => b.length - a.length)[0];

// Une scène : une page, des actions éventuelles, puis une capture (pleine page ou fenêtre) et des vérifications.
// `clavier` : vraies frappes envoyées après les actions, par le protocole DevTools — { touche, ctrl? }, { texte } ou
// { attendre: ms }. Un .focus() par script ne déclenche pas :focus-visible, une vraie touche Tab si.
// `navigation` : sélecteur d'un lien cliqué ensuite ; la scène continue sur la nouvelle page, où window.__transition
// dit si le navigateur l'a révélée par une View Transition (événement pagereveal). `hauteur` : hauteur de fenêtre (sinon 844 en mobile, 900 au-delà). `mouvement: true` : pas d'émulation du mouvement réduit (pour tester une animation). `verifier` est du JavaScript évalué dans la page, qui renvoie la liste des problèmes (vide si tout va bien).
// Le contenu doit rester accessible même en paysage et avec le texte agrandi.
const VERIFIER_HERO = `(() => {
  const problemes = [];
  const titre = document.querySelector('#accueil-titre').getBoundingClientRect();
  const barre = document.querySelector('[data-navbar]').getBoundingClientRect();
  const carte = document.querySelector('[data-statistiques]').getBoundingClientRect();
  const hero = document.querySelector('[data-hero]').getBoundingClientRect();
  const actions = document.querySelector('[data-actions-accueil]').getBoundingClientRect();
  const vague = document.querySelector('[data-hero] > svg').getBoundingClientRect();
  if (titre.top < barre.bottom + 16) problemes.push('le titre est trop proche de la navigation : ' + Math.round(titre.top - barre.bottom) + ' px');
  if (actions.bottom > vague.top) problemes.push('les boutons passent sous la vague');
  if (carte.top < hero.bottom) problemes.push('la carte de statistiques chevauche le hero');
  for (const chiffre of document.querySelectorAll('[data-chiffres] li')) {
    if (chiffre.scrollWidth > chiffre.clientWidth) problemes.push('un libellé de chiffre déborde');
  }
  for (const lien of document.querySelectorAll('[data-actions-accueil] a')) {
    const cadre = lien.getBoundingClientRect();
    if (cadre.height < 48) problemes.push('une cible tactile mesure moins de 48 px');
    if (cadre.left < 0 || cadre.right > innerWidth) problemes.push('un bouton sort de l’écran');
  }
  return problemes;
})()`;

const SCENES = [
  { nom: 'accueil', url: '/', verifier: VERIFIER_HERO },
  { nom: 'accueil-paysage', url: '/', largeurs: [667, 844], hauteur: 390, fenetre: true, verifier: VERIFIER_HERO },
  { nom: 'accueil-intermediaire', url: '/', largeurs: [600, 840, 1920], fenetre: true, verifier: VERIFIER_HERO },
  { nom: 'accueil-texte-agrandi', url: '/', largeurs: [320, 1024], actions: "document.documentElement.style.fontSize = '200%'", verifier: VERIFIER_HERO },
  { nom: 'demo', url: '/demo', largeurs: [1440, 390] },
  {
    nom: 'accueil-haut',
    url: '/',
    fenetre: true,
    verifier: `(() => document.querySelector('[data-navbar]').hasAttribute('data-sur-image') ? [] : ['la barre devrait être transparente sur la bannière d’accueil'])()`,
  },
  {
    // Petit téléphone : le hero s'allonge pour garder les actions au-dessus de la vague.
    nom: 'accueil-petit-ecran',
    url: '/',
    largeurs: [320],
    hauteur: 568,
    fenetre: true,
    verifier: VERIFIER_HERO,
  },
  {
    nom: 'accueil-statistiques',
    url: '/',
    largeurs: [320, 390, 840, 1440],
    fenetre: true,
    actions: "document.querySelector('[data-statistiques]').scrollIntoView();",
    verifier: `(() => {
      const carte = document.querySelector('[data-statistiques]').getBoundingClientRect();
      const barre = document.querySelector('[data-navbar]').getBoundingClientRect();
      return carte.top >= barre.bottom && carte.bottom <= innerHeight ? [] : ['la carte de statistiques doit être visible en entier'];
    })()`,
  },
  {
    nom: 'recherche-au-clavier',
    url: '/lore',
    largeurs: [1440, 1024],
    fenetre: true,
    clavier: [{ touche: 'k', ctrl: true }, { texte: MOT }, { attendre: 1200 }],
    verifier: `(() => {
      const p = [];
      const dialogue = document.getElementById('recherche');
      if (!dialogue.open) return ['Ctrl K devrait ouvrir la recherche'];
      if (document.activeElement?.id !== 'recherche-champ') p.push('le focus devrait être dans le champ');
      if (!dialogue.querySelector('[data-resultats] a[href^="' + ${JSON.stringify(ARTICLE)} + '"]')) p.push('« ' + ${JSON.stringify(MOT)} + ' » devrait trouver ' + ${JSON.stringify(ARTICLE)} + ' (état : ' + dialogue.querySelector('[data-etat]').textContent + ')');
      if (!/résultat/.test(dialogue.querySelector('[data-etat]').textContent)) p.push('le nombre de résultats devrait être annoncé');
      if (getComputedStyle(document.body).overflow !== 'hidden') p.push('la page derrière devrait être bloquée');
      return p;
    })()`,
  },
  {
    nom: 'recherche-mobile',
    url: '/lore',
    largeurs: [390],
    fenetre: true,
    actions: `
      window.__bouton = [...document.querySelectorAll('[data-recherche]')].find(b => b.offsetParent);
      window.__bouton.focus(); window.__bouton.click(); await attendre(200);`,
    clavier: [{ texte: 'zzqxw' }, { attendre: 1200 }],
    verifier: `(() => {
      const p = [];
      const dialogue = document.getElementById('recherche');
      if (!dialogue.open) return ['le bouton icône devrait ouvrir la recherche'];
      if (!/Aucun résultat/.test(dialogue.querySelector('[data-etat]').textContent)) p.push('une recherche vaine devrait être annoncée');
      const r = dialogue.getBoundingClientRect();
      if (r.left < 0 || r.right > innerWidth) p.push('la fenêtre devrait tenir dans l’écran');
      return p;
    })()`,
  },
  {
    nom: 'recherche-fermeture',
    url: '/lore',
    largeurs: [390],
    fenetre: true,
    actions: `
      window.__bouton = [...document.querySelectorAll('[data-recherche]')].find(b => b.offsetParent);
      window.__bouton.focus(); window.__bouton.click(); await attendre(200);`,
    clavier: [{ touche: 'Escape' }],
    verifier: `(() => {
      const p = [];
      if (document.getElementById('recherche').open) p.push('Échap devrait fermer la recherche');
      if (document.activeElement !== window.__bouton) p.push('le focus devrait revenir au bouton de recherche');
      if (getComputedStyle(document.body).overflow === 'hidden') p.push('la page devrait se débloquer');
      return p;
    })()`,
  },
  {
    nom: 'transition-vers-article',
    url: '/lore',
    largeurs: [1440, 390],
    fenetre: true,
    mouvement: true,
    navigation: `[data-grille-articles] a[href="${ARTICLE}"]`,
    verifier: `(() => {
      const p = [];
      if (location.pathname !== ${JSON.stringify(ARTICLE)}) p.push('le clic sur la carte devrait mener à l’article (' + location.pathname + ')');
      if (window.__transition !== true) p.push('l’article devrait être révélé par une View Transition (' + window.__transition + ')');
      return p;
    })()`,
  },
  {
    nom: 'transition-mouvement-reduit',
    url: '/lore',
    largeurs: [1440],
    fenetre: true,
    navigation: `[data-grille-articles] a[href="${ARTICLE}"]`,
    verifier: `(() => window.__transition === false ? [] : ['en mouvement réduit, pas de View Transition (' + window.__transition + ')'])()`,
  },
  { nom: 'bibliotheque', url: '/lore' },
  { nom: 'article', url: ARTICLE },
  {
    nom: 'article-haut',
    url: ARTICLE,
    fenetre: true,
    verifier: `(() => document.querySelector('[data-navbar]').hasAttribute('data-sur-image') ? [] : ['la barre devrait être transparente sur la bannière de l’article'])()`,
  },
  {
    nom: 'progression-lecture',
    url: ARTICLE,
    largeurs: [1440, 390],
    fenetre: true,
    actions: `
      const article = document.querySelector('[data-lecture]');
      // Largeur réellement affichée (et non la valeur d'une propriété CSS, qui peut être annulée par une autre).
      const echelle = () => Math.round(document.querySelector('[data-progression]').getBoundingClientRect().width / innerWidth * 100) / 100;
      const debut = article.getBoundingClientRect().top + scrollY - 64;
      const parcours = article.offsetHeight - innerHeight + 64;
      window.__mesures = { debut: echelle() };
      scrollTo(0, debut + parcours + 20); await attendre(150); window.__mesures.fin = echelle();
      scrollTo(0, document.documentElement.scrollHeight); await attendre(150); window.__mesures.bas = echelle();
      scrollTo(0, debut + parcours / 2); await attendre(150); window.__mesures.milieu = echelle();`,
    verifier: `(() => {
      const { debut, milieu, fin, bas } = window.__mesures;
      const p = [];
      if (debut !== 0) p.push('la barre devrait être vide en haut de page (' + debut + ')');
      if (!(milieu > 0.4 && milieu < 0.6)) p.push('la barre devrait être à moitié au milieu de l’article (' + milieu.toFixed(2) + ')');
      if (fin !== 1 || bas !== 1) p.push('la barre devrait être pleine à la fin de l’article et au-delà (' + fin + ', ' + bas + ')');
      return p;
    })()`,
  },
  {
    nom: 'sommaire-section-active',
    url: ARTICLE,
    largeurs: [1440],
    fenetre: true,
    actions: `
      const titre = document.querySelectorAll('.prose h2[id]')[1];
      scrollTo(0, titre.getBoundingClientRect().top + scrollY - 90); await attendre(150);
      window.__attendu = '#' + encodeURIComponent(titre.id);`,
    verifier: `(() => {
      const actifs = [...document.querySelectorAll('[data-sommaire] a[aria-current="true"]')].map(a => a.hash);
      return actifs.length === 2 && actifs.every(h => h === window.__attendu) ? [] : ['le deuxième titre devrait être la section active des deux sommaires (' + actifs.join(', ') + ')'];
    })()`,
  },
  {
    nom: 'sommaire-clic',
    url: ARTICLE,
    largeurs: [1440, 390],
    fenetre: true,
    actions: `
      const nav = [...document.querySelectorAll('[data-sommaire]')].find(n => n.closest('details') ? getComputedStyle(n.closest('details')).display !== 'none' : n.offsetParent);
      nav.closest('details')?.setAttribute('open', '');
      window.__lien = nav.querySelectorAll('a')[2];
      window.__lien.click(); await attendre(300);`,
    verifier: `(() => {
      const p = [];
      const titre = document.getElementById(decodeURIComponent(window.__lien.hash.slice(1)));
      const haut = titre.getBoundingClientRect().top;
      if (haut < 64 || haut > 160) p.push('le titre visé devrait apparaître sous la barre de navigation, pas dessous (haut : ' + Math.round(haut) + ' px)');
      if (window.__lien.getAttribute('aria-current') !== 'true') p.push('le lien cliqué devrait devenir la section active');
      return p;
    })()`,
  },
  { nom: 'index-des-tags', url: '/lore/tags' },
  { nom: 'tag-theme', url: '/lore/tags/regions', largeurs: [1440, 390] },
  { nom: 'tag-simple', url: '/lore/tags/mondstadt', largeurs: [1440, 390] },
  { nom: 'a-propos', url: '/a-propos', largeurs: [1440, 390] },
  { nom: 'confidentialite', url: '/confidentialite', largeurs: [1440, 390] },
  { nom: 'credits', url: '/credits', largeurs: [1440, 390] },
  { nom: 'mentions-legales', url: '/mentions-legales', largeurs: [1440, 390] },
  { nom: 'page-introuvable', url: '/cette-page-n-existe-pas', largeurs: [1440, 390] },
  {
    nom: 'carte-au-clavier',
    url: '/lore',
    largeurs: [1440],
    fenetre: true,
    // On part de la dernière puce de filtre : une tabulation mène au lien de la première carte.
    actions: `document.querySelector('nav[aria-label="Filtrer par thème"] a:last-child').focus();`,
    clavier: [{ touche: 'Tab' }],
    verifier: `(() => {
      const carte = document.querySelector('[data-grille-articles] article');
      const style = getComputedStyle(carte);
      return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2 ? [] : ['le focus clavier sur une carte devrait dessiner un contour (' + style.outlineStyle + ' ' + style.outlineWidth + ')'];
    })()`,
  },
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
      // Fermeture : attendre la fin réelle du navigateur, qui écrit encore dans son profil juste après le signal ;
      // sinon la suppression du profil échoue par intermittence (ENOTEMPTY).
      if (page) return { url: page.webSocketDebuggerUrl, fermer: async () => {
        const fini = new Promise(r => processus.once('exit', r));
        processus.kill();
        await Promise.race([fini, new Promise(r => setTimeout(r, 5000))]);
        await rm(profil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      } };
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

// Audit d'accessibilité : axe-core injecté dans la page, règles WCAG 2.2 A/AA et bonnes pratiques.
const SOURCE_AXE = await readFile(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
async function auditer(cdp) {
  await evaluer(cdp, `if (!window.axe) { ${SOURCE_AXE} }`);
  return evaluer(cdp, `axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] })
    .then(r => r.violations.map(v => 'axe ' + v.id + ' (' + v.impact + ') : ' + v.help + ' → ' + v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')))`);
}

const CODES = { Tab: ['Tab', 9], Escape: ['Escape', 27], Enter: ['Enter', 13], k: ['KeyK', 75] };
async function clavier(cdp, etape) {
  if (etape.attendre) return evaluer(cdp, `new Promise(r => setTimeout(r, ${etape.attendre}))`);
  if (etape.texte) return cdp.envoyer('Input.insertText', { text: etape.texte });
  const [code, windowsVirtualKeyCode] = CODES[etape.touche];
  for (const type of ['keyDown', 'keyUp']) {
    await cdp.envoyer('Input.dispatchKeyEvent', { type, key: etape.touche, code, windowsVirtualKeyCode, modifiers: etape.ctrl ? 2 : 0 });
  }
}

// --- Déroulé ---

// Les pages d'outillage /demo n'existent qu'avec `astro dev`.
const avecDemo = (await fetch(new URL('/demo', BASE)).catch(() => null))?.ok ?? false;
const sautees = SCENES.filter(s => (!FILTRE || s.nom.includes(FILTRE)) && !avecDemo && s.url.startsWith('/demo')).map(s => s.nom);

await mkdir(SORTIE, { recursive: true });
if (REFERENCE) await mkdir(DOSSIER_REFERENCE, { recursive: true });
const navigateur = await lancerNavigateur();
const cdp = await connecter(navigateur.url);
await cdp.envoyer('Page.enable');
await cdp.envoyer('Runtime.enable');
// Sur chaque nouveau document : la page a-t-elle été révélée par une View Transition ?
await cdp.envoyer('Page.addScriptToEvaluateOnNewDocument', { source: "addEventListener('pagereveal', e => { window.__transition = Boolean(e.viewTransition); })" });

const problemes = [];
const ecarts = [];
let nombre = 0;
try {
  for (const scene of SCENES.filter(s => (!FILTRE || s.nom.includes(FILTRE)) && !sautees.includes(s.nom))) {
    for (const largeur of scene.largeurs ?? LARGEURS) {
      for (const theme of THEMES) {
        const nom = `${scene.nom}-${largeur}-${theme}`;
        const hauteurFenetre = scene.hauteur ?? (largeur < 600 ? 844 : 900);
        await cdp.envoyer('Emulation.setDeviceMetricsOverride', { width: largeur, height: hauteurFenetre, deviceScaleFactor: 1, mobile: largeur < 600 });
        // Mouvement réduit : les transitions sont instantanées, la capture ne tombe pas au milieu d'une animation.
        await cdp.envoyer('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme === 'sombre' ? 'dark' : 'light' }, { name: 'prefers-reduced-motion', value: scene.mouvement ? 'no-preference' : 'reduce' }] });
        // En dev, Vite peut recharger la page au premier passage (optimisation des dépendances) : on rejoue la scène.
        let trouves;
        for (let essai = 1; ; essai++) {
          try {
            const charge = cdp.evenement('Page.loadEventFired');
            await cdp.envoyer('Page.navigate', { url: new URL(scene.url, BASE).href });
            await charge;
            await evaluer(cdp, `document.fonts.ready.then(() => new Promise(r => setTimeout(r, 150)))`);
            if (scene.actions) await evaluer(cdp, `(async () => { const attendre = ms => new Promise(r => setTimeout(r, ms)); ${scene.actions} })()`);
            for (const etape of scene.clavier ?? []) await clavier(cdp, etape);
            if (scene.clavier) await evaluer(cdp, `new Promise(r => setTimeout(r, 200))`);
            if (scene.navigation) {
              const arrivee = cdp.evenement('Page.loadEventFired');
              await evaluer(cdp, `document.querySelector(${JSON.stringify(scene.navigation)}).click()`);
              await arrivee;
              await evaluer(cdp, `new Promise(r => setTimeout(r, 700))`);
            }
            trouves = [];
            for (const verification of [VERIFICATIONS_COMMUNES, scene.verifier].filter(Boolean)) trouves.push(...await evaluer(cdp, verification));
            if (scene.audit !== false) trouves.push(...await auditer(cdp));
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
          // Les images en loading="lazy" ne partent qu'une fois la fenêtre agrandie : on attend qu'elles soient toutes là.
          await evaluer(cdp, `Promise.race([Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; }))), new Promise(r => setTimeout(r, 5000))]).then(() => new Promise(r => setTimeout(r, 100)))`);
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
if (sautees.length) console.log(`Scènes sautées (pages /demo absentes, serveur autre que astro dev) : ${sautees.join(', ')}.`);
if (ecarts.length) console.log(`Différentes de la référence (à regarder) :\n  ${ecarts.join('\n  ')}`);
if (problemes.length) {
  console.error(`\n${problemes.length} vérification(s) en échec :\n  ${problemes.join('\n  ')}`);
  process.exitCode = 1;
} else console.log('Toutes les vérifications passent.');
