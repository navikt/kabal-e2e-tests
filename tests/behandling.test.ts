import { expect } from '@playwright/test';
import { test } from '../fixtures/behandling/fixture';
import { AnkebehandlingPage, KlagebehandlingPage } from '../fixtures/behandling/page';

test.describe('Tildelt klagebehandling', () => {
  test('Saksbehandler kan endre utfall', ({ klagebehandling }) => changeUtfall(klagebehandling));

  test('Saksbehandler kan endre hjemmel', ({ klagebehandling }) => changeHjemmel(klagebehandling));

  test('Saksbehandler kan endre medunderskriver', ({ klagebehandling }) => changeMedunderskriver(klagebehandling));

  test('Skal vise feilmelding når en behandling uten utfall/resultat ferdigstilles', ({ klagebehandling }) =>
    showErrors(klagebehandling));
});

test.describe('Tildelt ankebehandling', () => {
  test(`Saksbehandler kan endre utfall`, ({ ankebehandling }) => changeUtfall(ankebehandling));

  test('Saksbehandler kan endre hjemmel', ({ ankebehandling }) => changeHjemmel(ankebehandling));

  test('Saksbehandler kan endre medunderskriver', ({ ankebehandling }) => changeMedunderskriver(ankebehandling));

  test('Skal vise feilmelding når en behandling uten utfall/resultat ferdigstilles', ({ ankebehandling }) =>
    showErrors(ankebehandling));
});

const changeUtfall = async (behandling: AnkebehandlingPage | KlagebehandlingPage) => {
  const { page } = behandling;

  const select = page.locator('data-testid=select-utfall');
  await select.scrollIntoViewIfNeeded();

  await page.waitForSelector('[data-testid="select-utfall"][data-ready="true"]');
  await select.selectOption({ label: 'Medhold' });
  await page.waitForTimeout(200);

  await page.reload();
  await select.scrollIntoViewIfNeeded();

  await page.waitForSelector('[data-testid="select-utfall"][data-ready="true"]');
  const selected = await select.inputValue();

  expect(selected).toBe('4');
};

const changeHjemmel = async (behandling: AnkebehandlingPage | KlagebehandlingPage) => {
  const { page } = behandling;

  await page.click('data-testid=lovhjemmel-button');

  await page.fill('data-testid=dropdown-search', 'første ledd første');
  const lovkildeList = page.locator('data-testid=lovhjemmel-dropdown-list >> ul');
  const hjemmelList = page.locator('data-testid=Folketrygdloven-option-list >> li');
  await hjemmelList.scrollIntoViewIfNeeded();

  const hjemmel = await hjemmelList.first().textContent();

  const lovkildeCount = await lovkildeList.count();
  const hjemmelCount = await hjemmelList.count();

  expect(lovkildeCount).toBe(1);
  expect(hjemmelCount).toBe(1);
  expect(hjemmel).toBe('§ 22-15 første ledd første punktum');

  const checkbox = hjemmelList.locator('text=§ 22-15 første ledd første punktum');

  const checked = await checkbox.isChecked();
  await checkbox.setChecked(!checked);

  await page.waitForTimeout(200);
  await page.reload();
  await page.locator('data-testid=lovhjemmel-button').scrollIntoViewIfNeeded();

  await page.click('data-testid=lovhjemmel-button');
  const checkedAfterToggle = await checkbox.isChecked();

  expect(checkedAfterToggle).toBe(!checked);
};

const changeMedunderskriver = async (behandling: AnkebehandlingPage | KlagebehandlingPage) => {
  const { page } = behandling;

  const select = page.locator('data-testid=select-medunderskriver');
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

  const select = page.locator('data-testid=select-utfall');
  await select.scrollIntoViewIfNeeded();

  await select.selectOption({ index: 0 });
  await page.click('data-testid=complete-button');

  const ERROR_TEXT = 'Sett et utfall på vedtaket.';

  const summary = page.locator('data-testid=validation-summary');
  await summary.locator(`text="${ERROR_TEXT}"`).waitFor();

  const utfallSection = page.locator('data-testid=utfall-section');
  await utfallSection.locator(`text="${ERROR_TEXT}"`).waitFor();
};
