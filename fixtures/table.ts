import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { getRegion } from '@/fixtures/regions';
import { SUBMIT_SHORTCUT } from '@/tests/helpers';

/** Get table utilities scoped to a region with the given heading. */
export const getTable = (page: Page, heading: string | RegExp) => {
  const section = getRegion(page, heading);

  const table = section.getByRole('table');
  const header = table.locator('thead');
  const body = table.locator('tbody[aria-busy="false"]');
  const footer = table.locator('tfoot');
  const navigation = footer.getByRole('navigation');

  return {
    section,
    table,
    header,
    body,
    row: (behandlingId: string) => body.locator(`> tr[data-behandlingid="${behandlingId}"]`),
    pagination: {
      navigation,
      next: navigation.getByText('Neste'),
      previous: navigation.getByText('Forrige'),
      pageButton: (n: number) => navigation.getByText(n.toString(10), { exact: true }),
    },
    refresh: footer.getByLabel('Oppdater'),
  };
};

export type OppgaveTable = ReturnType<typeof getTable>;

/** Navigate through table pages looking for the target row. Returns true if found. */
export const navigateToPageWithRow = async (table: OppgaveTable, rowLocator: Locator): Promise<boolean> => {
  if ((await rowLocator.count()) > 0) {
    return true;
  }

  while (await table.pagination.next.isVisible()) {
    await table.pagination.next.click();
    await table.body.waitFor();

    if ((await rowLocator.count()) > 0) {
      return true;
    }
  }

  return false;
};

/** Refresh table data, going back to page 1 first if paginated. */
export const refreshTable = async (table: OppgaveTable) => {
  if (await table.pagination.navigation.isVisible()) {
    const firstPage = table.pagination.pageButton(1);

    if (await firstPage.isVisible()) {
      await firstPage.click();
      await table.body.waitFor();
    }
  }

  await table.refresh.click();
  await table.body.waitFor();
};

/** Set a filter dropdown value in a table header. */
export const setFilter = async (table: OppgaveTable, filterName: string, value: string, exact = false) => {
  const column = table.header.getByRole('columnheader', { name: filterName });
  await column.getByRole('button').click();

  await column.getByPlaceholder('Filtrer...').fill(value);
  const option = column.getByText(value, { exact });
  await option.click();
  await option.press(SUBMIT_SHORTCUT);
};

/** Poll for a specific row, paginating and refreshing until it appears or times out. */
export const findRow = async (table: OppgaveTable, behandlingId: string) => {
  const rowLocator = table.row(behandlingId);

  await expect(async () => {
    if (await rowLocator.first().isVisible()) {
      return;
    }

    const found = await navigateToPageWithRow(table, rowLocator);

    if (!found) {
      await refreshTable(table);
      await expect(rowLocator.first()).toBeVisible();
    }
  }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 5_000] });

  await expect(rowLocator).toHaveCount(1);

  return rowLocator;
};
