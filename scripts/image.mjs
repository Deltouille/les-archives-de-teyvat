// Ajoute une image de bannière : téléchargée (lien) ou reprise d'un fichier, convertie en WebP, réduite à
// LARGEUR_MAX au plus, rangée dans src/assets/images/[<dossiers>/]<nom>.webp. Cf. documentation/decisions.md, D45, D47.
//
//   npm run image -- <lien ou fichier> <nom>                 puis « image: <nom> » dans le frontmatter
//   npm run image -- <lien ou fichier> <dossier>/<nom>       rangée dans un sous-dossier ; on cite toujours « image: <nom> »
//   npm run image -- <lien ou fichier> <nom> --remplacer     écrase l'image existante, là où elle est rangée
//
// Certains sites (le wiki Fandom, derrière Cloudflare) refusent les téléchargements hors navigateur : enregistrer
// alors l'image depuis le navigateur et donner le chemin du fichier.
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { avertissements, erreurDeNom, estUneUrl, LARGEUR_MAX, nomDImage } from '../src/lib/images.mjs';
import { DEPOT } from '../src/lib/projet.mjs';

const DOSSIER = 'src/assets/images';
const arreter = message => { console.error(message); process.exit(1); };

const options = process.argv.slice(2);
const remplacer = options.includes('--remplacer');
const [source, destination] = options.filter(o => o !== '--remplacer');
if (!source || !destination) arreter('Usage : npm run image -- <lien ou fichier> [<dossier>/]<nom> [--remplacer]');

const nom = path.posix.basename(destination);
const sousDossier = path.posix.dirname(destination);
const erreur = erreurDeNom(nom);
if (erreur) arreter(erreur);
if (sousDossier.split('/').some(d => d === '..')) arreter(`Dossier « ${sousDossier} » refusé : il doit rester sous ${DOSSIER}.`);

// Le nom doit être unique dans tous les dossiers : c'est lui seul que cite le frontmatter.
const existante = (await readdir(DOSSIER, { recursive: true }))
  .filter(f => f.endsWith('.webp') && nomDImage(f) === nom)
  .map(f => path.posix.join(DOSSIER, f.split(path.sep).join('/')))[0];
const demandee = path.posix.join(DOSSIER, sousDossier, `${nom}.webp`);
if (existante && !remplacer) arreter(`${existante} existe déjà : choisir un autre nom, ou ajouter --remplacer.`);
if (existante && sousDossier !== '.' && existante !== demandee) arreter(`${existante} existe déjà ailleurs : pour la remplacer, donner seulement « ${nom} » (ou la déplacer à la main).`);
const cible = existante ?? demandee;

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
      `  npm run image -- <chemin du fichier> ${destination}`);
  }
  return Buffer.from(await reponse.arrayBuffer());
}

const donnees = await lire();
const meta = await sharp(donnees).metadata().catch(() => arreter('Ce fichier n’est pas une image lisible (PNG, JPEG, WebP, AVIF, GIF…).'));
await mkdir(path.dirname(cible), { recursive: true });
// rotate() applique l'orientation EXIF des photos avant de la retirer.
const { width, height, size } = await sharp(donnees)
  .rotate()
  .resize({ width: LARGEUR_MAX, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(cible);

console.log(`${existante ? 'Remplacée' : 'Ajoutée'} : ${cible} (${width} × ${height}, ${Math.round(size / 1024)} Ko)`);
for (const a of avertissements(meta)) console.warn(`Attention : ${a}`);
console.log(`Dans l’article : image: ${nom}`);
