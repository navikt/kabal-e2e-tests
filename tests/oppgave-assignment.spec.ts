import { test } from '@playwright/test';
import { getLoggedInPage } from './helpers';
import { userSaksbehandler } from './users';

test.describe('Oppgave assignment', () => {
  test('Saksbehandler can assign and de-assign oppgave', async ({ page }) => {
    await getLoggedInPage(page, userSaksbehandler, '/oppgaver/1');

    const oppgaverRow = await page.locator('data-testid=oppgave-table-row').first();
    const id = await oppgaverRow.getAttribute('data-klagebehandlingid');
    await oppgaverRow.locator('data-testid=klagebehandling-tildel-button').click();
    await oppgaverRow.locator('data-testid=oppgave-tildel-success').waitFor();

    await page.click('data-testid=mine-oppgaver-nav-link');
    const mineOppgaverRow = await page.locator(`tr[data-klagebehandlingid="${id}"]`);
    await mineOppgaverRow.locator('data-testid=klagebehandling-fradel-button').click();
    await mineOppgaverRow.locator('data-testid=oppgave-fradel-success').waitFor();
  });
});
