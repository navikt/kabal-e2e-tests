import { test } from '@playwright/test';
import { getTable } from '@/fixtures/table';
import { UI_DOMAIN } from '@/tests/functions';

test.describe('Oppgaver', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/oppgaver`);
  });

  test('"Oppgaver"-siden vises', async ({ page }) => {
    await page.waitForURL('**/oppgaver');
    const { body } = getTable(page, 'Ledige oppgaver');
    await body.waitFor();
  });
});
