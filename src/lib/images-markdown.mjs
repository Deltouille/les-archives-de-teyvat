// Images dans le corps d'un article : `![texte alternatif](<nom>)`, le nom étant celui du fichier .webp rangé où l'on
// veut sous src/assets/images (comme `image:` dans le frontmatter, D47). Plugins du processeur Markdown d'Astro
// (Sätteri) : le premier remplace le nom par le chemin relatif de l'image, qu'Astro optimise ensuite comme toute image
// locale ; le second lui demande des variantes de largeur (D48).
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cheminDImageDansLArticle, estUnNomDImage } from './images.mjs';

const DOSSIER = 'src/assets/images';
// Colonne de lecture : 800 px au plus. `width` = la plus grande des variantes, sinon le src de repli serait
// l'original ré-encodé (cf. <Image> dans CLAUDE.md).
const VARIANTES = { widths: [480, 800, 1200], width: 1200, sizes: '(min-width: 840px) 800px, 100vw' };
const relatif = chemin => path.relative(process.cwd(), chemin).split(path.sep).join('/');

export const imagesParNom = {
  name: 'images-par-nom',
  /** @param {{ url: string, alt?: string | null }} node @param {any} ctx */
  image(node, ctx) {
    if (!ctx.fileURL || !estUnNomDImage(node.url)) return;
    // Relu à chaque article : en dev, une image ajoutée ou déplacée est prise en compte sans redémarrer.
    const images = readdirSync(DOSSIER, { recursive: true, encoding: 'utf8' }).filter(f => f.endsWith('.webp')).map(f => `${DOSSIER}/${f.split(path.sep).join('/')}`);
    const article = relatif(fileURLToPath(ctx.fileURL));
    ctx.setProperty(node, 'url', cheminDImageDansLArticle({ article, nom: node.url, alt: node.alt ?? '', images }));
  },
};

// Après la conversion en HTML, avant qu'Astro ne repère les images : ces propriétés sont transmises à getImage(),
// qui produit un srcset au lieu de servir l'image entière.
export const variantesDesImages = {
  name: 'variantes-des-images',
  element: {
    filter: ['img'],
    /** @param {{ properties?: Record<string, unknown> }} node @param {any} ctx */
    visit(node, ctx) {
      if (!String(node.properties?.src ?? '').includes('assets/images/')) return;
      for (const [cle, valeur] of Object.entries(VARIANTES)) ctx.setProperty(node, cle, valeur);
    },
  },
};
