import { expect, test } from '@playwright/test';
import { UI_DOMAIN, getParsedUrl } from './functions';

const TABLES: [string, string][] = [
  ['Tildelte oppgaver', 'mine-oppgaver-table-rows'],
  ['Oppgaver på vent', 'oppgaver-paa-vent-table-rows'],
  ['Fullførte oppgaver', 'fullfoerte-oppgaver-table-rows'],
];

test.describe('Mine Oppgaver', () => {
  test(`Alle (${TABLES.length}) oppgavetabeller laster og viser oppgaver`, async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/mineoppgaver`);
    const url = getParsedUrl(page.url());

    expect(url.pathname).toBe('/mineoppgaver');

    await Promise.all(
      TABLES.map(([table, tableId]) =>
        test.step(table, async () => {
          await page.locator(`[data-testid="${tableId}"][data-state="ready"]`).waitFor();
        })
      )
    );
  });
});
