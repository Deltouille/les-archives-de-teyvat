import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CHEMIN, contenu, configVercel } from '../scripts/vercel.mjs';
import { REDIRECTIONS } from '../src/lib/redirections.mjs';

test('vercel.json est à jour (sinon : npm run vercel)', async () => {
  assert.equal(await readFile(CHEMIN, 'utf8'), contenu());
});

test('chaque ancienne URL a sa redirection 301 sur Vercel', () => {
  const { redirects } = configVercel();
  assert.equal(redirects.length, Object.keys(REDIRECTIONS).length);
  for (const r of redirects) {
    assert.equal(r.statusCode, 301);
    assert.equal(REDIRECTIONS[r.source], r.destination);
  }
});

test('Vercel construit avec npm run build (index de recherche compris), sans barre finale', () => {
  const config = configVercel();
  assert.equal(config.buildCommand, 'npm run build');
  assert.equal(config.outputDirectory, 'dist');
  assert.equal(config.trailingSlash, false);
});
