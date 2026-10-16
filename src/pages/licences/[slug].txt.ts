import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { TIERS } from '../../lib/tiers.mjs';

// Texte complet de la licence de chaque logiciel crédité, lu au build dans le paquet installé : MIT impose de joindre
// la notice de copyright et d'autorisation, Apache-2.0 une copie de la licence (decisions.md, D30).
export const getStaticPaths = (() => TIERS.map(tiers => ({ params: { slug: tiers.slug }, props: { tiers } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { tiers } = props as { tiers: (typeof TIERS)[number] };
  const paquet = JSON.parse(await readFile(path.join('node_modules', tiers.paquet, 'package.json'), 'utf8'));
  const texte = await readFile(path.join('node_modules', tiers.paquet, tiers.fichier), 'utf8');
  const entete = `${tiers.nom} (${tiers.paquet} ${paquet.version}) — licence ${tiers.licence}\n${tiers.url}\n\n`;
  return new Response(entete + texte, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
