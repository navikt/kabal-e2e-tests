import { Page } from '@playwright/test';
import { Behandling } from '../fixtures/behandling/behandling';
import { test } from '../fixtures/behandling/fixture';
import { UI_DOMAIN } from './functions';

test.describe('Tildeling/fradeling', () => {
  test('Saksbehandler kan tildele og fradele seg behandling', async ({ index }, testInfo) => {
    const behandling = await index.generateKlage();

    await assignBehandling(index.page, behandling);
    await deAssignBehandling(index.page, behandling.id);

    try {
      await behandling.delete();
    } catch (error) {
      if (error instanceof Error) {
        testInfo.attach('warningMessage', {
          body: `Behandling with ID "${behandling.id}" was not deleted.\n\nError message:\n${error.message}`,
          contentType: 'text/plain',
        });
      } else {
        testInfo.attach('warningMessage', {
          body: `Behandling with ID "${behandling.id}" was not deleted.`,
          contentType: 'text/plain',
        });
      }
    }
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

const assignBehandling = async (page: Page, behandling: Behandling) => {
  await test.step(`Tildel behandling \`${behandling.id}\``, async () => {
    await page.goto(`${UI_DOMAIN}/oppgaver/1`);

    await test.step('Sett filtere for ledige oppgaver', async () => {
      await setFilter(page, 'filter-type', behandling.typeId);
      await setFilter(page, 'filter-ytelse', behandling.ytelseId);
      await setFilter(page, 'filter-hjemler', behandling.hjemmelId);
    });

    for (;;) {
      const behandlingerRows = page.locator('[data-testid="oppgave-table-rows"][data-isfetching="false"]');
      await behandlingerRows.waitFor();

      const behandlingRow = behandlingerRows.locator(
        `[data-testid=oppgave-table-row][data-klagebehandlingid="${behandling.id}"]`
      );
      const visible = await behandlingRow.isVisible();

      if (!visible) {
        const nextButton = page.locator('data-testid=page-next');

        const hasNextButton = await nextButton.isVisible();

        if (hasNextButton) {
          await page.click('data-testid=page-next');
          continue;
        }

        throw new Error(`Oppgave "${behandling.id}" not found.`);
      } else {
        await behandlingRow.locator('data-testid=klagebehandling-tildel-button').click();
        await behandlingRow.locator('data-testid=oppgave-tildel-success').waitFor();

        return;
      }
    }
  });
};

const deAssignBehandling = async (page: Page, behandlingId: string) => {
  await test.step(`Fradel behandling \`${behandlingId}\``, async () => {
    await page.goto(`${UI_DOMAIN}/mineoppgaver`);

    await page.waitForSelector('data-testid=mine-oppgaver-table-rows');

    const mineOppgaverRow = page.locator(`[data-testid="mine-oppgaver-row"][data-klagebehandlingid="${behandlingId}"]`);

    const count = await mineOppgaverRow.count();

    if (count === 0) {
      throw new Error(`No behandling with ID "${behandlingId}" found in "Mine Oppgaver" table.`);
    }

    if (count > 1) {
      throw new Error(`More than one behandling with ID "${behandlingId}" found in "Mine Oppgaver" table.`);
    }

    await mineOppgaverRow.locator('data-testid=klagebehandling-fradel-button').click();
    await mineOppgaverRow.locator('data-testid=oppgave-fradel-success').waitFor();
  });
};
