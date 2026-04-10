import { test } from '@playwright/test';
import { UI_DOMAIN } from '@/tests/functions';

test.describe('Innstillinger-navigasjon', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(UI_DOMAIN);
  });

  test('Navigerer til `/innstillinger`', async ({ page }) => {
    const userMenuButton = page.getByRole('button').filter({ hasText: 'Enhet:' });
    await userMenuButton.click({ timeout: 15_000 });

    const innstillingerLink = page.getByRole('menuitem', { name: 'Innstillinger' });
    await innstillingerLink.click();

    await page.waitForURL('**/innstillinger');
  });
});
