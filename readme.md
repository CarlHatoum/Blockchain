# Distributed Build Your Block

## Objectif

Les buts de cette étape sont :

* Transformer notre base de données client / serveur en une base distribuées.
* Comprendre les problèmes liés aux systèmes distribués.

## Confiance et défaillance

Dans l'approche par client / serveur, vous devez avoir confiance dans le serveur :

* Il ne va pas altérer les données : les perdre ou les corrompre.
* Il va être disponible pour vous répondre : accepter de vous répondre, être actif et ne pas subir une panne.

Vous devez avoir confiance dans le faite que l'individu ou l'entité qui opère le serveur respecte ces critères. Mais face à des enjeux économiques ou politiques importants, il se peut qu'on ne puisse pas faire confiance à une seule entité.

Pour résister aux pannes ou à une forte demande vous pouvez aussi avoir envie de mettre plusieurs serveurs, chacun pouvant absorber une partie de la charge.

La solution utilisée par la blockchain est la distribution. Il n'y a pas de serveur central, tout le monde peut se rajouter au réseau et assurer le rôle de serveur. C'est une base de données distribuées. Distribuer revient à avoir plusieurs serveurs qui se synchronisent entre eux.

#### Essayer de lancer plusieurs fois le serveur. Que ce passe-t'il ? Pourquoi ?

## Configuration

Mettre plusieurs serveurs sur une même machine n'est pas une idée de génie. En production, l'utilité est assez limité mais en test ou en développement, c'est fort utile à moins de disposer de plusieurs machines.

Il faut pouvoir lancer le serveur plusieurs fois avec des configurations différentes. Essayez de lancer les commandes suivantes : `node configuration.js configuration1.json`, `node configuration.js configuration2.json` et `node configuration.js`.

#### En vous inspirant de `configuration.js` modifiez `db.js` et `db-client.js` pour qu'ils prennent un fichier de configuration et que le fichier détermine le port utilité.

Vous êtes maintenant en mesure de lancer deux serveurs en parallèle mais ils ne se voient pas et ne se synchronisent pas.

## Appariement et synchronisation

Il faut maintenant faire en sorte que nos serveurs se voient et se parlent. Pour cela, il faut savoir comment les contacter.

#### Ajoutez dans les fichiers de configuration une liste des autres pairs avec le port de connexion.

#### Au lancement du serveur, connectez-vous aux autres pairs.

```Javascript
// Pour produire un nouveau tableau à partir d'un tableau
const monTableauInitial = ['a', 'b', 'c'];
const nouveauTableau = monTableauInitial.map((element, index) => {
    // mon traitement
    // ...
    return index * index;
});
console.log(nouveauTableau); // [0, 1, 4]
```

#### Modifiez la méthode `set` pour qu'elle mette à jour les autres pairs.

Vous avez réussi ? Réfléchissez maintenant à tous les problèmes qui peuvent arriver. Est-ce que cette solution est viable ? Comment ajouter un pair ? Que ce passe-t'il si un pair plante ? Si deux pairs reçoivent en même temps deux valeurs différentes pour la même clé ?

Nous verrons comment résoudre ces difficultés plus tard.

## CLI

Pour continuer, on va avoir besoin de faire des tests et d'envoyer des commandes `set` et `get`. En utilisant ce que vous venez d'apprendre, copiez et transformez le client en Command Line Interface (CLI) de la forme :

    node cli.js <configFile> <command> <paramètres>...

Par exemple, pour mettre une valeur :

    node cli.js configuration1.json set MonChamp 42

Et pour la récupérer :

    node cli.js configuration1.json get MonChamp

## Jouer à trois ou plus

Dans bitcoin et dans un système distribué plus généralement, on peut ajouter un noeud à tout moment.

#### Ecrivez un troisième fichier de configuration et lancer le serveur sans modifier les deux autres. Que se passe-t'il ?

#### Modifier le serveur pour qu'au lancement, il fasse une requête `keys` à un des autres serveur et récupère toutes les valeurs qu'il n'a pas.

#### Que se passe-t'il maintenant si vous ajoutez un champs au serveur 1 ? Quel est la réponse des serveur 2 et 3 à votre `get` ?

Quand un nouveau serveur s'ajoute au système, il doit recevoir les mises à jour. Plusieurs solutions :

