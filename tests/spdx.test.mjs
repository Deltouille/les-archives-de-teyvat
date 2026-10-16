import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compatibleSpdx } from './spdx.mjs';

const OK = new Set(['MIT', 'Apache-2.0', 'BSD-3-Clause', 'GPL-3.0-or-later', 'GPL-2.0-or-later WITH Classpath-exception-2.0']);
const ok = expression => compatibleSpdx(expression, OK);

test('licence simple', () => {
  assert.equal(ok('MIT'), true);
  assert.equal(ok('GPL-2.0-only'), false);
});

test('OR : compatible si une branche l’est ; AND : si toutes le sont', () => {
  assert.equal(ok('MIT OR GPL-2.0-only'), true);
  assert.equal(ok('MIT AND BSD-3-Clause'), true);
  assert.equal(ok('MIT AND CC-BY-NC-4.0'), false);
});

test('les parenthèses sont respectées (cas signalé en relecture)', () => {
  assert.equal(ok('(MIT OR Apache-2.0) AND CC-BY-NC-4.0'), false);
  assert.equal(ok('(MIT OR Apache-2.0) AND BSD-3-Clause'), true);
  assert.equal(ok('MIT OR (Apache-2.0 AND CC-BY-NC-4.0)'), true);
  assert.equal(ok('((MIT))'), true);
});

test('priorité : AND avant OR', () => {
  // « CC-BY-NC-4.0 OR MIT AND BSD-3-Clause » = CC-BY-NC-4.0 OR (MIT AND BSD-3-Clause) → compatible.
  assert.equal(ok('CC-BY-NC-4.0 OR MIT AND BSD-3-Clause'), true);
  // « MIT AND CC-BY-NC-4.0 OR GPL-2.0-only » = (MIT AND CC-BY-NC-4.0) OR GPL-2.0-only → incompatible.
  assert.equal(ok('MIT AND CC-BY-NC-4.0 OR GPL-2.0-only'), false);
});

test('WITH : l’exception doit figurer telle quelle dans la liste', () => {
  assert.equal(ok('GPL-2.0-or-later WITH Classpath-exception-2.0'), true);
  assert.equal(ok('GPL-2.0-only WITH Classpath-exception-2.0'), false);
});

test('expressions malformées ou inconnues : refusées, jamais acceptées par défaut', () => {
  for (const expression of ['', '(MIT', 'MIT)', 'MIT OR', 'AND MIT', 'MIT MIT', 'inconnue', 'MIT OR (', 'WITH MIT']) {
    assert.equal(ok(expression), false, JSON.stringify(expression));
  }
});
