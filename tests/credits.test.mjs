import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifierCredit, presenterCredit, LICENCE_WIKI } from '../src/lib/credits.mjs';

const wiki = (autres = {}) => ({ type: 'wiki', titre: 'Venti', url: 'https://genshin-impact.fandom.com/wiki/Venti', modifications: 'Traduit et résumé.', ...autres });
const communaute = (autres = {}) => ({ type: 'communaute', auteur: 'u/pseudo', plateforme: 'reddit', url: 'https://www.reddit.com/r/Genshin_Lore/comments/abc', ...autres });

test('un crédit wiki pointe vers le Genshin Impact Wiki, en HTTPS, et décrit ses modifications', () => {
  assert.equal(verifierCredit(wiki()), null);
  assert.equal(verifierCredit(wiki({ url: 'https://genshin-impact.fandom.com/fr/wiki/Venti' })), null, 'le wiki francophone est sur le même domaine');
  assert.match(verifierCredit(wiki({ url: 'https://minecraft.fandom.com/wiki/Creeper' })), /genshin-impact\.fandom\.com/);
  assert.match(verifierCredit(wiki({ url: 'http://genshin-impact.fandom.com/wiki/Venti' })), /HTTPS/);
  assert.match(verifierCredit(wiki({ modifications: '  ' })), /modifications/);
});

test('un crédit de la communauté pointe vers la plateforme déclarée', () => {
  assert.equal(verifierCredit(communaute()), null);
  assert.equal(verifierCredit(communaute({ url: 'https://redd.it/abc' })), null);
  assert.equal(verifierCredit(communaute({ plateforme: 'x', url: 'https://x.com/pseudo/status/1' })), null);
  assert.equal(verifierCredit(communaute({ plateforme: 'x', url: 'https://twitter.com/pseudo/status/1' })), null);
  assert.equal(verifierCredit(communaute({ plateforme: 'youtube', url: 'https://youtu.be/abc' })), null);
  assert.equal(verifierCredit(communaute({ plateforme: 'autre', url: 'https://exemple.org/billet' })), null);
  assert.match(verifierCredit(communaute({ plateforme: 'x', url: 'https://www.reddit.com/r/x' })), /X/);
  assert.match(verifierCredit(communaute({ url: 'https://reddit.com.exemple.org/r/x' })), /Reddit/, 'un domaine qui finit autrement ne passe pas');
});

test('présentation d’un crédit wiki : lien, contributeurs (historique), licence, modifications', () => {
  const p = presenterCredit(wiki());
  assert.equal(p.lien, 'https://genshin-impact.fandom.com/wiki/Venti');
  assert.equal(p.historique, 'https://genshin-impact.fandom.com/wiki/Venti?action=history');
  assert.equal(p.source, 'Genshin Impact Wiki (Fandom)');
  assert.deepEqual(p.licence, LICENCE_WIKI);
  assert.equal(p.modifications, 'Traduit et résumé.');
  assert.equal(p.titre, 'Venti');
});

test('présentation d’un crédit de la communauté : auteur et plateforme, titre facultatif', () => {
  assert.deepEqual(presenterCredit(communaute({ titre: 'Le ciel est faux' })), { type: 'communaute', titre: 'Le ciel est faux', auteur: 'u/pseudo', source: 'Reddit', lien: 'https://www.reddit.com/r/Genshin_Lore/comments/abc' });
  assert.equal(presenterCredit(communaute()).titre, undefined);
  assert.equal(presenterCredit(communaute({ plateforme: 'autre', url: 'https://exemple.org/billet' })).source, 'exemple.org');
});
