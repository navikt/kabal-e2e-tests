import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  timeout: 30000,
  globalTimeout: 600000,
  name: 'KABAL',
  reporter: [['list'], ['./reporters/slack-reporter.ts']],
  retries: 3,
  testDir: './tests',
  use: {
    video: 'on',
    screenshot: 'on',
    trace: 'on',
    locale: 'no-NB',
  },
  workers: 1,
};

export default config;
