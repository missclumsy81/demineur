// Frontières d'architecture rejouables : ADR-0004 (D6), cas dérivés de l'ADR-0002 (« Vérification »).
// La configuration réelle (eslint.config.ts) est chargée ; les extraits sont soumis avec des
// chemins fictifs, sans fichier sur disque.
import { fileURLToPath } from 'node:url'
import { ESLint, type Linter } from 'eslint'
import { beforeAll, describe, expect, it } from 'vitest'

const RACINE = fileURLToPath(new URL('../..', import.meta.url))
const IMPORTS = '@typescript-eslint/no-restricted-imports'
const GLOBALS = 'no-restricted-globals'
const REGLES_FRONTIERES = new Set([IMPORTS, GLOBALS])

let eslint: ESLint

// Une seule instanciation par fichier : charger la configuration coûte une à deux secondes.
beforeAll(() => {
  eslint = new ESLint({ cwd: RACINE })
})

/** Messages des seules règles de frontières, après contrôle de l'absence d'erreur d'analyse. */
async function frontieres(chemin: string, code: string): Promise<Linter.LintMessage[]> {
  const [resultat] = await eslint.lintText(code, { filePath: chemin, warnIgnored: true })
  expect(resultat, `aucun résultat pour ${chemin}`).toBeDefined()
  const messages = resultat!.messages
  expect(messages.filter((m) => m.fatal || m.ruleId === null)).toEqual([])
  return messages.filter((m) => m.ruleId !== null && REGLES_FRONTIERES.has(m.ruleId))
}

/** Script d'un composant monofichier. */
const sfc = (script: string) => `<script setup lang="ts">\n${script}\n</script>\n`

async function attendreEchec(chemin: string, code: string, regle: string) {
  const messages = await frontieres(chemin, code)
  expect(messages.map((m) => m.ruleId)).toContain(regle)
}

async function attendreSucces(chemin: string, code: string) {
  expect(await frontieres(chemin, code)).toEqual([])
}

describe('ADR-0002 : src/engine ne dépend de rien', () => {
  const fichier = 'src/engine/grille.ts'

  it.each([
    ['vue', "import { ref } from 'vue'\nexport const r = ref(0)"],
    ['@vue/reactivity', "import { ref } from '@vue/reactivity'\nexport const r = ref(0)"],
    ['vue/…', "import { ref } from 'vue/dist/vue.esm-bundler.js'\nexport const r = ref(0)"],
  ])('ADR-0002 : import de %s dans le moteur : échec', async (_cas, code) => {
    await attendreEchec(fichier, code, IMPORTS)
  })

  it.each([
    ['composables (alias)', "import { x } from '@/composables/usePartie'"],
    ['composables (relatif)', "import { x } from '../composables/usePartie'"],
    ['composables (/src)', "import { x } from '/src/composables/usePartie'"],
    ['components (alias)', "import X from '@/components/Grille.vue'"],
    ['components (relatif)', "import X from '../components/Grille.vue'"],
    ['App.vue (alias)', "import X from '@/App.vue'"],
    ['App.vue (relatif)', "import X from '../App.vue'"],
  ])('ADR-0002 : import de %s dans le moteur : échec', async (_cas, code) => {
    await attendreEchec(fichier, `${code}\nexport const y = [x, X]`, IMPORTS)
  })

  it.each([
    ['window', 'export const l = window.innerWidth'],
    ['document', 'export const t = document.title'],
    ['localStorage', "export const v = localStorage.getItem('k')"],
    ['globalThis.window', 'export const w = globalThis.window'],
  ])('ADR-0002 : global %s dans le moteur : échec', async (_cas, code) => {
    await attendreEchec(fichier, code, GLOBALS)
  })

  it('ADR-0002 : import interne au moteur : succès', async () => {
    await attendreSucces(
      fichier,
      "import { voisines } from './voisines'\nexport const v = voisines",
    )
  })
})

describe('ADR-0002 : src/composables ne dépend pas de l’affichage', () => {
  const fichier = 'src/composables/usePartie.ts'

  it.each([
    ['components', "import X from '@/components/Grille.vue'"],
    ['components (relatif)', "import X from '../components/Grille.vue'"],
    ['App.vue', "import X from '@/App.vue'"],
  ])('ADR-0002 : import de %s dans un composable : échec', async (_cas, code) => {
    await attendreEchec(fichier, `${code}\nexport const y = X`, IMPORTS)
  })

  it('ADR-0002 : import de valeur du moteur et de vue dans un composable : succès', async () => {
    await attendreSucces(
      fichier,
      "import { ref } from 'vue'\nimport { creerPartie } from '@/engine/partie'\nexport const p = ref(creerPartie)",
    )
  })
})

describe.each([
  ['src/components', 'src/components/Grille.vue'],
  ['src/App.vue', 'src/App.vue'],
])('ADR-0002 : %s n’importe du moteur que des types', (_couche, fichier) => {
  it.each([
    ['alias', "import { creerPartie } from '@/engine/partie'"],
    ['relatif', "import { creerPartie } from '../engine/partie'"],
  ])('ADR-0002 : import de valeur du moteur (%s) : échec', async (_cas, code) => {
    await attendreEchec(fichier, sfc(`${code}\nconst p = creerPartie`), IMPORTS)
  })

  it('ADR-0002 : import de type du moteur : succès', async () => {
    await attendreSucces(
      fichier,
      sfc("import type { Partie } from '@/engine/partie'\nconst p: Partie | null = null"),
    )
  })

  it('ADR-0002 : import d’un composable : succès', async () => {
    await attendreSucces(
      fichier,
      sfc("import { usePartie } from '@/composables/usePartie'\nconst p = usePartie()"),
    )
  })
})

describe('ADR-0002 : src/main.ts, point d’assemblage, hors périmètre', () => {
  it('ADR-0002 : imports du moteur et de App.vue dans main.ts : succès', async () => {
    await attendreSucces(
      'src/main.ts',
      "import { createApp } from 'vue'\nimport App from './App.vue'\nimport { creerPartie } from './engine/partie'\ncreateApp(App).provide('p', creerPartie).mount('#app')",
    )
  })
})
