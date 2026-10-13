// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/** Pages d'outillage servies par `astro dev` seulement : jamais dans dist/ (cf. documentation/decisions.md, D7). */
const pagesDeDev = () => ({
  name: 'pages-de-dev',
  hooks: {
    /** @param {{ command: string, injectRoute: (route: { pattern: string, entrypoint: string }) => void }} options */
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev') injectRoute({ pattern: '/demo', entrypoint: './src/demo/Demo.astro' });
    },
  },
});

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://l-histoire-de-genshin-expliquee.vercel.app',
  output: 'static',
  integrations: [sitemap({ filter: page => !page.endsWith('/404/') }), pagesDeDev()],
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});
