import { test } from '@playwright/test';
import { getTable } from '@/fixtures/table';
import { UI_DOMAIN } from '@/tests/functions';

const TABLES = ['Oppgaver under arbeid', 'Oppgaver på vent', 'Fullførte oppgaver'];

test.describe('Mine Oppgaver', () => {
  test(`Alle (${TABLES.length}) oppgavetabeller laster og viser oppgaver`, async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/mineoppgaver`);

    await page.waitForURL('**/mineoppgaver');

    await Promise.all(
      TABLES.map((tableName) =>
        test.step(tableName, async () => {
          const { body } = getTable(page, tableName);
          await body.waitFor();
        }),
      ),
    );
  });
});
