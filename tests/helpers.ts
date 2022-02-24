import { Page, expect } from '@playwright/test';
import { IS_DEV, ROOT_URL } from './functions';
import { User } from './users';

export const goToAzure = async (page: Page, path = ''): Promise<Page> => {
  const res = await page.goto(`https://kabal.dev.nav.no${path}`);
  expect(res).not.toBeNull();
  const url = res?.url();
  expect(url).toBeDefined();
  expect(url).toMatch('https://login.microsoftonline.com');
  return page;
};

export const getLoggedInPage = async (page: Page, { username, password }: User, path = '') => {
  const azurePage = await goToAzure(page, path);
  // Fill in username.
  await azurePage.fill('input[type=email][name=loginfmt]', username);

  // Click "Next".
  await azurePage.click('input[type=submit]');

  // Fill in password.
  await azurePage.fill('input[type=password][tabindex="0"]', password);

  // Click "Sign in".
  await azurePage.click('input[type=submit]');

  // Click "No" to remember login.
  await azurePage.click('input[type=button]');

  if (IS_DEV) {
    await page.goto(`${ROOT_URL}${path}`);
  }

  // Browser should be redirected to KABAL.
  expect(azurePage.url()).toMatch(`${ROOT_URL}${path}`);

  return azurePage;
};
