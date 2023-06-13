import { expect, test } from '@playwright/test';
import { UI_DOMAIN, getParsedUrl } from './functions';

const timeout = 10_000;

test.describe('Navigering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(UI_DOMAIN);
  });

  test('"Oppgaver"-lenke navigerer til `/oppgaver`', async ({ page }) => {
    const behandlingerLink = page.getByTestId('oppgaver-nav-link');
    await behandlingerLink.click({ timeout });

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/oppgaver');
  });

  test('"Mine Oppgaver"-lenke navigerer til `/mineoppgaver`', async ({ page }) => {
    const link = page.getByTestId('mine-oppgaver-nav-link');
    await link.click({ timeout });

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/mineoppgaver');
  });

  test('"Søk"-lenke navigerer til `/sok`', async ({ page }) => {
    const link = page.getByTestId('search-nav-link');
    await link.click({ timeout });

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/sok');
  });

  test('"Enhetens oppgaver"-lenke navigerer til `/enhetensoppgaver`', async ({ page }) => {
    const link = page.getByTestId('enhetens-oppgaver-nav-link');
    await link.click({ timeout });

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/enhetensoppgaver');
  });
});
