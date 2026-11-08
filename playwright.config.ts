import { defineConfig, devices } from '@playwright/test'

// Tests de bout en bout : ADR-0004 (D5). Le branchement en CI relève de l'ADR-0005.
const CI = !!process.env.CI
const PORT = 4173
// Point unique où ajouter le chemin de base GitHub Pages (ADR-0005).
const URL_BASE = `http://localhost:${PORT}/`

const chromium = { name: 'chromium', use: { ...devices['Desktop Chrome'] } }

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  // Poste local modeste : un seul navigateur à la fois.
  workers: CI ? undefined : 1,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: URL_BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  // Chromium seul en local ; matrice complète en CI.
  projects: CI
    ? [
        chromium,
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        { name: 'android', use: { ...devices['Pixel 7'] } },
        { name: 'iphone', use: { ...devices['iPhone 15'] } },
      ]
    : [chromium],
  // On teste l'artefact de production servi par vite preview, pas le serveur de développement.
  webServer: {
    command: `npm run build-only && npm run preview -- --port ${PORT} --strictPort`,
    url: URL_BASE,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
