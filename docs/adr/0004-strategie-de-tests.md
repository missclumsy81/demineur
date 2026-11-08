# ADR-0004 — Stratégie de tests

- **Statut** : Accepté
- **Date** : 08/11/2026
- **Décideur** : Solveig Deral
- **Références** : ADR-0002 (architecture en couches), ADR-0003 (outillage qualité), `docs/01-specifications.md`

## Contexte

Les forces qui départagent les options :

- Le moteur (`src/engine`) est pur et reçoit un générateur à graine (ADR-0002, RG-03) : il se teste sans navigateur, de façon déterministe.
- Les frontières entre couches sont garanties par ESLint (ADR-0002, _Vérification_), mais la configuration est fragile : en flat config, un bloc qui reconfigure `no-restricted-imports` remplace les options précédentes, sans erreur visible.
- Les spécifications sont structurées en règles de gestion (RG-xx), user stories (US-xx) avec scénarios Gherkin, et exigences non fonctionnelles (ENF-xx). Elles demandent que les RG soient référencées dans le nom des tests : la couverture des critères d'acceptation doit être démontrable (DoD).
- Le poste local est limité ; une matrice de navigateurs complète n'est envisageable qu'en CI.
- Le site est statique, sans back-end (ENF-05) : aucune donnée ni aucun mécanisme ne peut être protégé côté client.

## Décisions

### D1 — Niveaux de test : pyramide classique

**Règle : chaque critère d'acceptation se teste au niveau le plus bas capable de le prouver.**

| Niveau      | Outil, périmètre                                            | Ce qui est prouvé                                                                                                                                                                     |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Statique    | `vue-tsc` (typage), ESLint (lint), tests de frontières (D6) | Contrats de types, architecture                                                                                                                                                       |
| Unitaire    | Vitest, `src/engine`, graine fixe                           | RG-01 à RG-13, sauf l'écoulement du temps de RG-10                                                                                                                                    |
| Intégration | Vitest, `src/composables` + `src/components` en DOM simulé  | L'interface reflète l'état ; les événements produisent la bonne action ; écoulement du temps de RG-10 (fausses horloges) ; RG-14 à RG-18. Les règles du moteur ne sont pas re-testées |
| E2E         | Playwright, application construite                          | Scénarios Gherkin de US-01 à US-05 ; tactile réel (RG-15) ; RG-19 ; RG-20 (préférences émulées)                                                                                       |

Exigences non fonctionnelles :

| ENF                              | Vérification                                                                                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENF-01 Navigateurs               | Matrice CI de D5. WebKit approxime Safari sans s'y substituer                                                                                                                      |
| ENF-02 Largeur 360 px            | E2E : viewport de 360 px, aucun défilement horizontal de la page                                                                                                                   |
| ENF-03 Bundle < 50 Ko gzip       | Contrôle de taille du build en CI (ADR-0005)                                                                                                                                       |
| ENF-04 Génération Expert < 50 ms | Pas de test automatique : une mesure de durée est instable selon la charge, et la CI ne reproduit pas le poste de référence. Mesure ponctuelle au lot 1, consignée dans le journal |
| ENF-05 Aucun appel réseau        | E2E : échec sur toute requête hors de l'origine du site                                                                                                                            |

Les tests d'intégration sont **sociables** : ils utilisent le vrai moteur avec une graine fixe. Les simulations sont réservées aux dépendances externes (fausses horloges pour le chronomètre, `localStorage`).

Écartés :

- _Trophée_ (intégration majoritaire) : le moteur pur se prouve plus vite et plus finement en unitaire.
- E2E majoritaire : lent sur le poste, fragile, diagnostic tardif.

### D2 — Lanceur : Vitest

Il réutilise la configuration Vite (alias, transformation des `.vue`), choisit l'environnement Node ou DOM par fichier, fournit les fausses horloges et la couverture. Un seul lanceur couvre les tests de frontières (D6), l'unitaire et l'intégration.

Écartés :

- Jest : seconde chaîne de transformation à maintenir, support ESM partiel.
- `node:test` : ni `.vue`, ni alias, ni DOM.

### D3 — DOM simulé et bibliothèque de composants : jsdom, `@testing-library/vue`, `@testing-library/user-event`

- jsdom : référence de `create-vue`, plus fidèle. Le gain de vitesse de happy-dom est marginal sur un petit nombre de tests.
- Testing Library : requêtes par rôle et par libellé. Les tests restent en boîte noire et vérifient au passage l'accessibilité (RG-17). `user-event` simule des interactions réalistes (souris, clavier).

Écarté : `@vue/test-utils` seul (accès aux internes du composant, recherche par sélecteur CSS).
Repli prévu si Testing Library est abandonné : `@vue/test-utils`, avec la règle « recherche par `role` ou `aria-label`, jamais par classe CSS ».

### D4 — Couverture

