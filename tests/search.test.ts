import { expect, test } from '@playwright/test';
import { UI_DOMAIN } from './functions';

test.describe('Søk', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/sok`);
  });

  test('Søketekst med både tall og bokstaver utfører ikke et søk', async ({ page }) => {
    page.on('request', (req) => {
      const url = req.url();

      if (url.endsWith('/search/personogoppgaver') || url.endsWith('/search/name')) {
        throw new Error(`Search should not be performed for ${TEST_STRING}`);
      }
    });

    const TEST_STRING = 'tøffeldyr12121248484';
    const searchField = page.getByTestId('search-input');
    await searchField.fill(TEST_STRING);

    await page.waitForTimeout(1_000);
  });

  test('Søketekst med bare bokstaver søker etter flere personer', async ({ page }) => {
    const TEST_STRING = 'tøffeldyr';

    const searchField = page.getByTestId('search-input');

    const response = page.waitForResponse((res) => res.ok() && res.url().endsWith('/search/name'));
    await searchField.fill(TEST_STRING);
    await response;

    const results = await page.getByTestId('search-result').count();

    expect(results).toBeGreaterThan(0);
  });

  test('Søketekst med 11 siffer skal søke etter saker på enkeltperson', async ({ page }) => {
    const TEST_STRING = '184969 00509';

    await page.getByTestId('search-input').fill(TEST_STRING);

    await page.getByTestId('search-result').waitFor();
  });
});
