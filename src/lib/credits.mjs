// Crédits des articles : adaptations du Genshin Impact Wiki (CC BY-SA 3.0) et théories de la communauté.
// Logique pure, testée par tests/credits.test.mjs ; vérifiée au build par validation.mjs. Cf. decisions.md, D17.

// Licence des adaptations du wiki, et aussi de tous les textes originaux du site (decisions.md, D18).
export const LICENCE_WIKI = { nom: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/deed.fr' };
const HOTE_WIKI = 'genshin-impact.fandom.com';

/** Plateformes de la communauté : libellé affiché et domaines acceptés (null : tout domaine). */
export const PLATEFORMES = {
  reddit: { libelle: 'Reddit', domaines: ['reddit.com', 'redd.it'] },
  x: { libelle: 'X', domaines: ['x.com', 'twitter.com'] },
  youtube: { libelle: 'YouTube', domaines: ['youtube.com', 'youtu.be'] },
  autre: { libelle: null, domaines: null },
};

const surDomaine = (hote, domaine) => hote === domaine || hote.endsWith(`.${domaine}`);

/**
 * Le crédit est-il exploitable ? Renvoie la raison du refus, ou null.
 * @param {{ type: 'wiki', titre: string, url: string, modifications: string } | { type: 'communaute', auteur: string, plateforme: keyof typeof PLATEFORMES, url: string, titre?: string }} credit
 */
export function verifierCredit(credit) {
  const url = new URL(credit.url);
  if (url.protocol !== 'https:') return `adresse non HTTPS (${credit.url})`;
  if (credit.type === 'wiki') {
    if (url.hostname !== HOTE_WIKI) return `une adaptation du wiki doit pointer vers ${HOTE_WIKI} (${credit.url})`;
    // CC BY-SA impose de signaler les changements ; la page Crédits promet cette mention sur chaque page concernée.
    if (!credit.modifications.trim()) return `« modifications » est obligatoire pour une adaptation du wiki (CC BY-SA : indiquer les changements)`;
    return null;
  }
  const { libelle, domaines } = PLATEFORMES[credit.plateforme];
  if (domaines && !domaines.some(d => surDomaine(url.hostname, d))) return `l’adresse ne correspond pas à la plateforme ${libelle} (${credit.url})`;
  return null;
}

/**
 * @typedef {{ type: 'wiki', titre: string, source: string, lien: string, historique: string, licence: typeof LICENCE_WIKI, modifications: string }} CreditWiki
 * @typedef {{ type: 'communaute', titre?: string, auteur: string, source: string, lien: string }} CreditCommunaute
 */

/**
 * Ce qu'affiche l'encadré Crédits (et la page /credits) pour un crédit.
 * @param {Parameters<typeof verifierCredit>[0]} credit
 * @returns {CreditWiki | CreditCommunaute}
 */
export function presenterCredit(credit) {
  if (credit.type === 'wiki') {
    const historique = new URL(credit.url);
    historique.searchParams.set('action', 'history');
    return { type: 'wiki', titre: credit.titre, source: 'Genshin Impact Wiki (Fandom)', lien: credit.url, historique: historique.href, licence: LICENCE_WIKI, modifications: credit.modifications };
  }
  return { type: 'communaute', titre: credit.titre, auteur: credit.auteur, source: PLATEFORMES[credit.plateforme].libelle ?? new URL(credit.url).hostname.replace(/^www\./, ''), lien: credit.url };
}
