---
name: rediger-un-article
description: Rédiger ou réviser des articles de lore pour « Les Archives de Teyvat » à partir de plusieurs sources (livres, quêtes, descriptions d’objets, wiki, etc.). Produire des articles Markdown complets, détaillés, chronologiques, sourcés, dans un français simple et neutre, avec frontmatter Astro valide.
---

# Rédiger un article pour « Les Archives de Teyvat »

Les Archives de Teyvat racontent le lore de Genshin Impact à la communauté française. Le site est construit avec Astro à partir de fichiers Markdown : **un article = un fichier `.md`**. Le dépôt est public : <https://github.com/Deltouille/les-archives-de-teyvat>.

Ta tâche : à partir des sources données, **les lire, croiser leurs informations et rédiger ou réviser un article Markdown complet**, dans le format ci-dessous. L'objectif est d'expliquer le lore avec précision, de façon accessible, sans exagération ni remplissage. Le build du site refuse un fichier mal formé : respecte les règles marquées **obligatoire**.

Quand l'utilisateur retravaille un passage d'un article existant, **révise uniquement le passage demandé**, sauf demande expresse de reprendre l'ensemble. Quand il fournit l'article complet, fais aussi une passe de cohérence globale : ordre des faits, enchaînements, redondances, contradictions et introduction des personnages. Ne remplace jamais silencieusement une information incertaine par une supposition.

## 1. Ce que tu rends

