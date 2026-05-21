import { slackReporter, statusReporter } from '@navikt/klage-e2e-reporters';
import { defineConfig } from '@playwright/test';

const isInNais = process.env.CONFIG === 'nais';

export const storageState = isInNais ? '/tmp/state.json' : './state.json';

const baseConfig = defineConfig({
  workers: 4,
  name: 'Kabal',
  timeout: 120_000,
  globalTimeout: 600_000,
  globalSetup: './setup/global-setup.ts',

  testDir: './tests',
  testMatch: '**/*.test.ts',
  fullyParallel: true,

  use: {
    locale: 'no-NB',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    storageState,
    trace: 'on',
    video: 'on',
    screenshot: 'on',
    viewport: { width: 1280, height: 800 },
  },
});

const local = defineConfig({
  ...baseConfig,

  maxFailures: 1,
  outputDir: './test-results',
  reporter: [['list']],
  retries: 0,
});

const nais = defineConfig({
  ...baseConfig,

  forbidOnly: true,
  maxFailures: 0,
  outputDir: '/tmp/test-results',
  reporter: [
    ['list'],
    slackReporter({ botName: 'Kabal E2E', iconUrl: 'navikt/kabal/main/frontend/assets/android-chrome-192x192.png' }),
    statusReporter({ name: 'Kabal E2E' }),
  ],
  retries: 1,
});

export default isInNais ? nais : local;
