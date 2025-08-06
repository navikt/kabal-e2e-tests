import { expect, test } from '@playwright/test';
import { getParsedUrl, UI_DOMAIN } from './functions';

test.describe('Innstillinger', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/innstillinger`);
  });

  test('"Innstillinger" laster og viser innstillinger', async ({ page }) => {
    const url = getParsedUrl(page.url());

    expect(url.pathname).toBe('/innstillinger');

    await Promise.all([page.getByTestId('ytelser-settings').waitFor(), page.getByTestId('hjemler-settings').waitFor()]);
  });
});