* Le serveur demande régulièrement la liste de `keys` mais ça peut rapidement devenir long et le taux de rafraichissement est dépendent de la fréquence des demandes.
* Soit il demande à être informer des mises à jours, par exemple avec une commande `addListener` et l'adresse de contact.
* Soit les serveurs informent tout leurs contacts dès qu'il y a un événement, on fait ce qu'on appel un *broadcast*.

J'aime bien la dernière, elle est simple.

#### Éditez la commande `set` pour qu'en plus de ce qu'elle fait déjà, elle broadcast l'événement à toutes les entités connectées ou plus simplement, modifier `io.on("connect")` pour qu'il ajoute les sockets dans la liste des sockets à mettre à jour.

#### Est-ce qu'il se passe quelque-chose de bizarre dans vos tests ?

Selon l'implémentation, il peut se former :

* soit une boucle infinie où le message `set` est propagé indéfiniment entre les machines.
* soit une machine est informé plusieurs fois de `set` et affiche une erreur.

#### Faites quelques tests, observez le comportement et vérifiez que cela fonctionne, quelque-soit le serveur qui reçoit les `set` et les `get`.

Le cas de la boucle infini est très gênant, il peut rapidement conduire à une saturation du réseau et du CPU de la machine. Le second cas est plus compliqué à régler. On peut tester que la valeur est la même mais que faire si elle est diffèrente ? Dans ce cas, pour que tous les noeuds est la même valeur, il faut mettre en place un algorithme de consensus.

## Conclusion

Nous avons un système qui marche plus ou moins, dans lequel n'importe quel noeud peut se connecter et reconstruire la base de données. C'est un système distribué minimaliste mais il ne fonctionne que dans un monde idéal où il n'y a pas de pannes ni de personnes mal intentionnées.

## Suite

Aller à l'étape 3 : `git checkout etape-3`.

Pour continuer à lire le sujet :

* soit vous lisez le fichier `README.md` sur votre machine.
* soit sur GitHub, au-dessus de la liste des fichiers, vous pouvez cliquer sur `Branch: master` et sélectionner `etape-3`.

## Pour aller plus loin

Pour continuer cette étape, vous pouvez identifier les serveurs par leur ip/port et discuter avec vos camarades pour étendre le système entre plusieurs machines.

Vous pouvez mettre en place des backups sur disque de la base de données.

Implémenter une commande `addPeer` qui permet via le CLI d'ajouter l'identifiant d'un serveur à un autre.

Implémentez une commande `getPeers` qui permet d'avoir la liste des pairs d'un serveur et pouvoir se connecter à eux.
# Distributed Build Your Block

## Objectif

Le but de cette étape est de mettre en place un algorithme de consensus pour notre base de données.

## Consensus

À l'étape précédente, nous avons mis en place un système distribué minimal mais qui fonctionne plus ou moins bien car il n'a pas d'algorithme de consensus. Un algorithme de consensus est un algorithme qui va permettre aux noeuds de se mettre d'accord sur une valeur. Par exemple, si deux valeurs différentes sont proposées pour une même clé, l'algorithme doit permettre d'en choisir une.

Ces désaccords peuvent être dû à :

* des contraintes du monde physique comme la vitesse de la lumière. L'information ne peut pas se téléporter d'un serveur à l'autre, il y a un délai : la latence.
* Il peut y avoir des dysfonctionnements : pannes de matériel ou corruptions de données.
* Il y a des humains qui interagissent avec le système et l'infrastructure, ils peuvent être mal informés, incompétents ou malveillants.

Il n'y a pas de d'algorithme de consensus ultime. Pour pouvoir mettre en place un algorithme de consensus, il faut mettre en place des contraintes qui auront un coup en temps ou en ressources.

## Outch ! Ça lag...

La latence est partout dès qu'il y a communication. L'information ne peut pas aller plus vite que la lumière, sans compter les temps de traitement. Par exemple, à l'heure où j'écris ces lignes, pour l'échange d'un message de ping, il y a 229 millisecondes de latence entre Paris et Tokyo : https://wondernetwork.com/pings. Imaginez maintenant un système distribué de plusieurs milliers de noeuds, le temps que l'information se propage d'un bout à l'autre, il peut se passer plusieurs secondes. Et beaucoup plus si vous voulez transporter une grande qualité d'informations.

Maintenant, à quelques millisecondes d'écart, deux noeuds du réseau reçoivent pour la clé `Ville` une valeur différentes :

* Noeud 1 : Ville / Paris
* Noeud 2 : Ville / Tokyo

L'information se propage de proche en proche jusqu'à confrontation. Un partie des noeuds à associé Paris et l'autre Tokyo.

