import { expect } from '@playwright/test';
import { test } from '../fixtures/behandling/fixture';
import { AnkebehandlingPage, KlagebehandlingPage } from '../fixtures/behandling/page';

test.describe('Klagebehandling', () => {
  test('Endre utfall', ({ klagebehandling }) => changeUtfall(klagebehandling));

  test('Endre hjemmel', ({ klagebehandling }) => changeHjemmel(klagebehandling));

  test('Endre medunderskriver', ({ klagebehandling }) => changeMedunderskriver(klagebehandling));

  test('Feilmelding når en behandling uten utfall ferdigstilles', ({ klagebehandling }) => showErrors(klagebehandling));
});

test.describe('Ankebehandling', () => {
  test(`Endre utfall`, ({ ankebehandling }) => changeUtfall(ankebehandling));

  test('Endre hjemmel', ({ ankebehandling }) => changeHjemmel(ankebehandling));

  test('Endre medunderskriver', ({ ankebehandling }) => changeMedunderskriver(ankebehandling));

  test('Feilmelding når en behandling uten utfall ferdigstilles', ({ ankebehandling }) => showErrors(ankebehandling));
});

const changeUtfall = async (behandling: AnkebehandlingPage | KlagebehandlingPage) => {
  const { page } = behandling;

  const select = page.getByTestId('select-utfall');
  await select.scrollIntoViewIfNeeded();

  await page.locator('[data-testid="select-utfall"][data-ready="true"]').waitFor();
  await select.selectOption({ label: 'Medhold' });
  await page.waitForTimeout(200);

  await page.reload();
  await select.scrollIntoViewIfNeeded();

  await page.locator('[data-testid="select-utfall"][data-ready="true"]').waitFor();
  const selected = await select.inputValue();

  expect(selected).toBe('4');
};

const changeHjemmel = async (behandling: AnkebehandlingPage | KlagebehandlingPage) => {
  const { page } = behandling;

  const lovhjemmelSelect = page.getByTestId('lovhjemmel-select');
  await lovhjemmelSelect.getByTestId('lovhjemmel-button').click();
  const filterText = 'første ledd første';
  await lovhjemmelSelect.getByTestId('header-filter').fill(filterText);

  const lovkildeList = lovhjemmelSelect.getByTestId('group-filter-list');
  const hjemmelList = lovkildeList.getByTestId('filter-list');

  const firstHjemmelList = hjemmelList.first();
  await firstHjemmelList.scrollIntoViewIfNeeded();

  const hjemler = firstHjemmelList.getByTestId('filter-list-item');
  const firstHjemmel = hjemler.first();

  const filterId = await firstHjemmel.getAttribute('data-filterid');

  if (filterId === null) {
    expect(filterId).not.toBeNull();
    return;
  }

  const hjemmelText = await firstHjemmel.textContent();

  const lovkildeCount = await lovkildeList.count();
  const hjemmelCount = await hjemmelList.count();

  expect(lovkildeCount).toBe(1);
  expect(hjemmelCount).toBe(1);
  expect(hjemmelText).toMatch(filterText);

  const checkbox = firstHjemmelList.locator(`[data-testid=filter][data-filterid="${filterId}"]`);

  const checked = await checkbox.isChecked();
  await checkbox.setChecked(!checked);

  await page.waitForTimeout(200);
  await page.reload();

  const lovhjemmelButton = page.getByTestId('lovhjemmel-button');
  await lovhjemmelButton.scrollIntoViewIfNeeded();
  await lovhjemmelButton.click();

  const checkedAfterToggle = await checkbox.isChecked();

  expect(checkedAfterToggle).toBe(!checked);
};

const changeMedunderskriver = async (behandling: AnkebehandlingPage | KlagebehandlingPage) => {
  const { page } = behandling;

  const select = page.getByTestId('select-medunderskriver');
  await select.scrollIntoViewIfNeeded();

  const [, secondValue] = await select
    .locator('option')
    .evaluateAll<string[], HTMLOptionElement>((options) => options.map((option) => option.value));

  await select.selectOption({ value: secondValue });

  await page.waitForTimeout(200);
  await page.reload();
  await select.scrollIntoViewIfNeeded();

  const selected = await select.inputValue();

  expect(selected).toBe(secondValue);
};

const showErrors = async (behandling: AnkebehandlingPage | KlagebehandlingPage) => {
  const { page } = behandling;

  const select = page.getByTestId('select-utfall');
  await select.scrollIntoViewIfNeeded();

  await select.selectOption({ index: 0 });
  await page.click('data-testid=complete-button');

  const ERROR_TEXT = 'Sett et utfall på vedtaket.';

  const summary = page.getByTestId('validation-summary');
  await summary.locator(`text="${ERROR_TEXT}"`).waitFor();

  const utfallSection = page.getByTestId('utfall-section');
  await utfallSection.locator(`text="${ERROR_TEXT}"`).waitFor();
};
