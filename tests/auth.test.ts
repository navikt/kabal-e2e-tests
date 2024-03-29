import { expect, test } from '@playwright/test';
import { getParsedUrl } from './functions';
import { getLoggedInPage, goToAzure } from './helpers';
import { userSaksbehandler } from './users';

test.describe('Ikke innlogget', () => {
  // Don't reuse logged in state for these tests.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Uautentisert/uautorisert bruker av KABAL skal sendes til innlogging i Azure', async ({ page }) => {
    await goToAzure(page);
  });

  test('Bruker skal sendes tilbake til KABAL etter innlogging', async ({ page }) => {
    const path = '/mineoppgaver';
    const loggedInPage = await getLoggedInPage(page, userSaksbehandler, path);

    const url = getParsedUrl(loggedInPage.url());
    expect(url.pathname).toBe(path);
  });
});
