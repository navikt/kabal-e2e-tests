import { expect, test } from '@playwright/test';
import { UI_DOMAIN, getParsedUrl } from './functions';

const timeout = 5000;

test.describe('Navigering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(UI_DOMAIN);
  });

  test('"Oppgaver"-lenke navigerer til `/oppgaver`', async ({ page }) => {
    const behandlingerLink = await page.waitForSelector('data-testid=oppgaver-nav-link', { timeout });

    await behandlingerLink.click();

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/oppgaver');
  });

  test('"Mine Oppgaver"-lenke navigerer til `/mineoppgaver`', async ({ page }) => {
    const link = await page.waitForSelector('data-testid=mine-oppgaver-nav-link', { timeout });

    await link.click();

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/mineoppgaver');
  });

  test('"Søk"-lenke navigerer til `/sok`', async ({ page }) => {
    const link = await page.waitForSelector('data-testid=search-nav-link', { timeout });

    await link.click();

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/sok');
  });

  test('"Enhetens oppgaver"-lenke navigerer til `/enhetensoppgaver`', async ({ page }) => {
    const link = await page.waitForSelector('data-testid=enhetens-oppgaver-nav-link', {
      timeout,
    });

    await link.click();

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/enhetensoppgaver');
  });
});
