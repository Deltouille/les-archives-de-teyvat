import { test, expect } from 'vitest';

import { avertissements, cheminDImageDansLArticle, doublonsDImages, erreurDeNom, estUnNomDImage, estUneUrl, imagesDuCorps, LARGEUR_MIN, nomDImage } from '../src/lib/images.ts';

test('une image se désigne par le nom de son fichier, quel que soit son dossier', () => {
  expect(nomDImage('../assets/images/mondstadt.webp')).toBe('mondstadt');
  expect(nomDImage('src/assets/images/snezhnaya/personnages/monomakh-snezhnaya.webp')).toBe('monomakh-snezhnaya');
});

test('deux images de même nom dans deux dossiers sont signalées', () => {
  expect(doublonsDImages(['a/liyue.webp', 'b/fontaine.webp'])).toStrictEqual([]);
  expect(doublonsDImages(['a/liyue.webp', 'b/c/liyue.webp', 'fontaine.webp'])).toStrictEqual([{ nom: 'liyue', chemins: ['a/liyue.webp', 'b/c/liyue.webp'] }]);
});

test('une source est un lien seulement si elle commence par http(s)://', () => {
  expect(estUneUrl('https://static.wikia.nocookie.net/x.png')).toBeTruthy();
  expect(estUneUrl('HTTP://exemple.fr/x.png')).toBeTruthy();
  expect(!estUneUrl('~/Téléchargements/x.png')).toBeTruthy();
  expect(!estUneUrl('/tmp/https.png')).toBeTruthy();
});

test('le nom de l’image doit être utilisable tel quel dans le frontmatter', () => {
  expect(erreurDeNom('tsar-belyi')).toBe(null);
  expect(erreurDeNom('Tsar Belyi')).toMatch(/tsar-belyi/);
  expect(erreurDeNom('tsar-belyi.webp')).toMatch(/tsar-belyi-webp/);
  expect(erreurDeNom('été')).toMatch(/ete/);
  expect(erreurDeNom('---')).toMatch(/vide/);
});

test('les avertissements signalent ce qui rendra mal en bannière', () => {
  expect(avertissements({ width: 3840, height: 2160, hasAlpha: false })).toStrictEqual([]);
  expect(avertissements({ width: LARGEUR_MIN, height: 900 }).length).toBe(0);
  const portrait = avertissements({ width: 512, height: 1024, hasAlpha: true });
  expect(portrait.length).toBe(3);
  expect(portrait[0]).toMatch(/floue/);
  expect(portrait[1]).toMatch(/portrait/);
  expect(portrait[2]).toMatch(/transparent/);
});

test('dans le corps d’un article, seul un nom nu désigne une image du site', () => {
  expect(estUnNomDImage('nail-holy-soil')).toBeTruthy();
  for (const autre of ['https://exemple.fr/x.webp', './x.webp', '/x.webp', 'x.webp', 'dossier/x', 'Nail']) expect(!estUnNomDImage(autre), autre).toBeTruthy();
});

test('les images du site sont repérées dans le texte d’un article, pas les autres', () => {
  expect(imagesDuCorps('Avant.\n\n![Un clou](nail-holy-soil)\n\nApres ![](teyvat "titre") ![x](https://exemple.fr/a.png) ![y](./a.webp)')).toStrictEqual([{ nom: 'nail-holy-soil', alt: 'Un clou' }, { nom: 'teyvat', alt: '' }]);
});

test('une image citée dans le corps est retrouvée quel que soit le dossier de l’article ou de l’image', () => {
  const images = ['src/assets/images/teyvat.webp', 'src/assets/images/livestream/7-2/clou.webp'];
  const chemin = (article: string, nom: string) => cheminDImageDansLArticle({ article, nom, alt: 'Un clou', images });
  expect(chemin('src/content/articles/livestream/live.md', 'clou')).toBe('../../../assets/images/livestream/7-2/clou.webp');
  expect(chemin('src/content/articles/live.md', 'teyvat')).toBe('../../assets/images/teyvat.webp');
});

test('une image inconnue ou sans texte alternatif dans le corps est refusée, en nommant l’article', () => {
  const images = ['src/assets/images/teyvat.webp'];
  expect(() => cheminDImageDansLArticle({ article: 'src/content/articles/a.md', nom: 'teyva', alt: 'Teyvat', images })).toThrow(/Image inconnue « teyva » dans src\/content\/articles\/a\.md/);
  expect(() => cheminDImageDansLArticle({ article: 'src/content/articles/a.md', nom: 'teyvat', alt: ' ', images })).toThrow(/sans texte alternatif dans src\/content\/articles\/a\.md/);
});
