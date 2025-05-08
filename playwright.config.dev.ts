import { defineConfig } from '@playwright/test';
import { baseConfig } from './playwright.config.base';

// biome-ignore lint/style/noDefaultExport: https://playwright.dev/docs/test-configuration
export default defineConfig({
  ...baseConfig,
  maxFailures: 1,
  reporter: [['./reporters/gha.ts']],

  use: {
    ...baseConfig.use,
    storageState: './state.json', // File for storing cookies and localStorage (per origin). Speeds up test execution, as the test browser no longer needs to log in for every test.
  },
});
