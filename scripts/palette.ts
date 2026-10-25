// Génère src/styles/palette.css : la palette Material 3 du site, calculée depuis une couleur source
// (Material Color Utilities, schéma Tonal Spot = le schéma M3 par défaut). Cf. documentation/decisions.md, D4 et D6.
//
//   npm run palette        régénère le fichier après un changement de SOURCE ou de JETONS
//
// tests/palette.test.ts vérifie que le fichier est à jour et que les paires texte/fond sont lisibles.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { Hct, SchemeTonalSpot, MaterialDynamicColors as M, TonalPalette, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

// Le bleu « Primogemme » du prototype.
export const SOURCE = '#355f98';
// Couleurs d'accent hors schéma (« couleurs personnalisées » M3), déclinées chacune en quatre rôles :
// <nom>, sur-<nom>, conteneur-<nom>, sur-conteneur-<nom>. Volontairement non harmonisées avec SOURCE :
// l'harmonisation M3 tirait l'or vers l'orangé, on perdait le doré de Genshin.
export const PERSONNALISEES = {
  // Encadré spoilers, ambre sur image, tuile « Personnages ».
  or: '#986f33',
  // Tuile « Régions » de l'accueil (le vert du prototype).
  jade: '#507c69',
};

// Jeton français → rôle M3. Les jetons gardent les noms du prototype pour que le balisage n'ait pas à changer
// si la palette change.
const JETONS = {
  fond: M.surface,
  surface: M.surfaceContainerLow,
  doux: M.surfaceContainerHigh,
  tonal: M.secondaryContainer,
  'sur-tonal': M.onSecondaryContainer,
  ligne: M.outlineVariant,
  contour: M.outline,
  texte: M.onSurface,
  discret: M.onSurfaceVariant,
  primaire: M.primary,
  'sur-primaire': M.onPrimary,
  'conteneur-primaire': M.primaryContainer,
  'sur-conteneur-primaire': M.onPrimaryContainer,
  // Tertiaire : la teinte que Tonal Spot dérive de la source (un violet pour notre bleu).
  'conteneur-tertiaire': M.tertiaryContainer,
  'sur-conteneur-tertiaire': M.onTertiaryContainer,
};
// Rôles d'une couleur personnalisée M3, en tons de sa palette tonale : [clair, sombre].
const TONS_PERSONNALISES: Record<string, [number, number]> = { '': [40, 80], 'sur-': [100, 20], 'conteneur-': [90, 30], 'sur-conteneur-': [10, 90] };

export function genererPalette(source = SOURCE, personnalisees = PERSONNALISEES) {
  const hct = Hct.fromInt(argbFromHex(source));
  const tons = Object.fromEntries(Object.entries(personnalisees).map(([nom, hex]) => [nom, TonalPalette.fromInt(argbFromHex(hex))]));
  const theme = (sombre: boolean) => {
    const schema = new SchemeTonalSpot(hct, sombre, 0);
    const couleurs = Object.fromEntries(Object.entries(JETONS).map(([nom, role]) => [nom, hexFromArgb(role.getArgb(schema))]));
    for (const [nom, palette] of Object.entries(tons)) {
      for (const [prefixe, [clair, fonce]] of Object.entries(TONS_PERSONNALISES)) couleurs[`${prefixe}${nom}`] = hexFromArgb(palette.tone(sombre ? fonce : clair));
    }
    return couleurs;
  };
  const clair = new SchemeTonalSpot(hct, false, 0);
  return {
    clair: theme(false),
    sombre: theme(true),
    // Couleurs fixes, identiques dans les deux thèmes : texte et accents posés sur une image sombre.
    fixes: {
      ciel: hexFromArgb(M.primaryFixedDim.getArgb(clair)),
      'ciel-clair': hexFromArgb(M.primaryFixed.getArgb(clair)),
      nuit: hexFromArgb(M.onPrimaryFixed.getArgb(clair)),
      ambre: hexFromArgb(tons.or.tone(80)),
    },
  };
}

type Couleurs = Record<string, string>;

export function cssPalette({ clair, sombre, fixes }: { clair: Couleurs; sombre: Couleurs; fixes: Couleurs }) {
  const variables = (couleurs: Couleurs) => Object.entries(couleurs).map(([nom, valeur]) => `--${nom}: ${valeur};`).join(' ');
  return `/* Généré par scripts/palette.ts depuis ${SOURCE} : ne pas modifier à la main (npm run palette). */

:root { color-scheme: light; ${variables(clair)} }
/* Sans JavaScript, data-theme est absent : on suit alors la préférence système. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) { color-scheme: dark; ${variables(sombre)} }
}
:root[data-theme="dark"] { color-scheme: dark; ${variables(sombre)} }

@theme inline {
  /* Seules nos couleurs existent : la palette Tailwind (bg-blue-500…) est supprimée. */
  --color-*: initial;
${Object.keys(clair).map(nom => `  --color-${nom}: var(--${nom});`).join('\n')}
}

@theme {
  /* Blanc et noir restent disponibles pour le verre et les voiles posés sur une image. */
  --color-white: #fff;
  --color-black: #000;
${Object.entries(fixes).map(([nom, valeur]) => `  --color-${nom}: ${valeur};`).join('\n')}
}
`;
}

// Contraste WCAG 2 entre deux couleurs hexadécimales (de 1 à 21).
export function contraste(a: string, b: string) {
  const luminance = (hex: string) => {
    const [r, g, v] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * v;
  };
  const [clair, fonce] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (fonce + 0.05);
}

export const CHEMIN_CSS = fileURLToPath(new URL('../src/styles/palette.css', import.meta.url));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(CHEMIN_CSS, cssPalette(genererPalette()));
  console.log(`Palette écrite dans src/styles/palette.css (source ${SOURCE}).`);
}
