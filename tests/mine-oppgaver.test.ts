import { test } from '@playwright/test';
import { UI_DOMAIN } from '@/tests/functions';

const TABLES = ['Oppgaver under arbeid', 'Oppgaver på vent', 'Fullførte oppgaver'];

test.describe('Mine Oppgaver', () => {
  test(`Alle (${TABLES.length}) oppgavetabeller laster og viser oppgaver`, async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/mineoppgaver`);

    await page.waitForURL('**/mineoppgaver');

    await Promise.all(
      TABLES.map((tableName) =>
        test.step(tableName, async () => {
          const section = page.locator('section').filter({ has: page.getByRole('heading', { name: tableName }) });
          await section.locator('tbody[aria-busy="false"]').waitFor();
        }),
      ),
    );
  });
});
