import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avertissements, cheminDImageDansLArticle, doublonsDImages, erreurDeNom, estUnNomDImage, estUneUrl, imagesDuCorps, LARGEUR_MIN, nomDImage } from '../src/lib/images.mjs';

test('une image se désigne par le nom de son fichier, quel que soit son dossier', () => {
  assert.equal(nomDImage('../assets/images/mondstadt.webp'), 'mondstadt');
  assert.equal(nomDImage('src/assets/images/snezhnaya/personnages/monomakh-snezhnaya.webp'), 'monomakh-snezhnaya');
});

test('deux images de même nom dans deux dossiers sont signalées', () => {
  assert.deepEqual(doublonsDImages(['a/liyue.webp', 'b/fontaine.webp']), []);
  assert.deepEqual(doublonsDImages(['a/liyue.webp', 'b/c/liyue.webp', 'fontaine.webp']), [{ nom: 'liyue', chemins: ['a/liyue.webp', 'b/c/liyue.webp'] }]);
});

test('une source est un lien seulement si elle commence par http(s)://', () => {
  assert.ok(estUneUrl('https://static.wikia.nocookie.net/x.png'));
  assert.ok(estUneUrl('HTTP://exemple.fr/x.png'));
  assert.ok(!estUneUrl('~/Téléchargements/x.png'));
  assert.ok(!estUneUrl('/tmp/https.png'));
});

test('le nom de l’image doit être utilisable tel quel dans le frontmatter', () => {
  assert.equal(erreurDeNom('tsar-belyi'), null);
  assert.match(erreurDeNom('Tsar Belyi'), /tsar-belyi/);
  assert.match(erreurDeNom('tsar-belyi.webp'), /tsar-belyi-webp/);
  assert.match(erreurDeNom('été'), /ete/);
  assert.match(erreurDeNom('---'), /vide/);
});

test('les avertissements signalent ce qui rendra mal en bannière', () => {
  assert.deepEqual(avertissements({ width: 3840, height: 2160, hasAlpha: false }), []);
  assert.equal(avertissements({ width: LARGEUR_MIN, height: 900 }).length, 0);
  const portrait = avertissements({ width: 512, height: 1024, hasAlpha: true });
  assert.equal(portrait.length, 3);
  assert.match(portrait[0], /floue/);
  assert.match(portrait[1], /portrait/);
  assert.match(portrait[2], /transparent/);
});

test('dans le corps d’un article, seul un nom nu désigne une image du site', () => {
  assert.ok(estUnNomDImage('nail-holy-soil'));
  for (const autre of ['https://exemple.fr/x.webp', './x.webp', '/x.webp', 'x.webp', 'dossier/x', 'Nail']) assert.ok(!estUnNomDImage(autre), autre);
});

test('les images du site sont repérées dans le texte d’un article, pas les autres', () => {
  assert.deepEqual(imagesDuCorps('Avant.\n\n![Un clou](nail-holy-soil)\n\nApres ![](teyvat "titre") ![x](https://exemple.fr/a.png) ![y](./a.webp)'),
    [{ nom: 'nail-holy-soil', alt: 'Un clou' }, { nom: 'teyvat', alt: '' }]);
});

test('une image citée dans le corps est retrouvée quel que soit le dossier de l’article ou de l’image', () => {
  const images = ['src/assets/images/teyvat.webp', 'src/assets/images/livestream/7-2/clou.webp'];
  const chemin = (article, nom) => cheminDImageDansLArticle({ article, nom, alt: 'Un clou', images });
  assert.equal(chemin('src/content/articles/livestream/live.md', 'clou'), '../../../assets/images/livestream/7-2/clou.webp');
  assert.equal(chemin('src/content/articles/live.md', 'teyvat'), '../../assets/images/teyvat.webp');
});

test('une image inconnue ou sans texte alternatif dans le corps est refusée, en nommant l’article', () => {
  const images = ['src/assets/images/teyvat.webp'];
  assert.throws(() => cheminDImageDansLArticle({ article: 'src/content/articles/a.md', nom: 'teyva', alt: 'Teyvat', images }), /Image inconnue « teyva » dans src\/content\/articles\/a\.md/);
  assert.throws(() => cheminDImageDansLArticle({ article: 'src/content/articles/a.md', nom: 'teyvat', alt: ' ', images }), /sans texte alternatif dans src\/content\/articles\/a\.md/);
});
