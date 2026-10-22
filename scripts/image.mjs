// Ajoute une image de bannière : téléchargée (lien) ou reprise d'un fichier, convertie en WebP, réduite à
// LARGEUR_MAX au plus, rangée dans src/assets/images/<nom>.webp. Cf. documentation/decisions.md, D45.
//
//   npm run image -- <lien ou fichier> <nom>             puis « image: <nom> » dans le frontmatter
//   npm run image -- <lien ou fichier> <nom> --remplacer  écrase une image existante
//
// Certains sites (le wiki Fandom, derrière Cloudflare) refusent les téléchargements hors navigateur : enregistrer
// alors l'image depuis le navigateur et donner le chemin du fichier.
import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { avertissements, erreurDeNom, estUneUrl, LARGEUR_MAX } from '../src/lib/images.mjs';
import { DEPOT } from '../src/lib/projet.mjs';

const DOSSIER = path.resolve('src/assets/images');
const arreter = message => { console.error(message); process.exit(1); };

const options = process.argv.slice(2);
const remplacer = options.includes('--remplacer');
const [source, nom] = options.filter(o => o !== '--remplacer');
if (!source || !nom) arreter('Usage : npm run image -- <lien ou fichier> <nom> [--remplacer]');

const erreur = erreurDeNom(nom);
if (erreur) arreter(erreur);
const cible = path.join(DOSSIER, `${nom}.webp`);
const existe = await stat(cible).then(() => true, () => false);
if (existe && !remplacer) arreter(`src/assets/images/${nom}.webp existe déjà : choisir un autre nom, ou ajouter --remplacer.`);

async function lire() {
  if (!estUneUrl(source)) {
    const chemin = path.resolve(source.replace(/^~(?=$|\/)/, homedir()));
    return readFile(chemin).catch(() => arreter(`Fichier introuvable : ${chemin}`));
  }
  const reponse = await fetch(source, { headers: { 'User-Agent': `les-archives-de-teyvat/image (+${DEPOT})` } })
    .catch(e => arreter(`Téléchargement impossible : ${e.message}`));
  const type = reponse.headers.get('content-type') ?? '';
  if (!reponse.ok || !type.startsWith('image/')) {
    arreter(`Le site a refusé le téléchargement (HTTP ${reponse.status}, ${type || 'type inconnu'}).\n` +
      'Enregistre l’image depuis ton navigateur (clic droit, « Enregistrer l’image sous… »), puis :\n' +
      `  npm run image -- <chemin du fichier> ${nom}`);
  }
  return Buffer.from(await reponse.arrayBuffer());
}

const donnees = await lire();
const meta = await sharp(donnees).metadata().catch(() => arreter('Ce fichier n’est pas une image lisible (PNG, JPEG, WebP, AVIF, GIF…).'));
// rotate() applique l'orientation EXIF des photos avant de la retirer.
const { width, height, size } = await sharp(donnees)
  .rotate()
  .resize({ width: LARGEUR_MAX, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(cible);

console.log(`${existe ? 'Remplacée' : 'Ajoutée'} : src/assets/images/${nom}.webp (${width} × ${height}, ${Math.round(size / 1024)} Ko)`);
for (const a of avertissements(meta)) console.warn(`Attention : ${a}`);
console.log(`Dans l’article : image: ${nom}`);
