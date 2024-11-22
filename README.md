# Projet Graphes : Algorithmes et Visualisation du Métro

## Fonctionnalités

### 3.1 Vérification de la connexité du graphe
- Implémenter un algorithme pour vérifier si le graphe est **connexe**.
  - **Justification** : Expliquez pourquoi le graphe est ou n'est pas connexe.
- Si le graphe n'est **pas connexe**, l'algorithme doit ajouter les **arêtes manquantes** pour le rendre connexe.

---

### 3.2 Algorithme de Dijkstra
- Implémenter l'algorithme de **Dijkstra** pour trouver le plus court chemin (PCC).
- Interaction avec l'utilisateur :
  - L'utilisateur saisit une **station de départ** et une **station d'arrivée**.
  - Retour attendu (exemple) :
    ```
    L'itinéraire du PCC calculé est :
    - Vous êtes à Carrefour Pleyel.
    - Prenez la ligne 13 direction Châtillon-Montrouge.
    - À Champs Élysées, Clémenceau, changez et prenez la ligne 1 direction Château de Vincennes.
    - À Palais Royal, Musée du Louvre, changez et prenez la ligne 7 direction Villejuif, Louis Aragon.
    - Vous devriez arriver à Villejuif, P. Vaillant Couturier dans environ 29 minutes.
    ```

---

### 3.3 Algorithme de Kruskal (Arbre couvrant de poids minimum - ACPM)
- Implémenter l'algorithme de **Kruskal** pour calculer un arbre couvrant de poids minimum (ACPM).
- L'affichage de l'arbre est optionnel.

---

## Bonus

### PCC (Plus Court Chemin)
- **Affichage graphique** :
  - Une **carte du métro parisien** est affichée à l'écran (ou une partie de celle-ci).
  - L'utilisateur peut **cliquer sur une station de départ et une station d'arrivée**.
  - Le **plus court chemin** s'affiche directement sur le plan, avec :
    - La durée estimée du trajet.
    - L'itinéraire détaillé.

### ACPM (Arbre couvrant de poids minimum)
- **Affichage graphique** :
  - L'utilisateur peut :
    - Cliquer sur une **zone** de la carte ou un **bouton**.
    - L'ACPM est alors dessiné directement sur le plan du métro.

---

## Attention !

- **Rapport** :
  - Expliquez comment lancer votre application.
  - Listez toutes les **dépendances** nécessaires (bibliothèques, frameworks, etc.) et expliquez comment les installer.

- **Bonus** :
  - Les bonus seront attribués uniquement si les fonctionnalités associées fonctionnent correctement.
  - Une interface graphique non fonctionnelle ou buguée ne recevra pas de points bonus.

---

## Ressources fournies

- **Carte du métro** : `metrof.png`
- **Coordonnées des stations** : `pospoints.txt`

Vous êtes libres d'imaginer d'autres types d'interfaces graphiques, comme un affichage dynamique de l'ACPM ou des animations.
