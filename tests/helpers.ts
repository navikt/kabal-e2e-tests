import { Page, expect } from '@playwright/test';
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
  await azurePage.fill('input[type=email][name=loginfmt]', username, { timeout: 10000 });

  // Click "Next".
  await azurePage.click('input[type=submit]', { timeout: 10000 });

  // Fill in password.
  await azurePage.fill('input[type=password][tabindex="0"]', password, { timeout: 10000 });

  // Click "Sign in".
  await azurePage.click('input[type=submit]', { timeout: 10000 });

  // Click "No" to remember login.
  await azurePage.click('input[type=button]', { timeout: 10000 });

  // Browser should be redirected to KABAL.
  expect(azurePage.url()).toMatch(`https://kabal.dev.nav.no${path}`);

  return azurePage;
};
