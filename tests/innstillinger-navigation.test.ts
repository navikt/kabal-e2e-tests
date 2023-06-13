import { expect, test } from '@playwright/test';
import { UI_DOMAIN, getParsedUrl } from './functions';

test.describe('Innstillinger-navigasjon', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(UI_DOMAIN);
  });

  test('Navigerer til `/innstillinger`', async ({ page }) => {
    const button = page.getByTestId('user-menu-button');
    await button.click({ timeout: 10_000 });

    const innstillingerLink = page.getByTestId('innstillinger-link');
    await innstillingerLink.click();

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/innstillinger');
  });
});
