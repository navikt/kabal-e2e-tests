import { expect, test } from '@playwright/test';
import { ROOT_URL } from './functions';

const timeout = 5000;

test.describe('Søk', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ROOT_URL}/sok`);
  });

  test('Søketekst med både tall og bokstaver utfører ikke et søk', async ({ page }) => {
    page.on('request', (req) => {
      const url = req.url();

      if (url.endsWith('/search/personogoppgaver') || url.endsWith('/search/name')) {
        throw new Error(`Search should not be performed for ${TEST_STRING}`);
      }
    });

    const TEST_STRING = 'tøffeldyr12121248484';
    const searchField = await page.waitForSelector('data-testid=search-input');
    await searchField.fill(TEST_STRING);

    await page.waitForTimeout(1000);
  });

  test('Søketekst med bare boksstaver søker etter flere personer', async ({ page }) => {
    const TEST_STRING = 'tøffeldyr';

    const searchField = await page.waitForSelector('data-testid=search-input');
    await searchField.fill(TEST_STRING);

    await page.waitForResponse((response) => response.url().endsWith('/search/name'), { timeout });
    const results = await page.locator('data-testid=search-result').count();

    expect(results).toBeGreaterThan(0);
  });

  test('Søketekst med 11 siffer skal søke etter saker på enkeltperson', async ({ page }) => {
    const TEST_STRING = '184969 00509';

    const searchField = await page.waitForSelector('data-testid=search-input');
    await searchField.fill(TEST_STRING);

    await page.waitForSelector('data-testid=search-result', { timeout });
  });
});
