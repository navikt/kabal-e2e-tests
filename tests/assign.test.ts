import { Page } from '@playwright/test';
import { test } from '../fixtures/oppgavebehandling/fixture';
import { ROOT_URL } from './functions';

test.describe('Tildeling/fradeling', () => {
  test('Saksbehandler kan tildele og fradele seg oppgave', async ({ kabalPage }) => {
    const oppgave = await kabalPage.generateKlage();

    await assignTask(kabalPage.page, oppgave.id);
    await deAssignTask(kabalPage.page, oppgave.id);
  });
});

const assignTask = async (page: Page, oppgaveId: string) => {
  await page.goto(`${ROOT_URL}/oppgaver/1`);

  for (;;) {
    const oppgaverRows = page.locator('[data-testid="oppgave-table-rows"][data-isfetching="false"]');
    await oppgaverRows.waitFor();

    const oppgaveRow = oppgaverRows.locator(`[data-testid=oppgave-table-row][data-klagebehandlingid="${oppgaveId}"]`);
    const visible = await oppgaveRow.isVisible();

    if (!visible) {
      const nextButton = page.locator('data-testid=page-next');

      const hasNextButton = await nextButton.isVisible();

      if (hasNextButton) {
        await page.click('data-testid=page-next');
        continue;
      }

      throw new Error(`Oppgave "${oppgaveId}" not found.`);
    } else {
      await oppgaveRow.locator('data-testid=klagebehandling-tildel-button').click();
      await oppgaveRow.locator('data-testid=oppgave-tildel-success').waitFor();

      return;
    }
  }
};

const deAssignTask = async (page: Page, oppgaveId: string) => {
  await page.goto(`${ROOT_URL}/mineoppgaver`);

  await page.waitForSelector('data-testid=mine-oppgaver-table-rows');

  const mineOppgaverRow = page.locator(`[data-testid="mine-oppgaver-row"][data-klagebehandlingid="${oppgaveId}"]`);

  const count = await mineOppgaverRow.count();

  if (count === 0) {
    throw new Error(`No oppgave with ID "${oppgaveId}" found in "Mine Oppgaver" table.`);
  }

  if (count > 1) {
    throw new Error(`More than one oppgave with ID "${oppgaveId}" found in "Mine Oppgaver" table.`);
  }

  await mineOppgaverRow.locator('data-testid=klagebehandling-fradel-button').click();
  await mineOppgaverRow.locator('data-testid=oppgave-fradel-success').waitFor();
};
