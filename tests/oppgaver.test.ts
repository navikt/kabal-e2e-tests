import { expect, test } from '@playwright/test';
import { ROOT_URL, getParsedUrl } from './functions';

test.describe('Oppgaver', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ROOT_URL}/oppgaver/1`);
  });

  test('"Oppgaver"-siden vises', async ({ page }) => {
    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/oppgaver/1');
    await page.waitForSelector('data-testid=oppgave-table-rows');
  });
});
