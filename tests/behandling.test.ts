import { expect } from '@playwright/test';
import { test } from '@/fixtures/behandling/fixture';
import type { AnkebehandlingPage, KlagebehandlingPage } from '@/fixtures/behandling/page';
import { UtfallLabel } from '@/fixtures/behandling/types';
import { finishedRequest, SUBMIT_SHORTCUT } from '@/tests/helpers';

const MEDUNDERSKRIVER_NAME = /F_Z994864 E_Z994864/;

test.describe('Klagebehandling', () => {
  test('Endre utfall', ({ klagebehandling }) => changeUtfall(klagebehandling));

  test('Endre hjemmel', ({ klagebehandling }) => changeHjemmel(klagebehandling));

  test('Endre medunderskriver', ({ klagebehandling }) => changeMedunderskriver(klagebehandling));

  test('Feilmelding når en behandling uten utfall ferdigstilles', ({ klagebehandling }) => showErrors(klagebehandling));
});

test.describe('Ankebehandling', () => {
  test('Endre utfall', ({ ankebehandling }) => changeUtfall(ankebehandling));

  test('Endre hjemmel', ({ ankebehandling }) => changeHjemmel(ankebehandling));

  test('Endre medunderskriver', ({ ankebehandling }) => changeMedunderskriver(ankebehandling));

  test('Feilmelding når en behandling uten utfall ferdigstilles', ({ ankebehandling }) => showErrors(ankebehandling));
});

const changeUtfall = async (behandling: AnkebehandlingPage | KlagebehandlingPage) => {
  const { page } = behandling;

  const container = page.getByTestId('utfall-section');

  await container.getByText(UtfallLabel.IKKE_VALGT).click();
  const requestPromise = page.waitForRequest('**/behandlinger/**/resultat/utfall');
  await container.getByText(UtfallLabel.MEDHOLD, { exact: true }).click();
  await finishedRequest(requestPromise);

  await page.reload();

  await expect(container.getByText(UtfallLabel.MEDHOLD)).toBeVisible();
};

const changeHjemmel = async (behandling: AnkebehandlingPage | KlagebehandlingPage) => {
  const { page } = behandling;

  const container = page.getByLabel('Hjemmel').locator('..');

  const hjemmelName = 'Folketrygdloven - § 22-15 første ledd første punktum';

  await page.getByText('Velg hjemler').waitFor({ state: 'visible' });
  await page.getByText('Velg hjemler').click();

  await container.getByPlaceholder('Filtrer...').fill('første ledd første');
  const option = container.getByText(hjemmelName);
  const promise = page.waitForRequest('**/behandlinger/**/resultat/hjemler');
  await option.click();
  await option.press(SUBMIT_SHORTCUT);
  await finishedRequest(promise);

  await page.reload();

  await expect(page.getByText(hjemmelName)).toBeVisible();
};

const changeMedunderskriver = async (behandling: AnkebehandlingPage | KlagebehandlingPage) => {
  const { page } = behandling;

  const container = page.getByLabel('Medunderskriver').locator('..');
  await container.getByText('Ingen', { exact: true }).click();

  const identPromise = page.waitForRequest('**/behandlinger/**/medunderskrivernavident');
  const flowPromise = page.waitForRequest('**/behandlinger/**/medunderskriverflowstate');

  await container.getByText(MEDUNDERSKRIVER_NAME).click();
  await container.getByRole('button', { name: 'Send til medunderskriver' }).click();

  await finishedRequest(identPromise);
  await finishedRequest(flowPromise);

  await page.reload();

  await expect(container.getByText('F_Z994864 E_Z994864', { exact: true })).toBeVisible();
};

const showErrors = async (behandling: AnkebehandlingPage | KlagebehandlingPage) => {
  const { page } = behandling;

  const container = page.getByLabel('Utfall/resultat').locator('..');
  await container.getByRole('button').click();

  await container.getByRole('option').getByText(UtfallLabel.IKKE_VALGT).click();

  await page.click('data-testid=complete-button');

  const ERROR_TEXT = 'Sett et utfall på saken.';

  const summary = page.getByTestId('validation-summary');
  await summary.locator(`text="${ERROR_TEXT}"`).waitFor();

  const utfallSection = page.getByTestId('utfall-section');
  await utfallSection.locator(`text="${ERROR_TEXT}"`).waitFor();
};
