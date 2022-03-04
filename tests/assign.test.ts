import { Page } from '@playwright/test';
import { test } from '../fixtures/oppgavebehandling/fixture';
import { Oppgave } from '../fixtures/oppgavebehandling/oppgave';
import { ROOT_URL } from './functions';

test.describe('Tildeling/fradeling', () => {
  test('Saksbehandler kan tildele og fradele seg oppgave', async ({ kabalPage }) => {
    const oppgave = await kabalPage.generateKlage();

    await assignTask(kabalPage.page, oppgave);
    await deAssignTask(kabalPage.page, oppgave.id);
  });
});

const setFilter = async (page: Page, filterName: string, value: string) => {
  const filterContainer = page.locator(`data-testid=${filterName}`);
  const filterToggleButton = filterContainer.locator('[data-testid="toggle-button"]');
  await filterToggleButton.click();

  const filterList = filterContainer.locator('[data-testid="filter-list"]');
  await filterList.waitFor();

  const filterItems = filterList.locator(`[data-testid="filter"]`);

  const count = await filterItems.count();

  for (let i = 0; i < count; i++) {
    const filter = filterItems.nth(i);
    const filterId = await filter.getAttribute('data-filterid');

    if (filterId === value) {
      await filter.check();
      continue;
    }

    await filter.uncheck();
  }
};

const assignTask = async (page: Page, oppgave: Oppgave) => {
  await page.goto(`${ROOT_URL}/oppgaver/1`);

  await setFilter(page, 'filter-type', oppgave.typeId);
  await setFilter(page, 'filter-ytelse', oppgave.ytelseId);
  await setFilter(page, 'filter-hjemler', oppgave.hjemmelId);

  for (;;) {
    const oppgaverRows = page.locator('[data-testid="oppgave-table-rows"][data-isfetching="false"]');
    await oppgaverRows.waitFor();

    const oppgaveRow = oppgaverRows.locator(`[data-testid=oppgave-table-row][data-klagebehandlingid="${oppgave.id}"]`);
    const visible = await oppgaveRow.isVisible();

    if (!visible) {
      const nextButton = page.locator('data-testid=page-next');

      const hasNextButton = await nextButton.isVisible();

      if (hasNextButton) {
        await page.click('data-testid=page-next');
        continue;
      }

      throw new Error(`Oppgave "${oppgave.id}" not found.`);
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
