import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { Behandling } from '@/fixtures/behandling/behandling';
import { test } from '@/fixtures/behandling/fixture';
import { getMainMenu } from '@/fixtures/regions';
import { findRow, getTable, setFilter } from '@/fixtures/table';
import { UI_DOMAIN } from '@/tests/functions';

const ASSIGNED_TOAST_REGEX = /er tildelt/;
const DEASSIGNED_TOAST_REGEX = /er lagt tilbake/;

test.describe('Tildeling/fradeling', () => {
  test('Tildele og fradele seg behandling', async ({ index }, testInfo) => {
    const behandling = await index.generateKlage();

    await index.page.goto(UI_DOMAIN);

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

const assignBehandling = async (page: Page, behandling: Behandling) => {
  await test.step('Naviger til "Oppgaver"', async () => {
    await getMainMenu(page).getByRole('link', { name: 'Oppgaver', exact: true }).click();
    await page.waitForURL('**/oppgaver');
  });

  await test.step('Sett filtere for ledige oppgaver', async () => {
    const table = getTable(page, 'Ledige oppgaver');
    await setFilter(table, 'Type', behandling.typeName);
    await setFilter(table, 'Ytelse', behandling.ytelseName);
    await setFilter(table, 'Hjemmel', behandling.getHjemmelName(), true);
    await table.body.waitFor();
  });

  await test.step(`Tildel behandling \`${behandling.id.substring(0, 8)}...\``, async () => {
    const table = getTable(page, 'Ledige oppgaver');
    const oppgaveRow = await findRow(table, behandling.id);
    await oppgaveRow.getByRole('button', { name: 'Tildel meg' }).click();
    await page.getByText(ASSIGNED_TOAST_REGEX).waitFor();
  });
};

const deAssignBehandling = async (page: Page, behandlingId: string) => {
  await test.step('Naviger til "Mine oppgaver"', async () => {
    await getMainMenu(page).getByRole('link', { name: 'Mine Oppgaver' }).click();
    await page.waitForURL('**/mineoppgaver');
  });

  await test.step(`Fradel behandling \`${behandlingId.substring(0, 8)}...\``, async () => {
    const table = getTable(page, 'Oppgaver under arbeid');
    const oppgaveRow = await findRow(table, behandlingId);

    // "Angre" button shows for ~10s after assignment, then "Legg tilbake" appears.
    const leggTilbakeButton = oppgaveRow.getByRole('button', { name: 'Legg tilbake' });
    await expect(leggTilbakeButton).toBeVisible({ timeout: 30_000 });
    await leggTilbakeButton.click();

    const popup = oppgaveRow.getByRole('dialog', { name: 'Legg tilbake oppgave' });
    await popup.getByText('Inhabil').click();
    await popup.getByText('Legg tilbake').click();

    await page.getByText(DEASSIGNED_TOAST_REGEX).waitFor();
  });
};
