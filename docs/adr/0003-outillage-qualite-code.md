# ADR-0003 — Outillage qualité de code

- **Statut** : Accepté
- **Date** : 01/11/2026
- **Décideur** : Solveig Deral

## Contexte

Les règles de dépendances de l'ADR-0002 doivent être vérifiées automatiquement, pour seulement
trois couches. Le dépôt n'a encore ni linter ni formateur, et les deux outils ne doivent pas
se contredire sur le style.

## Options envisagées

### Installation

- Configuration de référence de create-vue : retenue, prévue pour Vue et TypeScript.
- Assistant `npm init @eslint/config` : écarté, configuration générique à compléter.
- Installation manuelle : écartée, assemblage à faire soi-même sans bénéfice ici.

### Vérification des dépendances

- Règles ESLint natives : retenues, aucune dépendance supplémentaire.
- eslint-plugin-boundaries : écarté, dépendance injustifiée pour trois couches.
- dependency-cruiser : écarté, dépendance injustifiée pour trois couches.

### Formatage

- Prettier : retenu, outil mature en configuration minimale.
- Oxfmt : écarté, encore expérimental.

## Décision

- **Installation** : configuration de référence générée par create-vue (options ESLint + Prettier),
  reprise dans le dépôt.
- **Vérification des dépendances** : `no-restricted-imports` de typescript-eslint avec
  `allowTypeImports` et `no-restricted-globals`, appliquées par dossier. Règles et critère :
  ADR-0002, section « Vérification ».
- **Formatage** : Prettier ; règles de style désactivées dans ESLint (`eslint-config-prettier`).

## Conséquences

- Les règles sont des listes d'interdictions : ce qui n'y figure pas (paquet tiers, autre global,
  nouveau dossier) n'est pas détecté.
- `npm run lint` ne contrôle pas le formatage, qui demande sa propre commande.
- À réévaluer si l'architecture dépasse trois couches : un outil dédié pourrait alors se justifier.
