import { expect, test } from '@playwright/test';
import { ROOT_URL, getParsedUrl } from './functions';

test.describe('Mine Oppgaver', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ROOT_URL}/mineoppgaver`);
  });

  test('"Mine Oppgaver" laster og viser oppgaver', async ({ page }) => {
    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/mineoppgaver');
    await page.waitForSelector('data-testid=mine-oppgaver-table');
    await page.waitForSelector('data-testid=oppgaver-paa-vent-table');
    await page.waitForSelector('data-testid=fullfoerte-oppgaver-table');
  });
});
