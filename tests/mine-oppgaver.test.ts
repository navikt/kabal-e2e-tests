import { expect, test } from '@playwright/test';
import { UI_DOMAIN, getParsedUrl } from './functions';

test.describe('Mine Oppgaver', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/mineoppgaver`);
  });

  test('"Mine Oppgaver" laster og viser behandlinger', async ({ page }) => {
    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/mineoppgaver');
    await page.waitForSelector('[data-testid="mine-oppgaver-table-rows"][data-state="ready"]');
  });

  test('"Oppgaver på vent" laster og viser behandlinger', async ({ page }) => {
    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/mineoppgaver');
    await page.waitForSelector('[data-testid="oppgaver-paa-vent-table-rows"][data-state="ready"]');
  });

  test('"Fullførte oppgaver" laster og viser behandlinger', async ({ page }) => {
    const url = getParsedUrl(page.url());
    expect(url.pathname).toBe('/mineoppgaver');
    await page.waitForSelector('[data-testid="fullfoerte-oppgaver-table-rows"][data-state="ready"]');
  });
});
