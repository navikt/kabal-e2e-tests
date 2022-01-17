import { expect, test } from '@playwright/test';
import { getParsedUrl } from './functions';
import { getLoggedInPage } from './helpers';
import { userSaksbehandler } from './users';

test.describe('Innstillinger navigation', () => {
  test.beforeEach(async ({ page }) => {
    await getLoggedInPage(page, userSaksbehandler);
  });

  test('Navigates to `/innstillinger`', async ({ page }) => {
    const button = await page.waitForSelector(`data-testid=user-menu-button`, { timeout: 10000 });

    button.click();

    const innstillingerLink = await page.waitForSelector('data-testid=innstillinger-link', { timeout: 10000 });
    await innstillingerLink.click();

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/innstillinger');
  });
});