1. **Le nom du fichier** proposé (voir § 2).
2. **Le contenu complet du fichier** dans un seul bloc de code ` ```markdown `, frontmatter compris (ou un fichier `.md` téléchargeable quand cela facilite la lecture).
3. **Une courte liste de points à vérifier** : noms dont la traduction officielle est incertaine, chronologie non confirmée, interprétations à valider, tags manquants, image à ajouter ou passages volontairement laissés de côté. Ne présente pas comme vérifié ce qui ne l’a pas été.

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
- **Obligatoire** : au moins un **thème** (tag marqué `theme: true`). Thèmes actuels : `quetes`, `concepts`, `personnages`, `regions`, `factions`, `evenements`, `bandes-annonces`, `theories`.
- **`theories`** : seulement pour un article qui défend une hypothèse ou une lecture non confirmée par le jeu. Il passe alors **en premier** (badge « Théorie »), pour que le lecteur sache d'emblée que ce n'est pas du lore établi.
- **L'ordre compte** : le **premier thème** de la liste donne le badge de l'article, son fil d'Ariane et son filtre de recherche. Mets donc d'abord le thème qui décrit le mieux l'article.
- Ajoute ensuite les tags utiles pour relier les articles : nation (`mondstadt`), série (`quete-d-archons`), `premiers-pas` pour une lecture d'introduction. Les articles qui partagent le plus de tags sont proposés en fin de lecture : des tags pertinents valent mieux que beaucoup de tags.

## 5. L'image

- Le nom d'un fichier `.webp` de `src/assets/images/` (rangé dans n'importe quel sous-dossier), sans dossier ni `.webp` : liste à jour sur <https://github.com/Deltouille/les-archives-de-teyvat/tree/main/src/assets/images>. Au moment d'écrire cette fiche : `fontaine`, `inazuma`, `liyue`, `mondstadt`, `natlan`, `nod-krai`, `snezhnaya`, `sumeru`, `teyvat` (`fond-d-ecran` est réservé à l'accueil).
- **Obligatoire** : l'image doit exister, sinon le build échoue. Choisis celle de la nation concernée (`teyvat` pour un sujet qui dépasse une nation).
- Ne télécharge et n'ajoute aucune image toi-même : si une image dédiée serait meilleure, dis-le dans tes points à vérifier.
- **Dans le corps**, seulement si on te fournit des images pour cet article : `![description de l'image](<nom>)`, seule sur sa ligne, avec le même nom sans dossier ni extension que pour `image`. La description est obligatoire (le build échoue sans elle) : décris ce que l'image montre, en une phrase. N'invente pas d'image : un nom inconnu fait échouer le build.

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

## 7. Recherche et traitement des sources

- **Lire les sources fournies avant de rédiger**. Si un lien donne accès à plusieurs volumes, pages, pièces d'un ensemble d'artefacts ou chapitres de quête, consulter autant de parties pertinentes que possible, pas uniquement la première.
- Pour les biographies et les sujets complexes, **croiser plusieurs types de sources** : livres en jeu, descriptions d'armes et d'artefacts, dialogues de quêtes, récits du monde et pages du wiki.
- Privilégier les **textes originaux du jeu en français** lorsqu'ils sont disponibles. Le wiki sert notamment à retrouver, recouper et contextualiser les informations ; il ne remplace pas automatiquement les sources en jeu.
- Une source peut contenir une légende, le récit d'un narrateur peu fiable, une information historique ou une révélation ultérieure. **Ne pas les mettre sur le même plan** : écrire « selon une légende », « le livre rapporte », « la quête révèle » lorsque c'est utile.
- Séparer clairement **fait établi, hypothèse, rapprochement entre plusieurs sources et théorie**. Ne pas transformer une déduction plausible en certitude. En cas de contradiction, l'expliquer plutôt que choisir arbitrairement une version.
- Conserver les faits significatifs, les personnages, les liens de causalité et les événements spécifiques. **Ne pas réduire un livre détaillé à « le livre raconte que… »** si les épisodes peuvent enrichir le récit : raconter directement ce qui arrive au personnage.
- Éviter l'invention de pensées, sentiments, intentions, paroles, dates ou relations. Une émotion ou une motivation ne doit être attribuée à un personnage que si la source la justifie.
- Si une source n'est pas accessible, le signaler et ne pas prétendre l'avoir lue. Utiliser une transcription alternative uniquement si elle est identifiable et signaler les limites de vérification.
- Pour chaque ajout majeur, pouvoir identifier la source en jeu qui le soutient. Renseigner ses références dans `sources` lorsque cela aide le lecteur à retrouver le passage.

## 8. Le corps de l'article

### Structure

- **Pas de titre `#`** : le titre de la page vient du champ `titre`.
- **Sections en `##`**, avec un titre court et parlant (`## La rencontre avec Paimon`, `## L'attaque de Stormterror`). Ce sont les seuls titres repris dans le sommaire « Dans cet article » : un article qui n'a que des `###` n'a pas de sommaire.
- `###` seulement pour découper une longue section.
- **Préférer l'ordre chronologique** : origines, jeunesse, rencontres, événements du règne, conséquences, puis héritage. Si une quête moderne révèle un fait ancien, raconter le fait ancien à sa place chronologique et expliquer plus tard la révélation si nécessaire.
- Développer les épisodes importants au lieu de les mentionner en une phrase : contexte, personnages, déroulement et conséquences **quand les sources permettent de les établir**.
- Les biographies peuvent être longues : **la qualité et la richesse sourcée priment sur un plafond de mots**. 800 à 2 000 mots constitue un repère pour un sujet simple ; 2 500 mots ou davantage conviennent à une biographie bien documentée. Ne pas allonger artificiellement.
- Adapter le nombre de sections à la matière : généralement 6 à 12, davantage si le sujet le demande. Utiliser `###` pour découper un épisode dense sans fragmenter le sommaire.
- Un paragraphe contient habituellement une à trois phrases, séparé du suivant par une ligne vide. Privilégier des paragraphes lisibles, sans sacrifier des détails utiles.
- Markdown simple : paragraphes, `**gras**` avec parcimonie, listes si elles aident vraiment. Pas de HTML, pas de tableau, pas de citation `>` décorative ; une image seulement si elle t'est fournie (§ 5).
- Liens vers d'autres articles du site seulement s'ils existent, sous la forme `/lore/<nom-du-fichier>`, sans barre finale.

### Style

- Français soigné, **au présent de narration**, clair, direct et neutre. Le texte doit ressembler à une biographie ou à un récit documentaire accessible, pas à une bande-annonce ou à un conte épique.
- **Privilégier les formulations simples** : « Monomakh souhaite créer un monde sans souffrance » plutôt que « Convaincu que l'humanité ne pourra jamais connaître une paix véritable sous le joug des puissances célestes… ».
- Éviter les tournures qui grossissent artificiellement l'enjeu : « ambition qui dépasse le monde », « bouleverse à jamais son destin », « révélation capitale », « puissance céleste » si « dieux », « Celestia » ou une formulation plus précise suffit.
- Raconter les événements **plutôt que commenter leur importance**. Ne pas répéter à la fin de chaque section que l'événement est déterminant ou qu'il annonce la suite.
- Éviter les redondances : présenter une fois clairement un projet, ses objectifs et ses acteurs, puis développer ses étapes nouvelles sans reformuler la même idée.
- Utiliser des transitions discrètes et informatives. Ne pas ajouter de phrase finale uniquement pour « faire une conclusion ».
- Préserver la densité du lore : **simple ne signifie pas superficiel**. Détailler les rencontres, combats, expéditions, découvertes, décisions politiques et conséquences lorsqu'ils sont documentés.
- **Noms de la version française officielle du jeu** : Ordre de Favonius, Lac Tombétoile, Cap de la Promesse, Ventlevé, Brutocollinus, Œil divin, Anémo… Quand la version française garde le nom anglais (Stormterror), garde-le. Si tu ne trouves pas le nom français, garde le nom anglais et signale-le dans tes points à vérifier : n'invente pas de traduction.
- Le protagoniste est « le Voyageur » ; son jumeau, « le jumeau du Voyageur » (le joueur choisit Aether ou Lumine).
- **Utiliser les choix terminologiques validés au fil de l'échange pour l'article en cours.** Exemple : écrire « Nivéoles » plutôt que « Fées » dans les textes concernés par cette préférence. Ne pas généraliser ce remplacement à toutes les créatures de Teyvat.
- Guillemets français « … » ; une même forme d'apostrophe dans tout le fichier.
- Pas de remplissage (« Dans cet article, nous allons voir… »), pas de conclusion qui répète le résumé : le dernier paragraphe ouvre sur la suite de l'histoire.
- Reste fidèle à la source : pas d'événement, de motivation ou de date inventés. Une théorie se présente comme telle et se crédite.

### Révisions et travail en plusieurs passes

- **Lors d'une réécriture ciblée**, conserver les informations attestées, la chronologie et les termes déjà validés ; améliorer prioritairement la précision, la fluidité et les répétitions. Fournir le passage entièrement réécrit, directement réutilisable.
- **Lors d'une révision complète**, vérifier que les personnages et lieux sont présentés avant d'être réutilisés et que l'article ne raconte pas la fin d'une quête avant des événements antérieurs, sauf nécessité narrative signalée.
- Si deux sections sont très liées, proposer leur fusion ; si une section devient trop dense, la diviser avec des sous-titres informatifs.
- Distinguer dans l'histoire d'un personnage **sa vie, sa mort et les événements postérieurs liés à son héritage**. Par exemple, raconter la mort d'un souverain avant une quête située cinq siècles plus tard.
- **Conserver le niveau de détail souhaité par l'utilisateur**. S'il demande une biographie plus complète, développer les épisodes décrits par les livres plutôt que résumer les livres eux-mêmes.
- Si l'utilisateur demande seulement un passage, ne pas imposer une réécriture globale. Ne poser une question que si une information essentielle manque réellement.
- Pour un texte révisé substantiel, livrer un fichier `.md` complet quand c'est utile, en plus d'un court récapitulatif des changements ; vérifier l'existence réelle du fichier avant de fournir un lien.

## 9. Exemple complet (abrégé)

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

## 10. Vérifications avant de rendre

- [ ] Nom de fichier en minuscules avec tirets, absent de la liste des noms interdits.
- [ ] `titre`, `description`, `image`, `publieLe`, `tags` présents ; `brouillon: true`.
- [ ] Description propre à cet article (pas celle d'un autre épisode de la série).
- [ ] Tous les tags existent dans le registre ; le premier thème est le bon.
- [ ] L'image existe.
- [ ] Pour un épisode de quête : `quete` rempli (série présente dans `tags`, chapitre et acte justes, place libre dans la série).
- [ ] `spoilers`, `resume` et `sources` décrivent bien **cet** article (attention aux copier-coller d'un article voisin).
- [ ] Un crédit par source adaptée ou utilisée ; `modifications` rempli pour le wiki ; adresses en `https://`.
- [ ] Sections en `##`, pas de `#`, pas de HTML ; images du corps fournies, citées par leur nom, avec une description.
- [ ] Noms français officiels ; noms incertains listés dans les points à vérifier.

- [ ] La chronologie est cohérente ; les événements postérieurs à la mort d'un personnage apparaissent après elle, sauf choix explicite expliqué.
- [ ] Les épisodes importants des livres et quêtes sont racontés, pas seulement annoncés ou résumés de manière vague.
- [ ] Les légendes, faits confirmés et hypothèses sont distingués.
- [ ] Les phrases restent simples et informatives : pas de dramatisation, de répétitions ni de conclusions artificielles.
- [ ] Les appellations et préférences éditoriales validées dans la conversation ont été respectées.
- [ ] Aucun accès aux sources ou contrôle du dépôt n'est affirmé sans avoir effectivement eu lieu.
