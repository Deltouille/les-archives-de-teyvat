// Icônes Material Symbols (arrondies, graisse 400), lues dans @material-symbols/svg-400 au build :
// aucun fichier d'icône ni webfont n'est chargé par le navigateur, le tracé est inséré dans le HTML.
// Pour en ajouter une : une ligne ici (nom français → nom Material Symbols), cf. https://fonts.google.com/icons.
import fleche from '@material-symbols/svg-400/rounded/arrow_forward.svg?raw';
import calendrier from '@material-symbols/svg-400/rounded/calendar_today.svg?raw';
import coche from '@material-symbols/svg-400/rounded/check.svg?raw';
import chevron from '@material-symbols/svg-400/rounded/chevron_right.svg?raw';
import fermer from '@material-symbols/svg-400/rounded/close.svg?raw';
import lune from '@material-symbols/svg-400/rounded/dark_mode.svg?raw';
import boussole from '@material-symbols/svg-400/rounded/explore.svg?raw';
import etincelle from '@material-symbols/svg-400/rounded/flare.svg?raw';
import horloge from '@material-symbols/svg-400/rounded/history.svg?raw';
import maison from '@material-symbols/svg-400/rounded/home.svg?raw';
import soleil from '@material-symbols/svg-400/rounded/light_mode.svg?raw';
import ampoule from '@material-symbols/svg-400/rounded/lightbulb.svg?raw';
import menu from '@material-symbols/svg-400/rounded/menu.svg?raw';
import livre from '@material-symbols/svg-400/rounded/menu_book.svg?raw';
import personne from '@material-symbols/svg-400/rounded/person.svg?raw';
import minuteur from '@material-symbols/svg-400/rounded/schedule.svg?raw';
import recherche from '@material-symbols/svg-400/rounded/search.svg?raw';
import tag from '@material-symbols/svg-400/rounded/sell.svg?raw';
import video from '@material-symbols/svg-400/rounded/smart_display.svg?raw';
import strates from '@material-symbols/svg-400/rounded/stacks.svg?raw';
import oeil from '@material-symbols/svg-400/rounded/visibility.svg?raw';

const sources = { maison, livre, boussole, personne, strates, horloge, etincelle, recherche, fleche, chevron, lune, soleil, fermer, tag, menu, coche, oeil, minuteur, calendrier, ampoule, video };

export type NomIcone = keyof typeof sources;
export const NOMS_ICONES = Object.keys(sources) as [NomIcone, ...NomIcone[]];

/** Le tracé (attribut d) de l'icône : les fichiers Material Symbols n'ont qu'un <path>, en viewBox 0 -960 960 960. */
export const traceIcone = (nom: NomIcone) => {
  const trace = (/<path d="([^"]+)"/.exec(sources[nom]))?.[1];
  if (!trace) throw new Error(`Icône illisible : ${nom}`);
  return trace;
};
