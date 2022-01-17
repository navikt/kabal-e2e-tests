import { expect, test } from '@playwright/test';
import { getParsedUrl } from './functions';
import { getLoggedInPage } from './helpers';
import { userSaksbehandler } from './users';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await getLoggedInPage(page, userSaksbehandler);
  });

  test('"Oppgaver" navigates to `/oppgaver/1`', async ({ page }) => {
    const oppgaverLink = await page.waitForSelector('data-testid=oppgaver-nav-link', { timeout: 1000 });

    await oppgaverLink.click();

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/oppgaver/1');
  });

  test('"Mine Oppgaver" navigates to `/mineoppgaver`', async ({ page }) => {
    const link = await page.waitForSelector('data-testid=mine-oppgaver-nav-link', { timeout: 1000 });

    await link.click();

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/mineoppgaver');
  });

  test('"Search" navigates to `/sok`', async ({ page }) => {
    const link = await page.waitForSelector('data-testid=search-nav-link', { timeout: 1000 });

    await link.click();

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/sok');
  });

  test('"Enhetens oppgaver" navigates to `/enhetensoppgaver`', async ({ page }) => {
    const link = await page.waitForSelector('data-testid=enhetens-oppgaver-nav-link', {
      timeout: 3000,
    });

    await link.click();

    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/enhetensoppgaver');
  });
});
