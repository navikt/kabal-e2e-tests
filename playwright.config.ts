import { defineConfig } from '@playwright/test';
import { baseConfig } from './playwright.config.base';

export default defineConfig({
  ...baseConfig,
  outputDir: '/tmp/test-results',
  reporter: [['list'], ['./reporters/slack-reporter.ts'], ['./reporters/status.ts']],
  retries: 1,

  use: {
    ...baseConfig.use,
    video: 'on',
    screenshot: 'on',
    storageState: '/tmp/state.json', // File for storing cookies and localStorage (per origin). Speeds up test execution, as the test browser no longer needs to log in for every test.
  },
});
