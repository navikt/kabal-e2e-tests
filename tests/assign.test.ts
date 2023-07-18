import { Locator, Page, expect } from '@playwright/test';
import { Behandling } from '../fixtures/behandling/behandling';
import { test } from '../fixtures/behandling/fixture';
import { UI_DOMAIN } from './functions';

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
  const tableId = 'oppgave-table';

  await test.step('Naviger til "Oppgaver"', async () => {
    await page.getByTestId('oppgaver-nav-link').click();
    await page.getByTestId(tableId).waitFor();
    expect(page.url()).toBe(`${UI_DOMAIN}/oppgaver`);
  });

  await test.step('Sett filtere for ledige oppgaver', async () => {
    await setFilter(page, 'filter-type', behandling.typeId);
    await setFilter(page, 'filter-ytelse', behandling.ytelseId);
    await setFilter(page, 'filter-hjemler', behandling.hjemmelId);

    await page.locator(`[data-testid="${tableId}-rows"][data-state="ready"]`).waitFor();
  });

  await test.step(`Tildel behandling \`${behandling.id.substring(0, 8)}...\``, async () => {
    const oppgaveRow = await findOppgaveRow({
      page,
      tableId,
      behandlingId: behandling.id,
      mode: 'pagination',
    });
    await oppgaveRow?.getByTestId('behandling-tildel-button').click();
    await page.locator(`[data-testid="oppgave-tildelt-toast"][data-oppgaveid="${behandling.id}"]`).waitFor();
  });
};

const deAssignBehandling = async (page: Page, behandlingId: string) => {
  const tableId = 'mine-oppgaver-table';

  await test.step('Naviger til "Mine oppgaver"', async () => {
    await page.getByTestId('mine-oppgaver-nav-link').click();
    await page.getByTestId(tableId).waitFor();
    expect(page.url()).toBe(`${UI_DOMAIN}/mineoppgaver`);
  });

  await test.step(`Fradel behandling \`${behandlingId.substring(0, 8)}...\``, async () => {
    const oppgaveRow = await findOppgaveRow({ page, tableId, behandlingId, mode: 'all' });
    await oppgaveRow?.getByTestId('behandling-fradel-button').click();
    await page.locator(`[data-testid="oppgave-fradelt-toast"][data-oppgaveid="${behandlingId}"]`).waitFor();
  });
};

const setFilter = async (page: Page, filterName: string, value: string) => {
  const filterContainer = page.locator(`data-testid=${filterName}`);
  const filterToggleButton = filterContainer.locator('[data-testid="toggle-button"]');
  await filterToggleButton.click();

  const filterList = filterContainer.locator('[data-testid="filter-list"]');
  await filterList.waitFor();

  await filterList.locator(`[data-testid="filter"][data-filterid="${value}"]`).check();
  const filterItems = await filterList.locator(`[data-testid="filter"]`).all();

  for (const filterItem of filterItems) {
    const filterItemValue = await filterItem.getAttribute('data-filterid');

    if (filterItemValue !== value) {
      await filterItem.uncheck();
    }
  }

  await filterToggleButton.click();
};

interface IFindOppgaveRowOptions {
  page: Page;
  tableId: string;
  behandlingId: string;
  mode: 'all' | 'pagination';
}

const findOppgaveRow = async ({ page, tableId, mode, behandlingId }: IFindOppgaveRowOptions) => {
  const rows = page.locator(`[data-testid="${tableId}-rows"][data-state="ready"]`);
  await rows.waitFor();

  const emptyState = await rows.getAttribute('data-empty');

  if (emptyState === 'true') {
    throw new Error(`"${tableId}" table is marked as empty.`);
  }

  const findFn = mode === 'pagination' ? findOppgaveRowInPages : findOppgaveRowInAllPage;

  for (let tryCount = 0; tryCount < 3; tryCount++) {
    const row = await findFn(page, tableId, behandlingId);

    if (row !== null) {
      return row;
    }

    await refreshOppgaver(page, tableId);
  }

  throw new Error(`No behandling with ID "${behandlingId}" found in "${tableId}" table.`);
};

const refreshOppgaver = async (page: Page, tableId: string) => {
  const pagination = page.getByTestId(`${tableId}-footer-pagination`);
  const pageOneButton = pagination.locator('button[page="1"]').first();
  await pageOneButton.click();

  const refreshButton = page.getByTestId(`${tableId}-footer-refresh-button`).first();
  const updating = page.locator(`[data-testid="${tableId}-rows"][data-state="updating"]`);
  const ready = page.locator(`[data-testid="${tableId}-rows"][data-state="ready"]`);

  await refreshButton.click();
  await updating.waitFor();
  await ready.waitFor();
};

type FindFnType = (page: Page, tableId: string, behandlingId: string) => Promise<Locator | null>;

const ALWAYS = true;

const findOppgaveRowInPages: FindFnType = async (page, tableId, behandlingId) => {
  while (ALWAYS) {
    const row = await findOppgaveRowOnPage(page, tableId, behandlingId);

    if (row !== null) {
      return row;
    }

    const pagination = page.getByTestId(`${tableId}-footer-pagination`);
    const nextButton = pagination.locator('button[page]', { hasText: 'Neste' });

    const hasNextButton = await nextButton.isVisible();

    if (!hasNextButton) {
      return null;
    }

    await nextButton.click();
  }

  return null;
};

const findOppgaveRowInAllPage: FindFnType = async (page, tableId, behandlingId) => {
  const rowsPerPage = page.getByTestId(`${tableId}-footer-rows-per-page`);
  await rowsPerPage.locator('[data-value="-1"]').click();
  return findOppgaveRowOnPage(page, tableId, behandlingId);
};

const findOppgaveRowOnPage = async (page: Page, tableId: string, behandlingId: string) => {
  const row = page.locator(
    `[data-testid="${tableId}-rows-row"][data-behandlingid="${behandlingId}"][data-state="ready"]`
  );

  const count = await row.count();

  if (count === 0) {
    return null;
  }

  if (count > 1) {
    throw new Error(`More than one behandling with ID "${behandlingId}" found in "${tableId}" table.`);
  }

  return row;
};
