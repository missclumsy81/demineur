# Spécifications fonctionnelles — Démineur

Version 1.0 — 27/10/2026 — Statut : à valider

Les règles de gestion (`RG-xx`) sont référencées dans le nom des tests qui les vérifient, ce qui donne la traçabilité exigence → test. Exemple : `it("RG-04 : le premier clic n'est jamais une mine", …)`.

---

## 1. Glossaire

| Terme           | Définition                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **Grille**      | Plateau rectangulaire de `lignes × colonnes` cases                                                    |
| **Case**        | Unité de la grille. Elle est _fermée_, _ouverte_ ou _marquée_ (drapeau).                              |
| **Voisines**    | Les 8 cases adjacentes à une case (moins sur les bords)                                               |
| **Indice**      | Nombre de mines parmi les voisines d'une case (0 à 8)                                                 |
| **Propagation** | Ouverture automatique des voisines d'une case d'indice 0                                              |
| **Chord**       | Ouverture rapide des voisines d'une case ouverte dont l'indice est égal au nombre de drapeaux voisins |
| **Graine**      | Valeur qui rend le placement des mines reproductible (pour les tests)                                 |

## 2. Règles de gestion

### Configuration

| ID    | Règle                                                                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| RG-01 | Trois niveaux prédéfinis : Débutant 9×9 avec 10 mines, Intermédiaire 16×16 avec 40 mines, Expert 16×30 avec 99 mines.                              |
| RG-02 | Le niveau par défaut est Débutant. Changer de niveau démarre une nouvelle partie.                                                                  |
| RG-03 | Le placement des mines dépend d'un générateur pseudo-aléatoire injectable. Avec la même graine et le même premier clic, on obtient la même grille. |

### Déroulement

| ID    | Règle                                                                                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RG-04 | Les mines sont placées **au premier clic**. Ni la case cliquée ni ses voisines ne contiennent de mine.                                                      |
| RG-05 | Ouvrir une case sans mine affiche son indice (rien si 0).                                                                                                   |
| RG-06 | Ouvrir une case d'indice 0 ouvre récursivement ses voisines (propagation). La propagation s'arrête sur les cases d'indice > 0 et ignore les cases marquées. |
| RG-07 | Une case marquée ne peut pas être ouverte. Il faut d'abord retirer le drapeau.                                                                              |
| RG-08 | Poser ou retirer un drapeau n'est possible que sur une case fermée.                                                                                         |
| RG-09 | Le compteur affiche `mines − drapeaux posés`. Il peut devenir négatif.                                                                                      |
| RG-10 | Le chronomètre démarre au premier clic d'ouverture, s'incrémente chaque seconde, s'arrête en fin de partie et plafonne à 999.                               |

### Fin de partie

| ID    | Règle                                                                                                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RG-11 | **Défaite** : ouvrir une case minée. La mine fatale est mise en évidence, toutes les mines sont révélées et les drapeaux posés à tort sont signalés.                       |
| RG-12 | **Victoire** : toutes les cases sans mine sont ouvertes. Les drapeaux n'entrent pas en compte. Les mines restantes sont automatiquement marquées et le compteur passe à 0. |
| RG-13 | Après la fin de partie, la grille ne réagit plus. Seule « Nouvelle partie » est possible.                                                                                  |

### Interactions

| ID    | Règle                                                                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| RG-14 | Souris : clic gauche pour ouvrir, clic droit pour poser ou retirer un drapeau (sans menu contextuel).                                          |
| RG-15 | Tactile : un appui court ouvre, un appui long (≥ 450 ms) pose un drapeau. Un bouton « Mode drapeau » inverse le comportement de l'appui court. |
| RG-16 | Clavier : les flèches déplacent le focus dans la grille, Entrée ou Espace ouvre, `F` pose un drapeau.                                          |

### Accessibilité

| ID    | Règle                                                                                                                |
| ----- | -------------------------------------------------------------------------------------------------------------------- |
| RG-17 | Chaque case expose un libellé accessible décrivant son état (« fermée », « drapeau », « 3 mines autour », « vide »). |
| RG-18 | Les messages de fin de partie sont annoncés aux lecteurs d'écran (zone `aria-live`).                                 |
| RG-19 | Aucune violation axe-core de niveau _serious_ ou _critical_.                                                         |
| RG-20 | L'interface respecte le thème clair ou sombre du système et `prefers-reduced-motion`.                                |