#### Imaginez des solutions possibles. Notez-les, on pourra s'en servir plus tard.

## Combattre le temps par le temps

Dans l'idée initiale, on ne peut pas mettre à jour une valeur. Partant de cette idée, il semble cohérent que la valeur la plus vieille soit la bonne. Je vous propose donc l'algorithme de consensus suivant : on garde la valeur la plus vieille.

On n'a pas l'âge d'une valeur pour le moment. Il va falloir la rajouter dans les données stockées mais aussi dans les données échangées pour pouvoir comparer. On ne stocke plus une simple valeur mais un ensemble de valeurs.

```Javascript
db[field] = {
  value: value,
  timestamp: new Date()
};
```

#### Modifiez le serveur pour qu'il stocke pour chaque clé la valeur et l'horodatage de celle-ci.

#### Modifiez le serveur et le CLI pour qu'ils échangent ces informations.

Pour tester, vous pouvez ajouter artificiellement de la latence et associer deux valeurs différentes à deux serveurs. Pour ajouter de la latence, mettez le code de mise à jour des serveurs dans la fonction suivante :

```Javascript
setTimeout(() => {
  // Le code ici sera exécuté après 10 secondes.
}, 10000);
```

Si votre implémentation est correcte, cette solution fonctionne ; tant qu'il n'y a pas de panne ou d'utilisateurs malveillants.

Si un noeud a un problème réseau et que des messages sont perdus, il ne sera jamais mis à jours, même s'il utilise la commande `keys`, celle-ci ne retourne pas l'horodatage de la valeur. S'il a une valeur, il la gardera.

#### Qu'est-ce qui empêche un individu mal intentionné de forger une message `set` avec un *vieux* horodatage ou si l'horloge de la machine est mal réglée ? Que va t'il se passer ?

Cet algorithme fonctionne dans un monde parfait, sans panne et personnes mal attentionnées. Essayons de faire plus résistant.

## Résistance aux pannes

Le problème d'une panne réseau est que le noeud ne reçoit pas la mise à jour de la valeur. Une solution est de vérifier régulièrement que l'on a bien la même chose que ses voisins.

Actuellement, la commande `keys` ne retourne que la liste des clés mais pas l'horodatage. Avec celle-ci, on ne peut pas savoir si une clé à changée. Le code suivant permet d'extraire uniquement le champs *timestamp* de chaque clé de la base de données.

```Javascript
const extractHorodatage = function(db) {
  return Object.keys(db).reduce(function(result, key) {
    result[key] = {
      timestamp: db[key].timestamp
    };
    return result;
  }, {});
};
```

#### Écrivez une commande `KeysAndTime` qui retourne la liste des clés avec l'horodatage.

Il ne reste plus qu'à appeler régulièrement la commande la commande `KeysAndTime` de ces voisins pour détecter une désynchronisation et la corriger. Quand vous corrigez la valeur, informez vos voisins.

```Javascript
setInterval(() => {
  // Le code ici sera exécuté toutes les 10 secondes.

}, 10000); // 10000 millisecondes = 10 secondes
```

#### Mettez en place la mécanique de détection et de correction.

## C'est toujours un problème de temps

Dans la vie, je suis plutôt optimiste mais en informatique si ça peut mal se passer, ça se passera mal. Et puis, j'ai besoin de ce ressort scénaristique de fou pour vous amener là où je veux : La solution précédente fonctionne ? Vous êtes sûr ?

#### Que ce passe-t'il si pour un même timestamp, il y a deux valeurs différentes ?

Mais on n'a pas envie d'envoyer la valeur à chaque synchronisation. Imaginez si c'est un fichier de plusieurs centaines de Mo ! À la place, on va utiliser l'empreinte de la valeur qui est produite par une fonction de hachage.

## Prenons un peu de *hash*

Une fonction de hachage est une fonction qui prend en entrée un ensemble de données et retourne une empreinte, aussi appelée *hash*. L'empreinte respecte deux principes : Elle est unique pour un ensemble de données d'entrée, et une empreinte donnée ne permet pas de remonter à l'ensemble initial. On parle de non-collision et de non calculabilité de la pré-image. Cette empreinte est de taille fixe quelque-soit l'entrée. Une fonction couramment utilisé est SHA. Voici quelques exemples d'empreinte :

```Bash
> echo "Blockchain" | shasum
# efcf8baf5959ad1ebc7f4950425ef1c2eae9cbd9  -

> echo "Block" | shasum
# d1a6b1157e37bdaad78bec4c3240f0d6c576ad21  -

> echo "Vous commencez à voir le principe ?" | shasum
# 25abec7ced7642b886c1bffbc710cc3439f23ab7  -
```

