---
name: rediger-un-article
description: Transformer une source (page du Genshin Impact Wiki, vidéo, fil Reddit…) en article prêt à publier pour « Les Archives de Teyvat » — un fichier Markdown avec son frontmatter, en français. À suivre quand on te donne un lien et qu'on te demande « une entrée », « un article » ou « une fiche » pour le site.
---

# Rédiger un article pour « Les Archives de Teyvat »

Les Archives de Teyvat racontent le lore de Genshin Impact à la communauté française. Le site est construit avec Astro à partir de fichiers Markdown : **un article = un fichier `.md`**. Le dépôt est public : <https://github.com/Deltouille/les-archives-de-teyvat>.

Ta tâche : à partir du lien qu'on te donne, **récupérer le contenu, l'adapter en français et rendre un fichier Markdown complet**, dans le format ci-dessous. Le build du site refuse un fichier mal formé : respecte les règles marquées **obligatoire**.

## 1. Ce que tu rends

1. **Le nom du fichier** proposé (voir § 2).
2. **Le contenu complet du fichier** dans un seul bloc de code ` ```markdown `, frontmatter compris.
3. **Une courte liste de points à vérifier** : noms dont tu n'as pas trouvé la traduction française officielle, tags qui manquent au registre, image à ajouter, passages de la source que tu as volontairement laissés de côté.

Si tu as accès au dépôt, place le fichier dans `src/content/articles/` puis lance `npm run check` et `npm run build` : une erreur nomme le fichier et dit quoi corriger.

## 2. Le nom du fichier

- Il donne l'adresse de l'article : `mondstadt-act-i.md` est publié sur `/lore/mondstadt-act-i`.
- **Obligatoire** : en minuscules, sans accents, mots séparés par des tirets, extension `.md`. Exemple : `chanson-du-dragon-et-de-la-liberte.md`, `venti-barde-et-archon.md`.
- **Obligatoire** : unique sur tout le site (deux fichiers de même nom, même dans des dossiers différents, font échouer le build).
- **Interdit** (adresses déjà prises par des redirections) : `tags`, `quetes`, `concepts`, `personnages`, `regions`, `factions`, `evenements`, `prologue-mondstadt`, `chronologie`, `teyvat`, `archons`, `cataclysme`, `mondstadt`, `ordre-abysse`, `venti`.
- Le dossier est libre et n'a aucun effet sur l'adresse. Habitude du dépôt : `src/content/articles/<nation>/<type>/`, par exemple `mondstadt/quest/`.
- Ne renomme jamais un article déjà publié : cela change son adresse (il faudrait une redirection).

## 3. Le frontmatter

Entre deux lignes `---`, en tête de fichier. Mets les textes entre guillemets droits `"…"` (un titre contient souvent `:`, qui casse le YAML sans guillemets).

| Champ | Statut | Contenu |
|---|---|---|
| `titre` | **obligatoire** | Titre affiché sur la bannière et dans l'onglet. Pour une quête : son nom officiel français, précédé de l'acte (`"Acte I : Le Voyageur qui attrapa le vent"`). |
| `description` | **obligatoire** | Une phrase (environ 100 à 160 caractères), **propre à cet article**. Affichée sous le titre, sur les cartes et dans les résultats des moteurs de recherche. |
| `image` | **obligatoire** | Nom d'une image existante, **sans extension** (voir § 5). |
| `imageAlt` | facultatif | Description de l'image pour les lecteurs d'écran. Laisse-le absent si l'image est purement décorative. |
| `publieLe` | **obligatoire** | Date du jour au format `AAAA-MM-JJ`, sans guillemets. |
| `modifieLe` | facultatif | Seulement pour la mise à jour d'un article existant ; jamais antérieure à `publieLe`. |
| `brouillon` | à mettre | `true` : l'article reste visible en développement mais n'est pas publié tant que Deltouille n'a pas relu et retiré la ligne. |
| `aLaUne` | ne pas mettre | Choix éditorial réservé à Deltouille (mise en avant sur l'accueil). |
| `tags` | **obligatoire** | Liste d'identifiants du registre, **au moins un thème** (voir § 4). |
| `quete` | **obligatoire pour un épisode** | Place de l'article dans une suite d'épisodes, qui fixe son ordre sur les pages de tag et ses liens « Épisode précédent / suivant » : `serie` (un des tags de l'article : `quete-d-archons` pour les quêtes d'Archons), `chapitre` (`0` = prologue à Mondstadt, `1` = Liyue, `2` = Inazuma…), `acte` (décimal pour un épisode intercalé : `3.5` entre les actes III et IV). Deux articles ne peuvent pas occuper la même place. Absent pour un article qui n'est pas un épisode. |
| `spoilers` | conseillé | Une phrase disant jusqu'où l'article dévoile l'histoire. Affichée dans l'encadré « Avant de lire ». |
| `resume` | conseillé | **Trois** phrases courtes qui résument l'article. Encadré « L'essentiel en quelques mots ». |
| `sources` | conseillé | Où retrouver l'histoire **dans le jeu** : liste de `titre` + `detail`. Encadré « Pour retrouver l'histoire dans le jeu ». Ce n'est pas la liste des sites consultés : ceux-là vont dans `credits`. |
| `credits` | **obligatoire si tu reprends un contenu** | Les sources dont l'article s'inspire ou qu'il adapte (voir § 6). |

Les encadrés `spoilers`, `resume` et `sources` ne s'affichent que s'ils sont remplis. N'ajoute **aucun autre champ** : il serait ignoré.

## 4. Les tags

Le registre est `src/content/tags.yaml` : <https://raw.githubusercontent.com/Deltouille/les-archives-de-teyvat/main/src/content/tags.yaml>. Lis-le avant de choisir.

- **Obligatoire** : n'utilise que des identifiants qui y figurent. Un tag inconnu fait échouer le build. S'il en manque un, ne l'invente pas dans l'article : propose-le dans tes points à vérifier (identifiant, `libelle`, `description`).
- **Obligatoire** : au moins un **thème** (tag marqué `theme: true`). Thèmes actuels : `quetes`, `concepts`, `personnages`, `regions`, `factions`, `evenements`.
- **L'ordre compte** : le **premier thème** de la liste donne le badge de l'article, son fil d'Ariane et son filtre de recherche. Mets donc d'abord le thème qui décrit le mieux l'article.
- Ajoute ensuite les tags utiles pour relier les articles : nation (`mondstadt`), série (`quete-d-archons`), `premiers-pas` pour une lecture d'introduction. Les articles qui partagent le plus de tags sont proposés en fin de lecture : des tags pertinents valent mieux que beaucoup de tags.

## 5. L'image

- Un nom de fichier de `src/assets/images/`, sans `.webp` : liste à jour sur <https://github.com/Deltouille/les-archives-de-teyvat/tree/main/src/assets/images>. Au moment d'écrire cette fiche : `fontaine`, `inazuma`, `liyue`, `mondstadt`, `natlan`, `nod-krai`, `snezhnaya`, `sumeru`, `teyvat` (`fond-d-ecran` est réservé à l'accueil).
- **Obligatoire** : l'image doit exister, sinon le build échoue. Choisis celle de la nation concernée (`teyvat` pour un sujet qui dépasse une nation).
- Ne télécharge et n'ajoute aucune image toi-même : si une image dédiée serait meilleure, dis-le dans tes points à vérifier, avec son lien si tu en connais un (elle sera ajoutée par `npm run image -- <lien> <nom>`). Une bannière s'affiche en pleine largeur : une illustration en paysage d'au moins 1600 px de large convient, un portrait de personnage sur fond transparent non.
- Pas d'image dans le corps de l'article.

## 6. Droits et crédits

Les textes du site sont sous licence **CC BY-SA 3.0**. Ce que tu as le droit de faire dépend de la source :

- **Genshin Impact Wiki (Fandom, `genshin-impact.fandom.com`)** : ses textes sont sous CC BY-SA 3.0, tu peux les **traduire et les adapter**. Crédit **obligatoire** :

  ```yaml
  credits:
    - type: wiki
      titre: "The Outlander Who Caught the Wind"   # titre de la page du wiki, tel quel
      url: https://genshin-impact.fandom.com/wiki/The_Outlander_Who_Caught_the_Wind
      modifications: "Traduit de l'anglais et adapté."   # obligatoire : ce que tu as changé
  ```

  `url` doit être en `https://` sur `genshin-impact.fandom.com`, et `modifications` ne peut pas être vide (la licence impose de dire ce qui a changé : traduit, résumé, réorganisé, complété…).

