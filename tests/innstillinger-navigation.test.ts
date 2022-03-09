import { expect, test } from '@playwright/test';
import { UI_DOMAIN, getParsedUrl } from './functions';

test.describe('Innstillinger-navigasjon', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(UI_DOMAIN);
  });

  test('Navigerer til `/innstillinger`', async ({ page }) => {
    const button = await page.waitForSelector(`data-testid=user-menu-button`);

    button.click();

    const innstillingerLink = await page.waitForSelector('data-testid=innstillinger-link');
    await innstillingerLink.click();

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/innstillinger');
  });
});
