// @ts-check
import { defineConfig } from 'astro/config';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import tailwindcss from '@tailwindcss/vite';
import { REDIRECTIONS } from './src/lib/redirections.mjs';
import { homonymes } from './src/lib/identifiant.mjs';
import { imagesParNom, variantesDesImages } from './src/lib/images-markdown.mjs';
import { imagesDuCorps, nomDImage } from './src/lib/images.mjs';

const TYPES = { '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };

/**
 * Outillage du serveur de dev, jamais dans dist/ (cf. documentation/decisions.md, D7 et D13) :
 * - les pages /demo* ;
 * - articles déplacés : l'identifiant venant du seul nom de fichier, le départ de l'ancien chemin effaçait l'article
 *   relu au nouveau ; on relit ses homonymes après chaque suppression (D25) ;
 * - images du corps : un article qui les cite est relu quand elles arrivent ou partent (D48) ;
 * - l'index de recherche du dernier build (dist/pagefind), servi sous /pagefind : Pagefind ne s'exécute qu'après
 *   `astro build`, sans cela la recherche serait inutilisable en dev. Index absent → 404, la recherche le signale.
 */
const outillageDeDev = () => ({
  name: 'outillage-de-dev',
  hooks: {
    /** @param {{ command: string, injectRoute: (route: { pattern: string, entrypoint: string }) => void }} options */
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/demo', entrypoint: './src/demo/Demo.astro' });
      injectRoute({ pattern: '/demo/navigation', entrypoint: './src/demo/Navigation.astro' });
    },
    /** @param {{ server: import('vite').ViteDevServer }} options */
    'astro:server:setup': ({ server }) => {
      const articles = path.resolve('src/content/articles');
      server.watcher.on('unlink', supprime => {
        if (!supprime.startsWith(articles + path.sep) || !supprime.endsWith('.md')) return;
        // Après le traitement de la suppression par le chargeur de contenu.
        setTimeout(async () => {
          const fichiers = (await readdir(articles, { recursive: true })).filter(f => f.endsWith('.md'));
          for (const fichier of homonymes(fichiers, path.relative(articles, supprime))) server.watcher.emit('change', path.join(articles, fichier));
        }, 300);
      });
      // Images citées dans le corps (D48) : le chargeur ne refait le rendu d'un article que si son texte change. Un
      // article qui cite une image pas encore ajoutée garderait son rendu raté (corps vide) ; on relit donc les
      // articles qui citent une image ajoutée, supprimée ou remplacée. Effacer puis relire : une simple relecture serait
      // ignorée, le texte n'ayant pas changé.
      const images = path.resolve('src/assets/images');
      /** @param {string} image */
      const relireLesArticlesQuiCitent = async image => {
        if (!image.startsWith(images + path.sep) || !image.endsWith('.webp')) return;
        const nom = nomDImage(image.split(path.sep).join('/'));
        const fichiers = (await readdir(articles, { recursive: true })).filter(f => f.endsWith('.md')).map(f => path.join(articles, f));
        for (const fichier of fichiers) {
          if (!imagesDuCorps(await readFile(fichier, 'utf8')).some(({ nom: cite }) => cite === nom)) continue;
          server.watcher.emit('unlink', fichier);
          setTimeout(() => server.watcher.emit('change', fichier), 300);
        }
      };
      for (const evenement of ['add', 'unlink', 'change']) server.watcher.on(evenement, relireLesArticlesQuiCitent);
      const racine = path.resolve('dist/pagefind');
      server.middlewares.use('/pagefind', async (requete, reponse, suite) => {
        const fichier = path.join(racine, decodeURIComponent((requete.url ?? '/').split('?')[0]));
        if (!fichier.startsWith(racine)) return suite();
        try {
          const contenu = await readFile(fichier);
          reponse.setHeader('Content-Type', TYPES[/** @type {keyof typeof TYPES} */ (path.extname(fichier))] ?? 'application/octet-stream');
          reponse.end(contenu);
        } catch {
          reponse.statusCode = 404;
          reponse.end();
        }
      });
    },
  },
});

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://l-histoire-de-genshin-expliquee.vercel.app',
  output: 'static',
  // Une seule forme d'URL, sans barre finale, comme tous les liens internes : canonique et sitemap comprises (D15).
  trailingSlash: 'never',
  integrations: [sitemap({ filter: page => !page.endsWith('/404/') }), outillageDeDev()],
  // Dans un article, ![texte](<nom>) cite une image de src/assets/images par son nom, comme le frontmatter (D48).
  markdown: { processor: satteri({ mdastPlugins: [imagesParNom], hastPlugins: [variantesDesImages] }) },
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
  // Anciennes URL, listes figées : aucune adresse publiée ne disparaît.
  redirects: REDIRECTIONS,
});
