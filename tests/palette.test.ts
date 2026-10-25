import { readFile } from 'node:fs/promises';

import { test, expect } from 'vitest';

import { genererPalette, cssPalette, contraste, CHEMIN_CSS, PERSONNALISEES } from '../scripts/palette.ts';

const palette = genererPalette();

test('src/styles/palette.css est à jour (sinon : npm run palette)', async () => {
  expect(await readFile(CHEMIN_CSS, 'utf8')).toBe(cssPalette(palette));
});

test('les deux thèmes définissent les mêmes jetons', () => {
  expect(Object.keys(palette.sombre)).toStrictEqual(Object.keys(palette.clair));
});

// [texte, fond, minimum] : 4,5 pour du texte (WCAG AA), 3 pour un contour de composant (WCAG 1.4.11).
const PAIRES: [string, string, number][] = [
  ...['fond', 'surface', 'doux', 'tonal'].map((fond): [string, string, number] => ['texte', fond, 4.5]),
  ...['fond', 'surface', 'doux'].map((fond): [string, string, number] => ['discret', fond, 4.5]),
  ...['fond', 'surface', 'tonal'].map((fond): [string, string, number] => ['primaire', fond, 4.5]),
  ['sur-primaire', 'primaire', 4.5],
  ['sur-tonal', 'tonal', 4.5],
  ['sur-conteneur-primaire', 'conteneur-primaire', 4.5],
  ['sur-conteneur-tertiaire', 'conteneur-tertiaire', 4.5],
  // Chaque couleur personnalisée : lisible en texte sur le fond, et ses rôles « sur » lisibles sur leur conteneur.
  ...Object.keys(PERSONNALISEES).flatMap((c): [string, string, number][] => [[c, 'fond', 4.5], [c, 'surface', 4.5], [`sur-${c}`, c, 4.5], [`sur-conteneur-${c}`, `conteneur-${c}`, 4.5]]),
  ['contour', 'fond', 3],
  ['contour', 'surface', 3],
];

for (const theme of ['clair', 'sombre'] as const) {
  test(`thème ${theme} : les paires texte/fond atteignent le contraste WCAG AA`, () => {
    const couleurs = palette[theme];
    const echecs = PAIRES
      .map(([texte, fond, min]) => ({ texte, fond, min, ratio: contraste(couleurs[texte], couleurs[fond]) }))
      .filter(({ ratio, min }) => ratio < min)
      .map(({ texte, fond, min, ratio }) => `${texte} sur ${fond} : ${ratio.toFixed(2)} < ${min}`);
    expect(echecs).toStrictEqual([]);
  });
}

test('couleurs fixes : texte « nuit » lisible sur un bouton « ciel »', () => {
  expect(contraste(palette.fixes.nuit, palette.fixes.ciel) >= 4.5).toBeTruthy();
});

test('le calcul de contraste est conforme à WCAG', () => {
  expect(contraste('#000000', '#ffffff')).toBe(21);
  expect(contraste('#777777', '#777777')).toBe(1);
  expect(contraste('#767676', '#ffffff').toFixed(2)).toBe('4.54');
});
