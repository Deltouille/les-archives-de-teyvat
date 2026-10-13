// @ts-check
import { defineConfig } from 'astro/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { REDIRECTIONS } from './src/lib/redirections.mjs';

const TYPES = { '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };

/**
 * Outillage du serveur de dev, jamais dans dist/ (cf. documentation/decisions.md, D7 et D13) :
 * - les pages /demo* ;
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
  integrations: [sitemap({ filter: page => !page.endsWith('/404/') }), outillageDeDev()],
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
  // Anciennes URL, listes figées : aucune adresse publiée ne disparaît.
  redirects: REDIRECTIONS,
});
