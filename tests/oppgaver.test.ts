import { test } from '@playwright/test';
import { UI_DOMAIN } from '@/tests/functions';

test.describe('Oppgaver', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/oppgaver`);
  });

  test('"Oppgaver"-siden vises', async ({ page }) => {
    await page.waitForURL('**/oppgaver');
    await page.locator('tbody[aria-busy="false"]').waitFor();
  });
});
