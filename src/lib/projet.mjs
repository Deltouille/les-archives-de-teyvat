// Nom et adresses du projet, écrits une seule fois (decisions.md, D22, D24 et D26).
export const NOM = 'Les Archives de Teyvat';
/** Plateforme qui héberge le dépôt, nommée dans les pages (changer de plateforme = ces trois lignes, D26). */
export const PLATEFORME = 'GitHub';
export const DEPOT = 'https://github.com/Deltouille/les-archives-de-teyvat';
/** Contact : les tickets (« issues ») du dépôt ; l'éditeur, particulier, ne publie pas d'adresse e-mail. */
export const TICKETS = `${DEPOT}/issues`;

/** Contact privé (données personnelles, demandes juridiques) : un alias Proton Pass dédié au projet, qui ne révèle pas
 *  l'adresse de l'éditeur (D32). Seule adresse e-mail autorisée dans le site (tests/pages.test.mjs). */
export const CONTACT_PRIVE = 'les-archives-de-teyvat.portal337@passinbox.com';

/** Hébergeur, à identifier dans les mentions légales (LCEN). Vérifié sur vercel.com/legal le 16 oct. 2026. */
export const HEBERGEUR = { nom: 'Vercel Inc.', adresse: '440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis', site: 'https://vercel.com', confidentialite: 'https://vercel.com/legal/privacy-notice' };
