import { expect, test } from '@playwright/test';
import { getParsedUrl, UI_DOMAIN } from './functions';

test.describe('Oppgaver', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/oppgaver`);
  });

  test('"Oppgaver"-siden vises', async ({ page }) => {
    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/oppgaver');
    await page.locator('[data-testid="oppgave-table-rows"][data-state="ready"]').waitFor();
  });
});
