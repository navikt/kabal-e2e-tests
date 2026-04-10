import { test } from '@playwright/test';
import { UI_DOMAIN } from '@/tests/functions';

const timeout = 15_000;

test.describe('Navigering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(UI_DOMAIN);
  });

  test('"Oppgaver"-lenke navigerer til `/oppgaver`', async ({ page }) => {
    const behandlingerLink = page.getByRole('link', { name: 'Oppgaver', exact: true });
    await behandlingerLink.click({ timeout });

    await page.waitForURL('**/oppgaver');
  });

  test('"Mine Oppgaver"-lenke navigerer til `/mineoppgaver`', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Mine Oppgaver' });
    await link.click({ timeout });

    await page.waitForURL('**/mineoppgaver');
  });

  test('"Søk"-lenke navigerer til `/sok`', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Søk på person' });
    await link.click({ timeout });

    await page.waitForURL('**/sok');
  });

  test('"Oppgavestyring"-lenke navigerer til `/oppgavestyring`', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Oppgavestyring' });
    await link.click({ timeout });

    await page.waitForURL('**/oppgavestyring');
  });
});
