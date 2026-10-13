import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { NOMS_ICONES } from './lib/icones';

// Le registre des tags : libellé et description de chacun, et lesquels sont des thèmes
// (mis en avant dans le menu, avec une icône). L'ordre du fichier est libre : tout s'affiche par libellé.
const tags = defineCollection({
  loader: file('./src/content/tags.yaml'),
  schema: z.object({
    libelle: z.string(),
    description: z.string(),
    theme: z.boolean().default(false),
    // Thèmes uniquement : nom au singulier (badge des cartes) et icône (cf. src/lib/icones.ts).
    singulier: z.string().optional(),
    icone: z.enum(NOMS_ICONES).optional(),
  }),
});

export const collections = { tags };
