import { expect, test } from '@playwright/test';
import { getParsedUrl } from './functions';
import { getLoggedInPage } from './helpers';
import { userSaksbehandler } from './users';

test.describe('Innstillinger', () => {
  test.beforeEach(async ({ page }) => {
    await getLoggedInPage(page, userSaksbehandler, '/innstillinger');
  });

  test('"Innstillinger" loads settings', async ({ page }) => {
    const url = getParsedUrl(page.url());

    expect(url.pathname).toBe('/innstillinger');

    await page.waitForSelector('data-testid=typer-settings-dropdown', { timeout: 10000 });
    await page.waitForSelector('data-testid=ytelser-settings-dropdown', { timeout: 10000 });
    await page.waitForSelector('data-testid=hjemler-settings-dropdown', { timeout: 10000 });
  });
});
