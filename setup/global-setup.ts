import { Page, chromium } from '@playwright/test';
import { FullConfig } from '@playwright/test/reporter';
import { USE_DEV } from '../tests/functions';
import { getLoggedInPage } from '../tests/helpers';
import { userSaksbehandler } from '../tests/users';
import { DEV_DOMAIN } from './../tests/functions';

const globalSetup = async (config: FullConfig) => {
  const { storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await getLoggedInPage(page, userSaksbehandler);

  if (typeof storageState === 'string') {
    if (!USE_DEV) {
      await setLocalhostCookie(page);
    }

    await page.context().storageState({ path: storageState });
  }

  await browser.close();
};

export default globalSetup;

const setLocalhostCookie = async (page: Page) => {
  const cookies = await page.context().cookies(DEV_DOMAIN);

  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error(`Did not find any cookies for ${DEV_DOMAIN}`);
  }

  if (cookies.length > 1) {
    throw new Error(`Found more than one cookie for ${DEV_DOMAIN}`);
  }

  await page.context().clearCookies();

  await page.context().addCookies([{ ...cookies[0], domain: 'localhost' }]);
};
