import { chromium } from '@playwright/test';
import { FullConfig } from '@playwright/test/reporter';
import { getLoggedInPage } from '../tests/helpers';
import { userSaksbehandler } from '../tests/users';

const globalSetup = async (config: FullConfig) => {
  const { storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await getLoggedInPage(page, userSaksbehandler);

  if (typeof storageState === 'string') {
    await page.context().storageState({ path: storageState });
  }

  await browser.close();
};

export default globalSetup;