Une propriété intéressante est qu'une petite modification dans l'entrée change totalement l'empreinte :

```Bash
> echo "Blockchain" | shasum
# efcf8baf5959ad1ebc7f4950425ef1c2eae9cbd9  -

> echo "blockchain" | shasum
# ea5f179324c233b002fa8ac4201fa216001515e5  -
```

Les fonctions de hachage sont couramment utilisées pour vérifier que des données n'ont pas été corrompu lors d'un téléchargement par exemple. Le code suivant permet de produire une empreinte en Javascrip.

```Javascript
const crypto = require('crypto');

// Retourne l'empreinte de data.
const getHash = function getHash(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}
```

## Spoiler : cette fois, c'est la bonne ... avant l'étape suivante.

#### Ajoutez un champs `hash` dans votre base de données.

#### Modifiez `set` pour calculer l'empreinte de la valeur.

#### Éditez la commande `KeysAndTime` pour ajouter le hash.

#### Modifiez votre algorithme de synchronisation pour vérifier le hash.

Vous êtes maintenant résistant à la panne. Enfin, pas à l'instant T mais c'est déjà pas mal !

## Conclusion

Nous avons mis en place un algorithme de consensus qui résiste aux problèmes de latence et de pannes réseaux. Pour résister, nous avons ajouter des données et mis en place des échanges d'informations supplémentaires, ce qui représente un coût.

Nous n'avons pas traité le troisième cas de désaccords dù à un utilisateur potentiellement malveillants. Nous traiteront se problème à l'étape suivante.

## Suite

Aller à l'étape 4 : `git checkout etape-4`.

Pour continuer à lire le sujet :

* soit vous lisez le fichier `README.md` sur votre machine.
* soit sur GitHub, au-dessus de la liste des fichiers, vous pouvez cliquer sur `Branch: master` et sélectionner `etape-4`.
# Distributed Build Your Block

## Objectif

Les buts de cette étape sont :

* Mettre en place un algorithme de consensus résistant aux utilisateurs malveillants.
* Introduire les notions de la *blockchain*.

## L'utilisateurs malveillants

