import { expect, test } from '@playwright/test';
import { getParsedUrl } from './functions';
import { getLoggedInPage } from './helpers';
import { userSaksbehandler } from './users';

test.describe('Mine Oppgaver', () => {
  test.beforeEach(async ({ page }) => {
    await getLoggedInPage(page, userSaksbehandler, '/mineoppgaver');
  });

  test('"Mine Oppgaver" loads oppgaver', async ({ page }) => {
    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/mineoppgaver');
    await page.waitForSelector('data-testid=mine-oppgaver-table-rows', { timeout: 10000 });
  });
});
