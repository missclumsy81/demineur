# ADR-0002 — Architecture applicative

- **Statut** : Accepté
- **Date** : 28/10/2026
- **Décideur** : Solveig Deral
- Précisé le 01/11/2026 (règles vérifiées, outillage : ADR-0003)

## Contexte

La logique du jeu doit être séparée de l'interface Vue (ADR-0001), pour :

- la tester simplement ;
- la garder portable (PWA) ;
- éviter que l'état et les règles se dispersent dans les composants.

## Options envisagées (style du moteur)

### A. Fonctions pures et état immuable

Chaque action renvoie un nouvel état.

- ➕ Tests triviaux : entrée → sortie, sans préparation ni effet de bord.
- ➕ Historique des états gratuit (annulation, rejeu).
- ➕ S'accorde avec la réactivité Vue : on remplace la valeur d'un `ref`.
- ➖ Copie de l'état à chaque action.
- ➖ Discipline d'immuabilité à tenir (aidée par le typage `Readonly`).

### B. Objet Partie mutable

Une classe avec un état interne.

- ➕ Modèle familier, encapsulation classique.
- ➖ Mutations internes invisibles pour la réactivité Vue (proxy, `markRaw` ou rafraîchissement forcé).
- ➖ Tests plus dépendants de l'ordre des appels ; annulation à coder explicitement.

## Décision

- **Trois couches** :
  - `src/engine` : moteur pur ;
  - `src/composables` : pont réactif ;
  - `src/components` : composants `.vue`, affichage et événements.
- **Sens des dépendances** : components → composables → engine.
- **Le moteur ne dépend de rien** : ni Vue, ni DOM, ni globals du navigateur
  (`window`, `document`, `localStorage`).
- **Les composants n'appellent pas le moteur directement** ; ils peuvent en importer
  uniquement des types (`import type`).
- **Style du moteur** : option A, avec types `Readonly`.
- **Aléatoire injecté** via un générateur à graine, pour des tests reproductibles.
- **Garantie outillée** : règles ESLint (voir section « Vérification »), mises en place au lot 0.

## Vérification

Règles vérifiées, par dossier :

- `src/engine` : imports de Vue et des autres couches interdits ; globals du navigateur
  interdits (`window`, `document`, `localStorage`) ;
- `src/composables` : imports de `src/components` interdits ;
- `src/components` : imports de `src/engine` limités aux types (`import type`) ;
- `src/App.vue` : même règle que `src/components` ;
- `src/main.ts` : point d'assemblage, hors périmètre des règles.

Critère, résultat attendu de `npm run lint` :

- import de `vue` dans `src/engine` : échec ;
- import de valeur du moteur dans un composant : échec ;
- import de type du moteur dans un composant : succès.

## Conséquences

- Moteur testable en unitaire pur, sans Vue ni DOM.
- Intégration naturelle avec la réactivité Vue (remplacement de la valeur d'un `ref`).
- Annulation et rejeu de partie facilités.
- Copie de l'état à chaque coup : négligeable pour un démineur ; point de vigilance
  si l'état devenait volumineux ou très fréquemment modifié.
- L'état passant par les composables, l'ajout éventuel de Pinia reste local.
