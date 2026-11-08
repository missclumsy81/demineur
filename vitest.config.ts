import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Stratégie de tests : ADR-0004 (D2 lanceur, D4 couverture, D7 arborescence).
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Un projet par dossier : l'environnement suit le niveau de test.
      projects: [
        {
          extends: true,
          test: {
            name: 'unitaires',
            include: ['tests/unitaires/**/*.spec.ts'],
            environment: 'node',
          },
        },
        {
          extends: true,
          test: {
            name: 'integration',
            include: ['tests/integration/**/*.spec.ts'],
            environment: 'jsdom',
          },
        },
        {
          extends: true,
          test: {
            name: 'architecture',
            include: ['tests/architecture/**/*.spec.ts'],
            environment: 'node',
          },
        },
      ],
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        reporter: ['text', 'html'],
        // Seuil bloquant limité au moteur ; le reste est mesuré sans bloquer.
        thresholds: {
          'src/engine/**': { lines: 90, statements: 90, functions: 90, branches: 90 },
        },
      },
    },
  }),
)
