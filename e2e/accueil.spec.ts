import { expect, test } from '@playwright/test'
import { verifierAccessibilite } from './support/axe'

test.describe('Accueil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./')
  })

  test("Fumée : la page d'accueil s'affiche", async ({ page }) => {
    await expect(page).toHaveTitle('Démineur')
    await expect(page.getByRole('heading', { level: 1, name: 'Démineur' })).toBeVisible()
  })

  test("RG-19 : aucune violation axe-core serious ou critical sur l'accueil", async ({
    page,
  }, testInfo) => {
    await verifierAccessibilite(page, testInfo)
  })
})