- **Vidéo, fil Reddit, publication sur X, article de blog** : ces contenus appartiennent à leur auteur. **Ne les traduis pas et ne les recopie pas** : écris un texte original qui s'en inspire, et crédite l'auteur :

  ```yaml
  credits:
    - type: communaute
      auteur: "Nom ou pseudo de l'auteur"
      plateforme: youtube        # reddit, x, youtube ou autre
      url: https://www.youtube.com/watch?v=…
      titre: "Titre de la vidéo"  # facultatif
  ```

  `plateforme` doit correspondre à l'adresse (`reddit` : reddit.com ou redd.it ; `x` : x.com ou twitter.com ; `youtube` : youtube.com ou youtu.be ; `autre` : tout autre site). Adresse en `https://` uniquement.

- **Le jeu lui-même** (dialogues, textes d'objets) appartient à HoYoverse : résume et paraphrase ; une citation doit rester courte, entre guillemets « », et servir le propos.
- Plusieurs sources : plusieurs entrées dans `credits`.
- N'invente jamais un crédit, une adresse ou un auteur.

## 7. Le corps de l'article

### Structure

- **Pas de titre `#`** : le titre de la page vient du champ `titre`.
- **Sections en `##`**, avec un titre court et parlant (`## La rencontre avec Paimon`, `## L'attaque de Stormterror`). Ce sont les seuls titres repris dans le sommaire « Dans cet article » : un article qui n'a que des `###` n'a pas de sommaire.
- `###` seulement pour découper une longue section.
- L'ordre suit l'histoire, du début à la fin.
- Longueur habituelle : 800 à 2 000 mots, de 6 à 12 sections. Un paragraphe = une à trois phrases, séparé du suivant par une ligne vide.
- Markdown simple : paragraphes, `**gras**` avec parcimonie, listes si elles aident vraiment. Pas de HTML, pas de tableau, pas d'image, pas de citation `>` décorative.
- Liens vers d'autres articles du site seulement s'ils existent, sous la forme `/lore/<nom-du-fichier>`, sans barre finale.

### Style

- Français soigné, **au présent de narration**, ton de conteur clair et neutre : on raconte l'histoire, on ne donne pas d'avis sur le jeu.
- **Noms de la version française officielle du jeu** : Ordre de Favonius, Lac Tombétoile, Cap de la Promesse, Ventlevé, Brutocollinus, Œil divin, Anémo… Quand la version française garde le nom anglais (Stormterror), garde-le. Si tu ne trouves pas le nom français, garde le nom anglais et signale-le dans tes points à vérifier : n'invente pas de traduction.
- Le protagoniste est « le Voyageur » ; son jumeau, « le jumeau du Voyageur » (le joueur choisit Aether ou Lumine).
- Guillemets français « … » ; une même forme d'apostrophe dans tout le fichier.
- Pas de remplissage (« Dans cet article, nous allons voir… »), pas de conclusion qui répète le résumé : le dernier paragraphe ouvre sur la suite de l'histoire.
- Reste fidèle à la source : pas d'événement, de motivation ou de date inventés. Une théorie se présente comme telle et se crédite.

## 8. Exemple complet (abrégé)

D'après l'acte I du prologue (`src/content/articles/mondstadt/quest/mondstadt-act-I.md`), corps raccourci :

```markdown
---
titre: "Acte I : Le Voyageur qui attrapa le vent"
description: "Le Voyageur se réveille à Teyvat, rencontre Paimon et découvre une Mondstadt menacée par le dragon Stormterror."
image: mondstadt
imageAlt: "Les paysages verdoyants de Teyvat au début du voyage"
publieLe: 2026-10-13
brouillon: true
tags: [quetes, quete-d-archons, mondstadt, premiers-pas]
quete:
  serie: quete-d-archons
  chapitre: 0
  acte: 1
spoilers: "Prologue des quêtes d’Archons, acte I."
resume:
  - "Le Voyageur cherche son jumeau et arrive à Mondstadt avec Paimon."
  - "Dvalin, ancien protecteur de la cité, est au centre de la crise."
  - "L'Ordre de Favonius confie au Voyageur la purification des temples des Quatre Vents."
sources:
  - titre: "Quêtes d’Archons — Prologue, acte I"
    detail: "De la rencontre avec Paimon au retour au quartier général de l'Ordre de Favonius."
credits:
  - type: wiki
    titre: "The Outlander Who Caught the Wind"
    url: https://genshin-impact.fandom.com/wiki/The_Outlander_Who_Caught_the_Wind
    modifications: "Traduit de l'anglais et adapté."
---

## Un voyage interrompu

Au cours de leurs voyages à travers les mondes, le Voyageur et son jumeau sont confrontés à une mystérieuse entité alors qu'ils s'apprêtent à quitter un monde.

Un combat s'engage, au cours duquel l'entité parvient à emprisonner le jumeau du Voyageur, avant de lui faire subir le même sort.

## La rencontre avec Paimon

Alors qu'il se trouve près du Cap de la Promesse, le Voyageur repêche une étrange petite créature nommée Paimon, lui sauvant ainsi la vie.
```

## 9. Vérifications avant de rendre

- [ ] Nom de fichier en minuscules avec tirets, absent de la liste des noms interdits.
- [ ] `titre`, `description`, `image`, `publieLe`, `tags` présents ; `brouillon: true`.
- [ ] Description propre à cet article (pas celle d'un autre épisode de la série).
- [ ] Tous les tags existent dans le registre ; le premier thème est le bon.
- [ ] L'image existe.
- [ ] Pour un épisode de quête : `quete` rempli (série présente dans `tags`, chapitre et acte justes, place libre dans la série).
- [ ] `spoilers`, `resume` et `sources` décrivent bien **cet** article (attention aux copier-coller d'un article voisin).
- [ ] Un crédit par source adaptée ou utilisée ; `modifications` rempli pour le wiki ; adresses en `https://`.
- [ ] Sections en `##`, pas de `#`, pas de HTML ni d'image dans le corps.
- [ ] Noms français officiels ; noms incertains listés dans les points à vérifier.
