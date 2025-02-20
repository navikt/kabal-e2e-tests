import { defineConfig } from '@playwright/test';

export const baseConfig = defineConfig({
  fullyParallel: true,
  timeout: 120_000,
  globalTimeout: 600_000,
  name: 'KABAL',
  testDir: './tests',
  use: {
    actionTimeout: 15_000,
    trace: 'on',
    locale: 'no-NB',
  },

  // https://playwright.dev/docs/test-advanced#global-setup-and-teardown
  globalSetup: require.resolve('./setup/global-setup'),
});
