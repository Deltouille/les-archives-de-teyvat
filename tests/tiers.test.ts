// Les crédits des logiciels tiers (src/lib/tiers.ts) doivent rester exacts : paquet installé, licence et titulaire
// conformes à ce que le paquet déclare. Cf. decisions.md, D23.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { test, expect } from 'vitest';

import { TIERS, TEXTES_LICENCES } from '../src/lib/tiers.ts';

const paquetJson = JSON.parse(readFileSync('package.json', 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };
const dependances = { ...paquetJson.dependencies, ...paquetJson.devDependencies };

// Textes où un titulaire peut être nommé : fichiers LICENSE (parfois un dossier), README, en-têtes des sources.
function textesDu(paquet: string) {
  const dossier = path.join('node_modules', paquet);
  const fichiers: string[] = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = path.join(dossier, nom);
    if (/^(licen[cs]e|readme|notice)/i.test(nom)) {
      if (statSync(chemin).isDirectory()) fichiers.push(...readdirSync(chemin).map(f => path.join(chemin, f)));
      else fichiers.push(chemin);
    }
  }
  for (const entree of ['index.d.ts', 'index.js']) if (existsSync(path.join(dossier, entree))) fichiers.push(path.join(dossier, entree));
  return fichiers.map(f => readFileSync(f, 'utf8').slice(0, 20000)).join('\n');
}

for (const tiers of TIERS) {
  test(`crédit ${tiers.nom} : paquet installé, licence et titulaire exacts`, () => {
    expect(tiers.paquet in dependances, `${tiers.paquet} absent de package.json`).toBeTruthy();
    const declare = (JSON.parse(readFileSync(path.join('node_modules', tiers.paquet, 'package.json'), 'utf8')) as { license: string }).license;
    expect(tiers.licence, `licence de ${tiers.paquet}`).toBe(declare);
    expect(tiers.licence in TEXTES_LICENCES, `lien vers le texte de ${tiers.licence}`).toBeTruthy();
    expect(textesDu(tiers.paquet).includes(tiers.titulaire), `« ${tiers.titulaire} » introuvable dans la licence, le README ou les sources de ${tiers.paquet}`).toBeTruthy();
    const licence = readFileSync(path.join('node_modules', tiers.paquet, tiers.fichier), 'utf8');
    expect(licence, `texte complet de la licence de ${tiers.paquet}`).toMatch(tiers.licence === 'MIT' ? /Permission is hereby granted/ : /Apache License\s+Version 2\.0/);
  });
}

test('les projets dont le code part chez le visiteur sont crédités comme distribués', () => {
  const distribues = TIERS.filter(t => t.distribue).map(t => t.paquet);
  // Pagefind (scripts de recherche), Material Symbols (tracés insérés dans le HTML), Tailwind (CSS généré).
  for (const paquet of ['pagefind', '@material-symbols/svg-400', 'tailwindcss']) expect(distribues.includes(paquet), paquet).toBeTruthy();
});
