import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { genererPalette, cssPalette, contraste, CHEMIN_CSS } from '../scripts/palette.mjs';

const palette = genererPalette();

test('src/styles/palette.css est à jour (sinon : npm run palette)', async () => {
  assert.equal(await readFile(CHEMIN_CSS, 'utf8'), cssPalette(palette));
});

test('les deux thèmes définissent les mêmes jetons', () => {
  assert.deepEqual(Object.keys(palette.sombre), Object.keys(palette.clair));
});

// [texte, fond, minimum] : 4,5 pour du texte (WCAG AA), 3 pour un contour de composant (WCAG 1.4.11).
const PAIRES = [
  ...['fond', 'surface', 'doux', 'tonal'].map(fond => ['texte', fond, 4.5]),
  ...['fond', 'surface', 'doux'].map(fond => ['discret', fond, 4.5]),
  ...['fond', 'surface', 'tonal'].map(fond => ['primaire', fond, 4.5]),
  ['sur-primaire', 'primaire', 4.5],
  ['sur-tonal', 'tonal', 4.5],
  ['sur-conteneur-primaire', 'conteneur-primaire', 4.5],
  ['or', 'fond', 4.5],
  ['or', 'surface', 4.5],
  ['sur-or', 'or', 4.5],
  ['sur-conteneur-or', 'conteneur-or', 4.5],
  ['contour', 'fond', 3],
  ['contour', 'surface', 3],
];

for (const theme of ['clair', 'sombre']) {
  test(`thème ${theme} : les paires texte/fond atteignent le contraste WCAG AA`, () => {
    const couleurs = palette[theme];
    const echecs = PAIRES
      .map(([texte, fond, min]) => ({ texte, fond, min, ratio: contraste(couleurs[texte], couleurs[fond]) }))
      .filter(({ ratio, min }) => ratio < min)
      .map(({ texte, fond, min, ratio }) => `${texte} sur ${fond} : ${ratio.toFixed(2)} < ${min}`);
    assert.deepEqual(echecs, []);
  });
}

test('couleurs fixes : texte « nuit » lisible sur un bouton « ciel »', () => {
  assert.ok(contraste(palette.fixes.nuit, palette.fixes.ciel) >= 4.5);
});

test('le calcul de contraste est conforme à WCAG', () => {
  assert.equal(contraste('#000000', '#ffffff'), 21);
  assert.equal(contraste('#777777', '#777777'), 1);
  assert.equal(contraste('#767676', '#ffffff').toFixed(2), '4.54');
});
