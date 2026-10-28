# ADR-0001 — Langage, framework et outil de build

- **Statut** : Accepté
- **Date** : 28/10/2026
- **Décideur** : Solveig Deral

## Contexte

TP d'apprentissage du développement assisté par IA dans un cadre industriel : réalisation
d'un démineur web. Contraintes :

- tout gratuit, à l'exception de Claude ;
- poste modeste (MacBook 2011, 8 Go) ;
- volonté d'être représentatif d'un projet d'entreprise, donc d'un développement avec framework.

## Options envisagées

### A. JavaScript natif, sans build

- ➕ Aucun outillage, démarrage immédiat, empreinte minimale sur le poste.
- ➖ Pas de typage statique ; structuration et tests à outiller à la main.
- ➖ Peu représentatif d'un projet d'entreprise.

### B. TypeScript strict + Vite, sans framework

- ➕ Typage fort, build rapide et léger.
- ➕ Contrôle total, aucune abstraction imposée.
- ➖ Gestion du DOM et de la réactivité à écrire soi-même.
- ➖ Ne répond pas à l'objectif « développement avec framework ».

### C. TypeScript strict + Vite + framework

- ➕ Représentatif d'un projet d'entreprise ; écosystème de tests de composants mature.
- ➖ Outillage plus riche à maîtriser et à maintenir.
- React : écarté (préférence du décideur).
- Vue 3 : retenu — Composition API proche de TypeScript idiomatique, intégration native
  avec Vite, outillage léger.

## Décision

Option C avec **Vue 3 en Composition API** (`<script setup lang="ts">`), **TypeScript strict**
et **Vite**.

- **Sans Pinia** : l'état est limité à un écran et porté par des composables.
  À réévaluer au lot 4 (meilleurs temps).
- **Sans routeur** : une seule page.

## Conséquences

- Node.js LTS requis sur le poste.
- Outillage spécifique à Vue à prévoir (vue-tsc pour le typage, outils de test de composants) ;
  le détail relève de l'ADR sur la stratégie de tests.
- Le moteur de jeu restera indépendant de Vue (décision d'architecture à venir).
- Portage mobile possible en PWA sans changement de stack.
- Ajout ultérieur de Pinia peu coûteux, dès lors que l'état passe par des composables.
