import { expect, test } from '@playwright/test';
import { getParsedUrl } from './functions';
import { getLoggedInPage } from './helpers';
import { userSaksbehandler } from './users';

test.describe('Oppgaver', () => {
  test.beforeEach(async ({ page }) => {
    await getLoggedInPage(page, userSaksbehandler, '/oppgaver/1');
  });

  test('"Oppgaver" loads oppgaver', async ({ page }) => {
    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/oppgaver/1');
    await page.waitForSelector('data-testid=oppgave-table-rows', { timeout: 10000 });
  });
});
