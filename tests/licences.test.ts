// Licences : le code est sous GPL-3.0-or-later (cf. LICENCES.md, decisions.md D19). Ces tests vérifient le texte de
// la licence, la déclaration du paquet, et que toute dépendance installée reste compatible avec la GPL v3.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { test, expect } from 'vitest';

import { compatibleSpdx } from './spdx.ts';

test('LICENSE est le texte officiel de la GNU GPL v3 (gnu.org)', () => {
  const texte = readFileSync('LICENSE');
  expect(texte.toString()).toMatch(/^\s+GNU GENERAL PUBLIC LICENSE\n\s+Version 3, 29 June 2007/);
  expect(createHash('sha256').update(texte).digest('hex')).toBe('3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986');
});

test('le paquet déclare GPL-3.0-or-later, et LICENCES.md sépare code, textes et éléments de HoYoverse', () => {
  expect((JSON.parse(readFileSync('package.json', 'utf8')) as { license: string }).license).toBe('GPL-3.0-or-later');
  const licences = readFileSync('LICENCES.md', 'utf8');
  for (const attendu of ['GPL-3.0-or-later', 'CC BY-SA 3.0', 'HoYoverse', 'src/assets/images/']) expect(licences.includes(attendu), attendu).toBeTruthy();
});

// Licences compatibles avec la GPL v3 (liste de la FSF). MPL-2.0 l'est sauf mention « Incompatible With Secondary
// Licenses » dans le code, vérifiée plus bas. Une licence absente de la liste fait échouer le test : à examiner.
const COMPATIBLES = new Set(['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', '0BSD', 'BlueOak-1.0.0', 'CC0-1.0', 'MPL-2.0', 'LGPL-3.0-or-later', 'LGPL-3.0-only', 'GPL-3.0-or-later', 'GPL-3.0-only', 'Unlicense', 'Python-2.0', 'Zlib']);

function* paquets(dossier: string): Generator<string> {
  for (const nom of readdirSync(dossier)) {
    if (nom.startsWith('.')) continue;
    const chemin = path.join(dossier, nom);
    if (nom.startsWith('@')) { yield* paquets(chemin); continue; }
    if (existsSync(path.join(chemin, 'package.json'))) yield chemin;
    if (existsSync(path.join(chemin, 'node_modules'))) yield* paquets(path.join(chemin, 'node_modules'));
  }
}
const licenceDe = (paquet: string): string => {
  // Champ `license` (texte, ou ancien objet { type }) ou ancien tableau `licenses`.
  const { license, licenses } = JSON.parse(readFileSync(path.join(paquet, 'package.json'), 'utf8')) as { license?: string | { type: string }; licenses?: { type: string }[] };
  return typeof license === 'string' ? license : license?.type ?? licenses?.map(l => l.type).join(' OR ') ?? 'inconnue';
};
// Expression SPDX analysée selon sa grammaire (parenthèses, priorités), cf. tests/spdx.ts et tests/spdx.test.ts.
const compatible = (expression: string) => compatibleSpdx(expression, COMPATIBLES);

function* sources(dossier: string): Generator<string> {
  for (const entree of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = path.join(dossier, entree.name);
    if (entree.isDirectory()) { if (entree.name !== 'node_modules') yield* sources(chemin); }
    // Le texte de la MPL-2.0 (fichier LICENSE) définit lui-même l'expression : seul le code compte.
    else if (/\.(m?js|cjs|ts)$/.test(entree.name)) yield chemin;
  }
}

test('toutes les dépendances installées sont sous une licence compatible avec la GPL v3', () => {
  const problemes = [];
  for (const paquet of paquets('node_modules')) {
    const licence = licenceDe(paquet);
    if (!compatible(licence)) problemes.push(`${path.relative('node_modules', paquet)} : ${licence}`);
    else if (licence === 'MPL-2.0') {
      for (const fichier of sources(paquet)) {
        if (readFileSync(fichier, 'latin1').includes('This Source Code Form is "Incompatible With Secondary Licenses"')) { problemes.push(`${fichier} : MPL-2.0 incompatible avec la GPL`); break; }
      }
    }
  }
  expect(problemes).toStrictEqual([]);
});

test('l’analyse SPDX refuse le cas signalé en relecture', () => {
  expect(!compatible('(MIT OR Apache-2.0) AND CC-BY-NC-4.0')).toBeTruthy();
  expect(compatible('(MIT OR Apache-2.0)')).toBeTruthy();
});