Il existe dans la bibliographie de nombreux algorithmes de consensus résistants aux [noeuds byzantins](https://fr.wikipedia.org/wiki/Mod%C3%A8le_Byzantine_Altruistic_Rational), c.-à-d., pour faire simple, aux noeuds malveillants. Malheureusement, une grande partie d'entre eux nécessitent soit d'avoir un tiers de confiance soit de connaitre le nombre de participants. Hors, nous voulons un système où toute personne peut se joindre et sans tiers de confiance.

À l'étape précédente, nous avons vu un algorithme de consensus minimaliste permettant de résister à la latence et aux pannes réseaux mais pas à un utilisateur malveillant. Il suffit à un utilisateur malveillant de forger un message avec un horodatage *ad hoc* pour remplacer la valeur de son choix. Cette attaque est possible car l'horloge de chaque machine est indépendante de celle des autres. On ne peut pas garantir qu'un message a été forgé après un date donnée.

Une solution serait d'avoir une horloge partagée entre tous les participants. Une manière de faire cela, c'est d'enchainer les enregistrements : un enregistrement indique son prédécesseur. Le consensus revient à garder la chaine la plus longue. Cela simplifie aussi la détection de désynchronisation : il suffit de demander le dernier enregistrement d'un autre noeud. Nous voulons quelque-chose qui ressemble à ça :

     Enregistrement 0            Enregistrement 1     Enregistrement 2
    +-----------------------+   +----------------+   +----------------+
    |                       |   |                |   |                |
    | key: Enseignant       +<--+ key: Cours     +<--+ key: Etape     |
    | value: Damien Reimert |   | value: SYD     |   | value: 4       |
    |                       |   |                |   |                |
    +-----------------------+   +----------------+   +----------------+

L'illustration précédente soulève beaucoup de questions chez moi :

* Comment indiquer le prédécesseur ?

Il suffit de stocker l'identifiant du prédécesseur dans l'enregistrement comme on a stocké le timestamp.

* Comment identifier un enregistrement ?

On pourrait utiliser sa position dans la chaine d'enregistrement mais cette solution à un problème : elle ne permet pas de détecter une modification d'un enregistrement précédent.

* Hein ?

Si j'utilise uniquement la position ou l'index dans la chaine, je n'ai aucune information sur ce qui me précède. Je pourrais remplacer ce qu'il y a avant par n'importe quoi tant qu'il y a le bon nombre d'enregistrements. Pas très pratique pour mettre en place une horloge.

* Je peux stocker l'enregistrement dans ce cas ? J'aurai toute les informations !

Oui mais la taille des messages échangés va rapidement exploser : chaque message va contenir toute la base de donnée.

* À l'étape précédente, on a utilisé l'empreinte de la valeur pour vérifier qu'on avait la même valeur mais sans échanger cette valeur. On ne peut pas utiliser cette technique ?

Bonne idée !

* Simple alors, on calcule déjà l'empreinte de la valeur dans notre code, il faut juste ajouter un champ `previous` ?

Pas tout à fait. Si on se contente de l'empreinte de la valeur, qu'est-ce qui nous empêche de changer la clé ?

* Je mets la clé et la valeur dans la fonction de hachage ?

Non plus. Sinon, je peux modifier à ma guise le prédécesseur du block précédent.

* Ok, je vois. Dans la fonction de hachage, je mets tout ce que je veux non modifiable ?

Oui ! La seule chose dans un enregistrement que tu ne peux pas mettre dans la fonction de hachage, c'est l'empreinte elle-même, sinon tu as un problème d'oeuf et de poule.

Ha ! Et ajoute l'index de l'enregistrement dans la chaine. On pourrait le calculer mais ça permettra de simplifier des petites choses et ça nous coûte presque rien. Tu devrais avoir quelque-chose qui ressemble à ça maintenant :

     Enregistrement 0             Enregistrement 1        Enregistrement 2
    +-----------------------+    +-------------------+    +-------------------+
    |                       |    |                   |    |                   |
    | index: 0              |    | index: 1          |    | index: 2          |
    | id: <hash0>           +<-+ | id: <hash1>       +<-+ | id: <hash2>       |
    | previous: null        |  +-+ previous: <hash0> |  +-+ previous: <hash1> |
    | key: Enseignant       |    | key: Cours        |    | key: Etape        |
    | value: Damien Reimert |    | value: SYD        |    | value: 4          |
    |                       |    |                   |    |                   |
    +-----------------------+    +-------------------+    +-------------------+

* Ya des trucs bizarre sur l'enregistrement 0, son prédécesseur vaut `null`. C'est normal ?

Réfléchis...

* Le problème de l'oeuf et de la poule ? Il faut bien commencer quelque-part ?

Oui. Le premier enregistrement s'appelle le *genesis*, l'enregistrement avant lequel il n'y avait rien. C'est un axiome de votre système. Et en tant qu'axiome, il vaut mieux qu'il soit partagé par tous.

* Partagé par tous ? Je ne vois pas pourquoi ?

Je dirais bien, regarde l'histoire humaine mais ça ne va peut-être pas aider...

On pourrait laisser n'importe qui choisir le *genesis* de la chaine mais tout le monde va le faire et il va s'en suivre une longue période avant qu'il y ai convergence.

* Attend ! Il faut que je fasse un choix que j'impose aux autres ? Ça ressemble à un tiers de confiance ça...

Effectivement. Le code source que tu exécutes est un tiers de confiance si tu ne l'as pas vérifier. Le serveur sur lequel tu as téléchargé ce code est aussi un tiers de confiance. Mais la machine sur laquelle tu exécutes le code est aussi un tiers de confiance et je ne pense pas que tu l'as fabriqué toi-même.

Bon, oublie ça, il faut coder maintenant.

## Enchainez-les tous !

Résumons, il faut coder :

* une structure qui ressemble à ça :

       Enregistrement 0             Enregistrement 1        Enregistrement 2
      +-----------------------+    +-------------------+    +-------------------+
      |                       |    |                   |    |                   |
      | index: 0              |    | index: 1          |    | index: 2          |
      | id: <hash0>           +<-+ | id: <hash1>       +<-+ | id: <hash2>       |
      | previous: null        |  +-+ previous: <hash0> |  +-+ previous: <hash1> |
      | key: Enseignant       |    | key: Cours        |    | key: Etape        |
      | value: Damien Reimert |    | value: SYD        |    | value: 4          |
      |                       |    |                   |    |                   |
      +-----------------------+    +-------------------+    +-------------------+

* l'identifiant d'un enregistrement est le hachage de l'ensemble des éléments d'un enregistrement.
* l'algorithme de consensus est la chaîne la plus longue.
* pour détecter une désynchronisation, il suffit de demander le dernier enregistrement.

#### Implémentez la structure de données décrite.

#### Implémentez une commande `last` qui retourne le dernier enregistrement.

#### Implémentez une commande `record` qui retourne l'enregistrement à l'index fourni.

#### Mettez à jour l'algorithme de resynchronisation.

Normalement, si tout fonctionne, votre système est résistant aux utilisateurs mal informés ou incompétents mais pas aux utilisateurs malveillants.

Vous ne pensiez pas que serait aussi facile quand même ? Point positif, il ne reste presque rien à faire.

## Tout est une question de coûts

Imaginez une chaine d'une dizaine d'enregistrement. Un individu malveillant n'a qu'à partir du *genesis* et fabriquer une vingtaine d'enregistrements. Sa chaine étant plus longue que l'autre, elle remplacera la chaine existante. Pour éviter ça, il faudrait le ralentir mais sans empêcher les utilisateurs légitimes d'ajouter des éléments à la chaine d'enregistrements. Il faudrait mettre un coût à l'ajout d'enregistrement. Il existe une solution connu et largement utilisée : la preuve de travail.

## Preuve de travail

La preuve de travail n'est pas un algorithme de consensus. C'est la preuve d'un travail réalisé. Elle est couteuse à produire mais facile à vérifier, c.-à-d., que l'utilisateur va devoir dépenser des ressources en temps et en énergie pour la produire mais il va être beaucoup plus simple de la vérifier. Elle est utilisée dans de nombreuses conditions. Par exemple, dans l'envoie de mail pour limiter les spams en augmentant le coût d'envoie d'un mail.

La preuve de travail utilise les propriétés des fonctions de hachage. Il est impossible de prédire l'empreinte de quelque-chose sans faire le calcule. On fixe une condition sur cette empreinte, par exemple, qu'elle commence par un zero. La preuve va consister à trouver un *nombre magique* qui permet à l'empreinte de respecter la condition. Un des avantages est qu'il n'y a pas besoin de communiquer à l'avance avec l'interlocuteur pour lui fournir la preuve.

### Le nombre magique

L'empreinte est notre enregistrement est toujours la même sauf si notre enregistrement change. Malheureusement, pour un enregistrement donné, l'empreinte ne commence pas par zéro mais je ne peux pas modifier les champs de mon enregistrement sinon, il serait soit invalide si je modifie l'index ou le prédécesseur soit non conforme à ce que je veux faire si je modifie la clé ou la valeur.

C'est ici qu'intervient le *nombre magique*. On a vu qu'une petite modification entraine un changement important de l'empreinte. On va donc rajouter un nombre à la valeur sur laquelle on veut mettre notre preuve.

Prenons un exemple simple, je veux trouver une empreinte qui commence par zéro pour le couple `Enseignant / Damien Reimert` et j'ajoute un nombre :

```Bash
> echo "Enseignant / Damien Reimert / 0" | shasum
# cf3ee12420c29fbf13aff6d3397561735284366d  -
```

Il n'y a pas de zéro au début mais nous allons pouvoir incrémenter ce nombre.

#### Incrémenter le nombre jusqu'à obtenir une empreinte commençant par zero.

Vous venez de faire une preuve de travail et le nombre trouvé est le *nombre magique*.

## Prendre du temps pour s'insérer

Dans notre cas, imposons que l'identifiant d'un enregistrement commence par 3 zéros.

#### Ajouter un champ `nonce` dans la structure des enregistrements

#### Modifiez la commande `set` pour qu'elle vérifie que l'identifiant commence par 3 zéros

#### Modifiez le CLI pour qu'il incrémente le champ `nonce` jusqu'à respecter la contrainte quand l'utilisateur veut `set` une nouvelle clé.

Maintenant, chaque *enregistrement* demande du temps pour être produit.Tant que les utilisateurs légitimes insèrent des données, il va être difficiles à un attaquant de tenir le rythme pour produire une chaine plus longue.

## Conclusion

Vous venez de coder une blockchain. Un enregistrement est appelé *block*. L'ensemble des *blocks* forme la *blockchain*.

## Suite

Aller à l'étape 5 : `git checkout etape-5`.

Pour continuer à lire le sujet :

* soit vous lisez le fichier `README.md` sur votre machine.
* soit sur GitHub, au-dessus de la liste des fichiers, vous pouvez cliquer sur `Branch: master` et sélectionner `etape-5`.
