// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://l-histoire-de-genshin-expliquee.vercel.app',
  output: 'static',
  integrations: [sitemap({ filter: page => !page.endsWith('/404/') })],
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});
