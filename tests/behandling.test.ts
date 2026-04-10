import { expect } from '@playwright/test';
import { test } from '@/fixtures/behandling/fixture';
import type { AnkebehandlingPage, KlagebehandlingPage } from '@/fixtures/behandling/page';
import { getUtfallResultat } from '@/fixtures/behandling/regions';
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

  const container = getUtfallResultat(page);

  const utfallButton = container.getByRole('button', { name: 'Utfall/resultat', exact: true });
  await utfallButton.click();
  await page.getByRole('listbox').waitFor();
  const requestPromise = page.waitForRequest('**/behandlinger/**/resultat/utfall');
  await page.getByRole('option', { name: 'Medhold', exact: true }).click();
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

  const utfallButton = page.getByRole('button', { name: 'Utfall/resultat', exact: true });
  await utfallButton.click();
  await page.getByRole('listbox').waitFor();
  await page.getByRole('option', { name: 'Ikke valgt' }).click();

  await page.getByRole('button', { name: 'Fullfør' }).click();

  const ERROR_TEXT = 'Sett et utfall på saken.';

  await page.getByRole('heading', { name: 'Kan ikke fullføre behandlingen' }).waitFor();
  await page.getByRole('listitem').filter({ hasText: ERROR_TEXT }).waitFor();

  const utfallSection = getUtfallResultat(page);
  await utfallSection.getByText(ERROR_TEXT).waitFor();
};
