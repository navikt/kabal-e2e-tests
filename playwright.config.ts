import type { PlaywrightTestConfig } from '@playwright/test';
import { SCREEN_SIZE } from './setup/global-setup';

const config: PlaywrightTestConfig = {
  outputDir: '/tmp/test-results',
  workers: 4,
  fullyParallel: true,
  timeout: 600_000,
  globalTimeout: 600_000,
  name: 'KABAL',
  reporter: [['list'], ['./reporters/slack-reporter.ts']],
  retries: 1,
  testDir: './tests',
  use: {
    actionTimeout: 15_000,
    video: { mode: 'on', size: SCREEN_SIZE },
    screenshot: 'on',
    trace: 'on',
    locale: 'no-NB',
    viewport: SCREEN_SIZE,
    storageState: '/tmp/state.json', // File for storing cookies and localStorage (per origin). Speeds up test execution, as the test browser no longer needs to log in for every test.
  },
  // https://playwright.dev/docs/test-advanced#global-setup-and-teardown
  globalSetup: require.resolve('./setup/global-setup'),
};

// biome-ignore lint/style/noDefaultExport: https://playwright.dev/docs/test-configuration
export default config;