- Outil : **v8** (`@vitest/coverage-v8`), sans instrumentation du code, donc plus rapide sur le poste. Écarté : istanbul.
- Seuil : **90 % sur les quatre métriques** (lignes, instructions, fonctions, branches), **limité à `src/engine`, bloquant** : le script de tests unitaires avec couverture (nommé à l'installation) échoue sous le seuil. Le reste du code est mesuré sans bloquer. Son exécution en CI relève de l'ADR-0005.
  Écartés : seuil global (il mêle du code prouvé en E2E), lignes seules (laisse passer des branches de règles non testées).
- Périmètre mesuré explicite : `coverage.include: ['src/**']`. Sans lui, un fichier qu'aucun test n'importe n'apparaît pas dans le rapport et ne fait pas baisser le taux.

### D5 — Tests de bout en bout : Playwright

- **Outil : Playwright.** Écarté : Cypress (WebKit expérimental, exécution plus lourde, parallélisation via un service payant).
- **Navigateurs** : Chromium seul en local ; en CI, Chromium, Firefox, WebKit et deux profils mobiles émulés (Android, iPhone).
- **Application testée** : le build de production servi par `vite preview`, avec le chemin de base de GitHub Pages. On teste l'artefact déployé, y compris la résolution des chemins.
- **Scénarios** : dérivés des blocs Gherkin des spécifications.
- **Accessibilité** : `@axe-core/playwright` sur les états clés (accueil, partie en cours, victoire, défaite), avec les étiquettes `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` (WCAG 2.2 A et AA). Conformément à RG-19, les violations _serious_ et _critical_ font échouer le test ; les violations _minor_ et _moderate_ sont signalées sans bloquer.
- **Graine** : paramètre d'URL `?graine=…`, lu dans `src/main.ts` (point d'assemblage) et transmis à l'application ; le mécanisme de transmission est fixé à l'implémentation. Sans paramètre, une graine est tirée au hasard. Ce choix anticipe US-14 (partager une grille via sa graine dans l'URL).
  Écartés : build dédié aux tests (on ne testerait plus l'artefact déployé) ; fichier de configuration lu au démarrage (requête et démarrage asynchrone supplémentaires, fichier public de toute façon) ; remplacement de `Math.random` par script injecté (couplé à un détail d'implémentation).

### D6 — Tests de frontières rejouables

Un test Vitest (environnement Node) charge la configuration réelle via l'API Node d'ESLint et soumet des extraits de code avec des chemins fictifs (`lintText(code, { filePath })`). Il vérifie que chaque interdiction se déclenche et que chaque autorisation passe (dont `import type` depuis le moteur). Les cas sont dérivés de la section _Vérification_ de l'ADR-0002.

Écartés :

- Fichiers témoins sur disque : pris par `npm run lint`, et exposés à la limite d'analyse textuelle des chemins.
- `RuleTester` : teste une règle avec des options données, pas la configuration du projet.
- Pas de test : le lint ne détecte pas une règle désactivée.

### D7 — Conventions

- **Emplacement** : arborescence séparée du code de production.

  ```
  tests/
    unitaires/      moteur (Node)
    integration/    composables et composants (jsdom)
    architecture/   frontières ESLint (Node)
  e2e/              Playwright
  ```

  Écarté : tests à côté du code (`__tests__`). Ils hériteraient des frontières de leur couche ; un test d'intégration ne pourrait pas importer le vrai moteur sans une exception dans la configuration ESLint.

- **Nommage** : suffixe `.spec.ts` à tous les niveaux.
- **Traçabilité** : les intitulés citent la règle, la story ou l'exigence testée, au format des spécifications : `it('RG-04 : le premier clic n'est jamais une mine', …)`.

## Conséquences

**Dépendances de développement ajoutées** : `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/vue`, `@testing-library/user-event`, `@testing-library/dom`, `@playwright/test`, `@axe-core/playwright`. Toute dépendance supplémentaire proposée par un générateur est soumise à validation.

**Configuration à adapter** :

- Un `tsconfig.vitest.json`, référencé par `tsconfig.json`, couvre `tests/` ; l'exclusion `src/**/__tests__/*` de `tsconfig.app.json` devient sans objet. `e2e/` est typé par une configuration adaptée à Playwright.
- Le chemin de base de GitHub Pages n'est pas encore configuré dans Vite ; il le sera avec le déploiement (ADR-0005).

Positives :

- Chaque règle, story et exigence est traçable jusqu'à ses tests (`grep RG-04`).
- Les frontières d'architecture sont prouvées à chaque exécution, et plus seulement une fois.
- Les E2E valident l'artefact réellement déployé.

Négatives et limites :

- La couverture ne prouve pas la qualité des assertions. Le test de mutation (Stryker) n'est pas adopté ; c'est une expérience candidate au lot 1 pour évaluer les tests du sous-agent `testeur`.
- axe-core ne détecte qu'une partie des problèmes d'accessibilité ; le reste repose sur les requêtes par rôle (D3) et sur les parcours clavier.
- WebKit en CI ne garantit pas le comportement de Safari (ENF-01).
- ENF-04 n'est pas vérifiée automatiquement.
- L'instanciation d'ESLint coûte une à deux secondes ; elle est faite une seule fois par fichier de test.
- Aucune règle ESLint avec typage (_type-aware_) n'est active. Si elles le deviennent, les chemins fictifs de D6 devront être couverts par un `tsconfig`.
- Les chemins de `tests/` doivent refléter ceux de `src/` à la main.

Engagements pour la suite :

- **Lot 4 (US-10)** : une partie lancée avec une graine imposée n'enregistre pas de meilleur temps.
- **ADR-0005** : branchement de la couverture et des tests en CI, matrice de navigateurs, contrôle de taille du build (ENF-03), chemin de base Pages.
- **Précision de l'ADR-0002** : `tsconfig` propre à `src/engine`, sans la lib `DOM`, et mention du critère désormais rejoué par D6.
