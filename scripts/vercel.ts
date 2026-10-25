// Génère vercel.json : vraies redirections 301 pour les anciennes URL (src/lib/redirections.ts), une seule forme
// d'URL sans barre finale, cache long des fichiers versionnés, en-têtes de sécurité. Cf. documentation/decisions.md, D15.
//
//   npm run vercel        régénère vercel.json (tests/vercel.test.ts vérifie qu'il est à jour)
//
// Les pages de redirection générées par Astro restent dans dist/ : elles servent ailleurs que sur Vercel.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { REDIRECTIONS } from '../src/lib/redirections.ts';

export function configVercel() {
  return {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    // Le build inclut l'index de recherche (pagefind) : surtout pas un simple `astro build`.
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    trailingSlash: false,
    redirects: Object.entries(REDIRECTIONS).map(([source, destination]) => ({ source, destination, statusCode: 301 })),
    headers: [
      // Noms de fichiers versionnés par Astro (empreinte dans le nom) : ils ne changent jamais.
      { source: '/_astro/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ],
  };
}

export const CHEMIN = fileURLToPath(new URL('../vercel.json', import.meta.url));
export const contenu = () => `${JSON.stringify(configVercel(), null, 2)}\n`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(CHEMIN, contenu());
  console.log(`vercel.json écrit (${Object.keys(REDIRECTIONS).length} redirections 301).`);
}
