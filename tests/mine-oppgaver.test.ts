import { expect, test } from '@playwright/test';
import { UI_DOMAIN, getParsedUrl } from './functions';

test.describe('Mine Oppgaver', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/mineoppgaver`);
  });

  const tables: [string, string][] = [
    ['Mine Oppgaver', 'mine-oppgaver-table-rows'],
    ['Oppgaver på vent', 'oppgaver-paa-vent-table-rows'],
    ['Fullførte oppgaver', 'fullfoerte-oppgaver-table-rows'],
  ];

  test('"Mine Oppgaver" laster og viser behandlinger', async ({ page }) => {
    const url = getParsedUrl(page.url());

    expect(url.pathname).toBe('/mineoppgaver');

    for (const [tableName, tableId] of tables) {
      test.step(tableName, async () => {
        await page.waitForSelector(`[data-testid="${tableId}"][data-state="ready"]`);
      });
    }
  });
});
