import type { APIRoute } from 'astro';

// Généré pour que l'adresse du sitemap suive SITE_URL.
export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
