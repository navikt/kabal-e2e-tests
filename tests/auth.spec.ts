import { expect, test } from '@playwright/test';
import { getParsedUrl } from './functions';
import { getLoggedInPage, goToAzure } from './helpers';
import { userSaksbehandler } from './users';

test.describe('Uauthorized', () => {
  test('Uauthorized load of KABAL without path should redirect to Azure login', async ({ page }) => {
    await goToAzure(page);
  });

  test('User should be redirected to initial path after login', async ({ page }) => {
    const path = '/mineoppgaver';
    const loggedInPage = await getLoggedInPage(page, userSaksbehandler, path);

    const url = getParsedUrl(loggedInPage.url());
    expect(url.pathname).toBe(path);
  });
});
