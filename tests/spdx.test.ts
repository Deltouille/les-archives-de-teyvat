import { test, expect } from 'vitest';

import { compatibleSpdx } from './spdx.ts';

const OK = new Set(['MIT', 'Apache-2.0', 'BSD-3-Clause', 'GPL-3.0-or-later', 'GPL-2.0-or-later WITH Classpath-exception-2.0']);
const ok = (expression: string) => compatibleSpdx(expression, OK);

test('licence simple', () => {
  expect(ok('MIT')).toBe(true);
  expect(ok('GPL-2.0-only')).toBe(false);
});

test('OR : compatible si une branche l’est ; AND : si toutes le sont', () => {
  expect(ok('MIT OR GPL-2.0-only')).toBe(true);
  expect(ok('MIT AND BSD-3-Clause')).toBe(true);
  expect(ok('MIT AND CC-BY-NC-4.0')).toBe(false);
});

test('les parenthèses sont respectées (cas signalé en relecture)', () => {
  expect(ok('(MIT OR Apache-2.0) AND CC-BY-NC-4.0')).toBe(false);
  expect(ok('(MIT OR Apache-2.0) AND BSD-3-Clause')).toBe(true);
  expect(ok('MIT OR (Apache-2.0 AND CC-BY-NC-4.0)')).toBe(true);
  expect(ok('((MIT))')).toBe(true);
});

test('priorité : AND avant OR', () => {
  // « CC-BY-NC-4.0 OR MIT AND BSD-3-Clause » = CC-BY-NC-4.0 OR (MIT AND BSD-3-Clause) → compatible.
  expect(ok('CC-BY-NC-4.0 OR MIT AND BSD-3-Clause')).toBe(true);
  // « MIT AND CC-BY-NC-4.0 OR GPL-2.0-only » = (MIT AND CC-BY-NC-4.0) OR GPL-2.0-only → incompatible.
  expect(ok('MIT AND CC-BY-NC-4.0 OR GPL-2.0-only')).toBe(false);
});

test('WITH : l’exception doit figurer telle quelle dans la liste', () => {
  expect(ok('GPL-2.0-or-later WITH Classpath-exception-2.0')).toBe(true);
  expect(ok('GPL-2.0-only WITH Classpath-exception-2.0')).toBe(false);
});

test('expressions malformées ou inconnues : refusées, jamais acceptées par défaut', () => {
  for (const expression of ['', '(MIT', 'MIT)', 'MIT OR', 'AND MIT', 'MIT MIT', 'inconnue', 'MIT OR (', 'WITH MIT']) {
    expect(ok(expression), JSON.stringify(expression)).toBe(false);
  }
});
