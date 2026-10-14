import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { NOMS_ICONES } from './lib/icones';

// Un article = un fichier. Son URL est /lore/<nom-du-fichier> : elle ne dépend pas des tags,
// donc retaguer un article ne casse jamais un lien. Règles croisées (tags connus, thème, image, crédits) : src/lib/validation.mjs.
const articles = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '**/*.md' }),
  schema: z.object({
    titre: z.string(),
    description: z.string(),
    // Nom d'un .webp de src/assets/images, sans extension.
    image: z.string(),
    imageAlt: z.string().default(''),
    publieLe: z.coerce.date(),
    modifieLe: z.coerce.date().optional(),
    brouillon: z.boolean().default(false),
    // Identifiants déclarés dans tags.yaml ; au moins un doit être un thème.
    tags: z.array(z.string()).min(1),
    // Encadrés facultatifs : ils ne s'affichent que s'ils sont remplis.
    resume: z.array(z.string()).default([]),
    spoilers: z.string().optional(),
    sources: z.array(z.object({ titre: z.string(), detail: z.string() })).default([]),
    // Contenus repris d'ailleurs, crédités en fin d'article et sur /credits. Règles d'URL et de licence : src/lib/credits.mjs.
    credits: z.array(z.discriminatedUnion('type', [
      // Adaptation d'une page du Genshin Impact Wiki (Fandom) : l'article passe sous CC BY-SA 3.0.
      z.object({ type: z.literal('wiki'), titre: z.string(), url: z.url(), modifications: z.string() }),
      // Théorie ou analyse d'un membre de la communauté.
      z.object({ type: z.literal('communaute'), auteur: z.string(), plateforme: z.enum(['reddit', 'x', 'youtube', 'autre']), url: z.url(), titre: z.string().optional() }),
    ])).default([]),
  }),
});

// Le registre des tags : libellé et description de chacun, et lesquels sont des thèmes
// (mis en avant dans le menu, avec une icône). L'ordre du fichier est libre : tout s'affiche par libellé.
const tags = defineCollection({
  loader: file('./src/content/tags.yaml'),
  schema: z.object({
    libelle: z.string(),
    description: z.string(),
    theme: z.boolean().default(false),
    // Thèmes uniquement (exigés par la validation) : nom au singulier (badge des cartes) et icône (src/lib/icones.ts).
    singulier: z.string().optional(),
    icone: z.enum(NOMS_ICONES).optional(),
  }),
});

export const collections = { articles, tags };
