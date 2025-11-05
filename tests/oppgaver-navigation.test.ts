import { expect, test } from '@playwright/test';
import { getParsedUrl, UI_DOMAIN } from '@/tests/functions';

const timeout = 15_000;

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

  test('"Oppgavestyring"-lenke navigerer til `/oppgavestyring`', async ({ page }) => {
    const link = page.getByTestId('oppgavestyring-nav-link');
    await link.click({ timeout });

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/oppgavestyring');
  });
});
