// Contrôle d'accessibilité commun aux états clés : ADR-0004 (D5), RG-19.
import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, type TestInfo } from '@playwright/test'

const ETIQUETTES_WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const BLOQUANTES = new Set(['serious', 'critical'])

/**
 * Échoue sur toute violation serious ou critical ; signale les violations minor et moderate
 * (annotation et pièce jointe du rapport) sans bloquer.
 */
export async function verifierAccessibilite(page: Page, testInfo: TestInfo): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(ETIQUETTES_WCAG).analyze()

  const bloquantes = violations.filter((v) => BLOQUANTES.has(v.impact ?? ''))
  const signalees = violations.filter((v) => !BLOQUANTES.has(v.impact ?? ''))

  if (signalees.length > 0) {
    testInfo.annotations.push({
      type: 'axe (non bloquant)',
      description: signalees.map((v) => `${v.impact} : ${v.id}`).join(', '),
    })
  }
  if (violations.length > 0) {
    await testInfo.attach('violations-axe.json', {
      body: JSON.stringify(violations, null, 2),
      contentType: 'application/json',
    })
  }

  expect(
    bloquantes.map((v) => `${v.impact} : ${v.id} (${v.nodes.length} nœud(s))`),
    'violations axe-core serious ou critical',
  ).toEqual([])
}
