import type { Locator, Page } from '@playwright/test';
import type { Behandling } from '@/fixtures/behandling/behandling';
import { test } from '@/fixtures/behandling/fixture';
import { UI_DOMAIN } from '@/tests/functions';
import { SUBMIT_SHORTCUT } from '@/tests/helpers';

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
    await page.getByRole('link', { name: 'Oppgaver', exact: true }).click();
    await page.waitForURL('**/oppgaver');
  });

  await test.step('Sett filtere for ledige oppgaver', async () => {
    await setFilter(page, 'Type', behandling.typeName);
    await setFilter(page, 'Ytelse', behandling.ytelseName);
    await setFilter(page, 'Hjemmel', behandling.getHjemmelName(), true);

    await page.locator('tbody[aria-busy="false"]').waitFor();
  });

  await test.step(`Tildel behandling \`${behandling.id.substring(0, 8)}...\``, async () => {
    const oppgaveRow = await findOppgaveRow({ page, behandlingId: behandling.id });
    await oppgaveRow.getByRole('button', { name: 'Tildel meg' }).click();
    await page.getByText(ASSIGNED_TOAST_REGEX).waitFor();
  });
};

const deAssignBehandling = async (page: Page, behandlingId: string) => {
  await test.step('Naviger til "Mine oppgaver"', async () => {
    await page.getByRole('link', { name: 'Mine Oppgaver' }).click();
    await page.waitForURL('**/mineoppgaver');
  });

  await test.step(`Fradel behandling \`${behandlingId.substring(0, 8)}...\``, async () => {
    const oppgaveRow = await findOppgaveRow({ page, behandlingId });

    // Angre button replaces fradel button the first 10 seconds
    await oppgaveRow.getByRole('button').getByText('Legg tilbake').click({ timeout: 20_000 });

    await oppgaveRow.getByText('Inhabil').click();
    await oppgaveRow.locator('[aria-label="Legg tilbake oppgave"]').getByText('Legg tilbake').click();

    await page.getByText(DEASSIGNED_TOAST_REGEX).waitFor();
  });
};

const setFilter = async (page: Page, filterName: string, value: string, exact = false) => {
  const filterButton = page.getByRole('button', { name: filterName }).first();
  await filterButton.click();
  const parent = filterButton.locator('..');

  await parent.getByPlaceholder('Filtrer...').fill(value);
  const option = parent.getByText(value, { exact });
  await option.click();
  await option.press(SUBMIT_SHORTCUT);
};

interface IFindOppgaveRowOptions {
  page: Page;
  behandlingId: string;
}

const findOppgaveRow = async ({ page, behandlingId }: IFindOppgaveRowOptions) => {
  const tableBody = page.locator('tbody[aria-busy="false"]').first();
  await tableBody.waitFor();

  const rows = tableBody.getByRole('row');
  const rowCount = await rows.count();

  if (rowCount === 0) {
    throw new Error('Table has no rows.');
  }

  for (let tryCount = 0; tryCount < 3; tryCount++) {
    const row = await findOppgaveRowInPages(page, behandlingId);

    if (row !== null) {
      return row;
    }

    await refreshOppgaver(page);
  }

  throw new Error(`No behandling with ID "${behandlingId}" found in table.`);
};

const refreshOppgaver = async (page: Page) => {
  const pagination = page.getByRole('navigation').filter({ hasText: 'Neste' });

  if (await pagination.isVisible()) {
    const firstPageButton = pagination.locator('button[page="1"]').first();

    if (await firstPageButton.isVisible()) {
      await firstPageButton.click();
      await page.locator('tbody[aria-busy="false"]').first().waitFor();
    }
  }

  const refreshButton = page.getByRole('button', { name: 'Oppdater' }).first();
  await refreshButton.click();
  await page.locator('tbody[aria-busy="false"]').first().waitFor();
};

type FindFnType = (page: Page, behandlingId: string) => Promise<Locator | null>;

const ALWAYS = true;

const findOppgaveRowInPages: FindFnType = async (page, behandlingId) => {
  while (ALWAYS) {
    const row = await findOppgaveRowOnPage(page, behandlingId);

    if (row !== null) {
      return row;
    }

    const nextButton = page.getByRole('navigation').filter({ hasText: 'Neste' }).getByText('Neste');

    const hasNextButton = await nextButton.isVisible();

    if (!hasNextButton) {
      return null;
    }

    await nextButton.click();
  }

  return null;
};

const findOppgaveRowOnPage = async (page: Page, behandlingId: string) => {
  const row = page.locator('tbody[aria-busy="false"]').first().locator(`tr[data-behandlingid="${behandlingId}"]`);

  const count = await row.count();

  if (count === 0) {
    return null;
  }

  return row.first();
};
