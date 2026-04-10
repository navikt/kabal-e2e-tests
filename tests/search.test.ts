import { expect, test } from '@playwright/test';
import { UI_DOMAIN } from '@/tests/functions';

test.describe('Søk', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/sok`);
  });

  test('Søk på fnr med både tall og bokstaver utfører ikke et søk', async ({ page }) => {
    const TEST_STRING = 'tøffeldyr12121248484';

    page.on('request', (req) => {
      const url = req.url();

      if (url.endsWith('/search/personogoppgaver') || url.endsWith('/search/name')) {
        throw new Error(`Search should not be performed for ${TEST_STRING}`);
      }
    });

    const searchField = page.getByRole('searchbox');
    await searchField.fill(TEST_STRING);

    await page.waitForTimeout(1_000);
  });

  test('Søk på fnr med 11 siffer skal søke etter saker på enkeltperson', async ({ page }) => {
    const TEST_STRING = '184969 00509';

    await page.getByRole('searchbox').fill(TEST_STRING);

    await expect(page.getByRole('heading', { name: 'Søkeresultater' })).toBeVisible();
  });

  test('Søk på saksnummer må trigges manuelt', async ({ page }) => {
    await page.getByText('Saksnummer').click();
    const search = page.getByPlaceholder('Søk på saksnummer');
    await search.fill('1736');
    await search.press('Enter');

    await expect(page.getByRole('heading', { name: 'Søkeresultater' })).toBeVisible();
  });
});
