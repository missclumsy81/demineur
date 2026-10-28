# CLAUDE.md — Projet Démineur

## Contexte
TP d'expérimentation : un démineur web développé selon les standards d'un projet
industriel (documentation, tests multi-niveaux, Git, CI/CD, déploiement).
Le pilote est directeur de projet, ancien architecte logiciel : explique tes choix
comme à un pair technique.

## Contraintes
- Zéro coût : aucun service, aucun outil ni aucune bibliothèque payante. En cas de doute, demander.
- Poste modeste (MacBook 2011, Ubuntu 24.04, 8 Go) : éviter les outils lourds (Docker…).
- Réponses concises ; détailler seulement si je le demande

## État du projet
- Dépôt initialisé et publié sur GitHub (public). Aucun code pour l'instant.
- Stack choisie (ADR-0001), rien d'installé avant le lot 0.

## Stack
- Vue 3 en Composition API (`<script setup lang="ts">`), TypeScript strict, Vite.
- Sans Pinia (état porté par des composables) ni routeur (une seule page).
- Détail et justification : docs/adr/0001-langage-framework-build.md.

## Architecture
- Trois couches : src/engine (moteur pur), src/composables (pont réactif), src/components (affichage).
- Dépendances : components → composables → engine (moteur sans dépendance ; components → engine en `import type` seulement) ; voir docs/adr/0002-architecture-applicative.md.

## Façon de travailler
- Les décisions structurantes sont dans docs/adr/. Ne pas en dévier, ni ajouter de dépendance, sans validation et nouvel ADR.
- Avant toute modification de plus de quelques lignes : proposer un plan et attendre la validation.
- Ne jamais pousser (git push) sans accord explicite.
- Échanges et documentation en français.