## 3. User stories (version 1.0)

Format : _En tant que… je veux… afin de…_, avec des critères d'acceptation en Gherkin. Ces scénarios servent de base aux tests Playwright.

### US-01 — Démarrer une partie

> En tant que joueur, je veux choisir un niveau et lancer une partie afin de jouer à la difficulté qui me convient.

```gherkin
Scénario: Partie par défaut
  Étant donné que j'ouvre l'application
  Alors je vois une grille de 9×9 cases fermées
  Et le compteur de mines affiche 10
  Et le chronomètre affiche 000

Scénario: Changer de niveau
  Étant donné une partie en cours
  Quand je choisis le niveau "Expert"
  Alors une nouvelle grille de 16×30 cases s'affiche
  Et le compteur de mines affiche 99
```

### US-02 — Ouvrir des cases

> En tant que joueur, je veux ouvrir une case afin de découvrir son contenu.

```gherkin
Scénario: Premier clic sûr (RG-04)
  Étant donné une nouvelle partie
  Quand j'ouvre n'importe quelle case
  Alors je n'ai pas perdu
  Et le chronomètre démarre

Scénario: Propagation (RG-06)
  Étant donné une grille générée avec la graine "test-propagation"
  Quand j'ouvre une case d'indice 0
  Alors toutes les cases de la zone vide et leur bordure numérotée sont ouvertes
```

### US-03 — Marquer une mine

> En tant que joueur, je veux poser un drapeau sur une case suspecte afin de ne pas l'ouvrir par erreur.

```gherkin
Scénario: Poser puis retirer un drapeau
  Étant donné une partie en cours
  Quand je fais un clic droit sur une case fermée
  Alors la case affiche un drapeau
  Et le compteur de mines diminue de 1
  Quand je fais à nouveau un clic droit sur cette case
  Alors le drapeau disparaît
  Et le compteur revient à sa valeur initiale
```

### US-04 — Gagner ou perdre

```gherkin
Scénario: Défaite (RG-11)
  Étant donné une grille générée avec une graine connue
  Quand j'ouvre une case minée
  Alors le message "Perdu" est annoncé
  Et toutes les mines sont visibles
  Et la grille ne réagit plus aux clics

Scénario: Victoire (RG-12)
  Étant donné une grille générée avec une graine connue
  Quand j'ouvre toutes les cases sans mine
  Alors le message "Gagné" et le temps sont annoncés
  Et le chronomètre s'arrête
```

### US-05 — Jouer au clavier et sur mobile

Critères : RG-15 et RG-16 vérifiés par des tests E2E en émulation mobile et au clavier.

## 4. Backlog d'évolutions (après la v1.0)

| ID    | Story                                                                      | Priorité |
| ----- | -------------------------------------------------------------------------- | -------- |
| US-10 | Meilleurs temps par niveau, conservés localement (top 5)                   | Haute    |
| US-11 | Chord : clic sur un chiffre satisfait pour ouvrir les voisines             | Haute    |
| US-12 | Partie personnalisée (lignes, colonnes, mines, avec validation des bornes) | Moyenne  |
| US-13 | Sons et animation d'explosion (désactivables)                              | Basse    |
| US-14 | Partager une grille via sa graine dans l'URL                               | Basse    |

## 5. Exigences non fonctionnelles

| ID     | Exigence                                                                                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| ENF-01 | Fonctionne sur les deux dernières versions de Chrome, Firefox et Safari, ainsi qu'en émulation mobile.                        |
| ENF-02 | Pas de défilement horizontal de la page dès 360 px de large. Une grille trop large (Expert) défile dans son propre conteneur. |
| ENF-03 | Taille du bundle de production < 50 Ko (gzip), sans dépendance à l'exécution.                                                 |
| ENF-04 | Une grille Expert se génère en moins de 50 ms sur le poste de référence.                                                      |
| ENF-05 | Aucun appel réseau à l'exécution (application 100 % statique).                                                                |
