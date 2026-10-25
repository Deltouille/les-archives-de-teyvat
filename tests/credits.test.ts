import { test, expect } from 'vitest';

import { verifierCredit, presenterCredit, LICENCE_WIKI, type Credit, type CreditWiki } from '../src/lib/credits.ts';

type Wiki = Extract<Credit, { type: 'wiki' }>;
type Communaute = Extract<Credit, { type: 'communaute' }>;
const wiki = (autres: Partial<Wiki> = {}): Wiki => ({ type: 'wiki', titre: 'Venti', url: 'https://genshin-impact.fandom.com/wiki/Venti', modifications: 'Traduit et résumé.', ...autres });
const communaute = (autres: Partial<Communaute> = {}): Communaute => ({ type: 'communaute', auteur: 'u/pseudo', plateforme: 'reddit', url: 'https://www.reddit.com/r/Genshin_Lore/comments/abc', ...autres });

test('un crédit wiki pointe vers le Genshin Impact Wiki, en HTTPS, et décrit ses modifications', () => {
  expect(verifierCredit(wiki())).toBe(null);
  expect(verifierCredit(wiki({ url: 'https://genshin-impact.fandom.com/fr/wiki/Venti' })), 'le wiki francophone est sur le même domaine').toBe(null);
  expect(verifierCredit(wiki({ url: 'https://minecraft.fandom.com/wiki/Creeper' }))).toMatch(/genshin-impact\.fandom\.com/);
  expect(verifierCredit(wiki({ url: 'http://genshin-impact.fandom.com/wiki/Venti' }))).toMatch(/HTTPS/);
  expect(verifierCredit(wiki({ modifications: '  ' }))).toMatch(/modifications/);
});

test('un crédit de la communauté pointe vers la plateforme déclarée', () => {
  expect(verifierCredit(communaute())).toBe(null);
  expect(verifierCredit(communaute({ url: 'https://redd.it/abc' }))).toBe(null);
  expect(verifierCredit(communaute({ plateforme: 'x', url: 'https://x.com/pseudo/status/1' }))).toBe(null);
  expect(verifierCredit(communaute({ plateforme: 'x', url: 'https://twitter.com/pseudo/status/1' }))).toBe(null);
  expect(verifierCredit(communaute({ plateforme: 'youtube', url: 'https://youtu.be/abc' }))).toBe(null);
  expect(verifierCredit(communaute({ plateforme: 'autre', url: 'https://exemple.org/billet' }))).toBe(null);
  expect(verifierCredit(communaute({ plateforme: 'x', url: 'https://www.reddit.com/r/x' }))).toMatch(/X/);
  expect(verifierCredit(communaute({ url: 'https://reddit.com.exemple.org/r/x' })), 'un domaine qui finit autrement ne passe pas').toMatch(/Reddit/);
});

test('présentation d’un crédit wiki : lien, contributeurs (historique), licence, modifications', () => {
  const p = presenterCredit(wiki()) as CreditWiki;
  expect(p.lien).toBe('https://genshin-impact.fandom.com/wiki/Venti');
  expect(p.historique).toBe('https://genshin-impact.fandom.com/wiki/Venti?action=history');
  expect(p.source).toBe('Genshin Impact Wiki (Fandom)');
  expect(p.licence).toStrictEqual(LICENCE_WIKI);
  expect(p.modifications).toBe('Traduit et résumé.');
  expect(p.titre).toBe('Venti');
});

test('présentation d’un crédit de la communauté : auteur et plateforme, titre facultatif', () => {
  expect(presenterCredit(communaute({ titre: 'Le ciel est faux' }))).toStrictEqual({ type: 'communaute', titre: 'Le ciel est faux', auteur: 'u/pseudo', source: 'Reddit', lien: 'https://www.reddit.com/r/Genshin_Lore/comments/abc' });
  expect(presenterCredit(communaute()).titre).toBe(undefined);
  expect(presenterCredit(communaute({ plateforme: 'autre', url: 'https://exemple.org/billet' })).source).toBe('exemple.org');
});
