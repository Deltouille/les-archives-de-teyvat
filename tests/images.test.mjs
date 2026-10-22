import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avertissements, erreurDeNom, estUneUrl, LARGEUR_MIN } from '../src/lib/images.mjs';

test('une source est un lien seulement si elle commence par http(s)://', () => {
  assert.ok(estUneUrl('https://static.wikia.nocookie.net/x.png'));
  assert.ok(estUneUrl('HTTP://exemple.fr/x.png'));
  assert.ok(!estUneUrl('~/Téléchargements/x.png'));
  assert.ok(!estUneUrl('/tmp/https.png'));
});

test('le nom de l’image doit être utilisable tel quel dans le frontmatter', () => {
  assert.equal(erreurDeNom('tsar-belyi'), null);
  assert.match(erreurDeNom('Tsar Belyi'), /tsar-belyi/);
  assert.match(erreurDeNom('tsar-belyi.webp'), /tsar-belyi-webp/);
  assert.match(erreurDeNom('été'), /ete/);
  assert.match(erreurDeNom('---'), /vide/);
});

test('les avertissements signalent ce qui rendra mal en bannière', () => {
  assert.deepEqual(avertissements({ width: 3840, height: 2160, hasAlpha: false }), []);
  assert.equal(avertissements({ width: LARGEUR_MIN, height: 900 }).length, 0);
  const portrait = avertissements({ width: 512, height: 1024, hasAlpha: true });
  assert.equal(portrait.length, 3);
  assert.match(portrait[0], /floue/);
  assert.match(portrait[1], /portrait/);
  assert.match(portrait[2], /transparent/);
});
