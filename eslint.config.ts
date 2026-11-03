import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from 'eslint-config-prettier/flat'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

// Frontières d'architecture : ADR-0002 (section « Vérification ») et ADR-0003.
// Reconnaît une cible quelle que soit la forme du chemin : @/…, ./…, ../…, /src/…
const pathTo = (target: string) => `^(@|\\.{1,2}|/src)/(.*/)?${target}(/|$)`

const forbid = (target: string, message: string) => ({
  regex: pathTo(target),
  caseSensitive: true,
  message,
})

const noComponents = forbid('components', 'Couche interdite ici : src/components (ADR-0002).')
const noAppVue = forbid('App\\.vue', 'App.vue est traité comme un composant (ADR-0002).')

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    name: 'app/boundaries-engine',
    files: ['src/engine/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(@vue/|vue(/|$))',
              caseSensitive: true,
              message: 'Le moteur ne dépend pas de Vue (ADR-0002).',
            },
            forbid('composables', 'Couche interdite ici : src/composables (ADR-0002).'),
            noComponents,
            noAppVue,
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          globals: ['window', 'document', 'localStorage'],
          checkGlobalObject: true,
        },
      ],
    },
  },

  {
    name: 'app/boundaries-composables',
    files: ['src/composables/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [noComponents, noAppVue] }],
    },
  },

  {
    name: 'app/boundaries-components',
    files: ['src/components/**', 'src/App.vue'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              ...forbid('engine', 'Seul `import type` est permis depuis le moteur (ADR-0002).'),
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },

  skipFormatting,
)
