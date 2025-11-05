import type { Page, Request } from '@playwright/test';
import { expect } from '@playwright/test';
import { DEV_DOMAIN, LOCAL_DOMAIN, UI_DOMAIN, USE_LOCALHOST } from './functions';
import type { User } from './users';

export const goToAzure = async (page: Page, path = ''): Promise<Page> => {
  const res = await page.goto(`${DEV_DOMAIN}${path}`);
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

  // Force navigation to local domain, if not using dev domain.
  if (USE_LOCALHOST) {
    await page.goto(`${LOCAL_DOMAIN}${path}`);
  }

  // Browser should be redirected to KABAL.
  expect(azurePage.url()).toMatch(`${UI_DOMAIN}${path}`);

  return azurePage;
};

export const finishedRequest = async (requestPromise: Promise<Request>) => {
  const request = await requestPromise;
  const response = await request.response();

  if (response === null) {
    throw new Error('No response');
  }

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status()} - ${text}`);
  }

  return response.finished();
};
