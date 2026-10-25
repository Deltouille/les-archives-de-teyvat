import { readFile } from 'node:fs/promises';

import { test, expect } from 'vitest';

import { CHEMIN, contenu, configVercel } from '../scripts/vercel.ts';
import { REDIRECTIONS } from '../src/lib/redirections.ts';

test('vercel.json est à jour (sinon : npm run vercel)', async () => {
  expect(await readFile(CHEMIN, 'utf8')).toBe(contenu());
});

test('chaque ancienne URL a sa redirection 301 sur Vercel', () => {
  const { redirects } = configVercel();
  expect(redirects.length).toBe(Object.keys(REDIRECTIONS).length);
  for (const r of redirects) {
    expect(r.statusCode).toBe(301);
    expect(REDIRECTIONS[r.source]).toBe(r.destination);
  }
});

test('Vercel construit avec npm run build (index de recherche compris), sans barre finale', () => {
  const config = configVercel();
  expect(config.buildCommand).toBe('npm run build');
  expect(config.outputDirectory).toBe('dist');
  expect(config.trailingSlash).toBe(false);
});
