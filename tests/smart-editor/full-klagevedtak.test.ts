import { expect } from 'playwright/test';
import { test } from '../../fixtures/behandling/fixture';
import { UtfallLabel } from '../../fixtures/behandling/types';
import { FULLMEKTIG_DATA, KLAGER_DATA, SAKEN_GJELDER_DATA } from '../users';

test.describe('Smart editor', () => {
  test('Klagevedtak', async ({ klagebehandling }) => {
    const { page, behandling } = klagebehandling;
    const smartEditor = await behandling.initSmartEditor('Vedtak/beslutning (klage)');

    await test.step('Topptekst', () => {
      const header = smartEditor.locator('[data-element="header"]');

      expect(header).toHaveText(
        'Returadresse: Nav klageinstans Oslo og Akershus, Postboks 7028 St. Olavs plass, 0130 Oslo',
      );
    });

    await test.step('Bunntekst', () => {
      const footer = smartEditor.locator('[data-element="footer"]');

      expect(footer).toHaveText(
        'Postadresse: Nav klageinstans Oslo og Akershus // Postboks 7028 St. Olavs plass // 0130 Oslo\nTelefon: 55 55 33 33\nnav.no',
      );
    });

    await test.step('Dokumenttittel', () => {
      const maltekstseksjon = smartEditor.locator('[data-element="maltekstseksjon"][data-section="section-esel"]');

      expect(maltekstseksjon.getByText('Nav klageinstans har behandlet klagen din')).toBeVisible();
    });

    await test.step('Parter og saksnummer', async () => {
      const saksnummer = await page.locator('#behandling-section-saksnummer').getByRole('button').textContent();

      expect(smartEditor.getByText(`Saken gjelder: ${SAKEN_GJELDER_DATA.name}`)).toBeVisible();
      expect(smartEditor.getByText(`Fødselsnummer: ${SAKEN_GJELDER_DATA.id}`)).toBeVisible();
      expect(smartEditor.getByText(`Klager: ${KLAGER_DATA.name}`)).toBeVisible();
      expect(smartEditor.getByText(`Fullmektig: ${FULLMEKTIG_DATA.name}`)).toBeVisible();
      expect(smartEditor.getByText(`Saksnummer: ${saksnummer}`)).toBeVisible();
    });

    await test.step('Sett utfall', async () => {
      expect(smartEditor.getByText(`Avgjørelse${NO_MALTEKSTSEKSJON_TEXT}`)).toBeVisible();
      expect(smartEditor.getByText(`Ankeinfo${NO_MALTEKSTSEKSJON_TEXT}`)).toBeVisible();
      expect(smartEditor.getByText(`Sakskostnader${NO_MALTEKSTSEKSJON_TEXT}`)).toBeVisible();

      expect(smartEditor.getByText('Vi har omgjort vedtaket, slik at')).not.toBeVisible();
      expect(smartEditor.getByText('Du har rett til å anke')).not.toBeVisible();
      expect(smartEditor.getByText('Informasjon om dekning av sakskostnader')).not.toBeVisible();

      await page.getByLabel('Utfall/resultat', { exact: true }).selectOption({ label: UtfallLabel.MEDHOLD });

      expect(smartEditor.getByText(`Avgjørelse${NO_MALTEKSTSEKSJON_TEXT}`)).not.toBeVisible();
      expect(smartEditor.getByText(`Ankeinfo${NO_MALTEKSTSEKSJON_TEXT}`)).not.toBeVisible();
      expect(smartEditor.getByText(`Sakskostnader${NO_MALTEKSTSEKSJON_TEXT}`)).not.toBeVisible();

      expect(smartEditor.getByText('Vi har omgjort vedtaket, slik at')).toBeVisible();
      expect(smartEditor.getByText('Du har rett til å anke')).toBeVisible();
      expect(smartEditor.getByText('Informasjon om dekning av sakskostnader')).toBeVisible();
    });

    await test.step('Introduksjon: Oppdatere innfyllingsfelter', async () => {
      const maltekstseksjon = smartEditor.locator('[data-element="maltekstseksjon"][data-section="section-rev-v2"]');

      await maltekstseksjon.locator('[data-placeholder="dato"]').first().click();
      await page.keyboard.type('13/37-1337');
      await page.keyboard.press('ControlOrMeta+J');
      await page.keyboard.type('Vikafossen');
      await page.keyboard.press('ControlOrMeta+J');
      await page.keyboard.type('14/37-1337.');
      await page.keyboard.press('ControlOrMeta+J');
      await page.keyboard.type('du kan få tilbake penger.');

      expect(
        maltekstseksjon.getByText(
          'Saken gjelder: Klagen din av 13/37-1337 over Nav Vikafossen sitt vedtak av 14/37-1337.',
        ),
      ).toBeVisible();
      expect(maltekstseksjon.getByText('Om du kan få tilbake penger.')).toBeVisible();
    });

    await test.step('Avgjørelse: Slette innfyllingsfelter', async () => {
      const maltekstseksjon = smartEditor.locator('[data-element="maltekstseksjon"][data-section="section-mår"]');

      await maltekstseksjon.locator('[data-placeholder="fyll ut"]').getByTitle('Slett innfyllingsfelt').click();
      await maltekstseksjon.locator('[data-placeholder="lov"]').getByTitle('Slett innfyllingsfelt').click();
      await maltekstseksjon.locator('[data-placeholder="hjemmel"]').getByTitle('Slett innfyllingsfelt').click();

      expect(maltekstseksjon.getByText('Vi har omgjort vedtaket, slik at .')).toBeVisible();
      expect(maltekstseksjon.getByText('Vedtaket er gjort etter  § .')).toBeVisible();
      expect(maltekstseksjon.getByText('Se vedlegg for regelverket som gjelder for saken. ')).toBeVisible();
    });

    await test.step('Anførsler: Skrive i redigerbar maltekst', async () => {
      const maltekstseksjon = smartEditor.locator('[data-element="maltekstseksjon"][data-section="section-ulv"]');

      await maltekstseksjon.locator('li').first().click();
      await page.keyboard.type('Alt som er feil');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Alt som ikke er riktig');

      const list = maltekstseksjon.locator('ul');
      const item1 = list.locator('li').nth(0);
      const item2 = list.locator('li').nth(1);

      expect(await item1.textContent()).toBe('Alt som er feil');
      expect(await item2.textContent()).toBe('Alt som ikke er riktig');
    });

    await test.step('Vurderingen: Fylle ut innfyllingsfelt', async () => {
      const maltekstseksjon = smartEditor.locator('[data-element="maltekstseksjon"][data-section="section-mus"]');

      await maltekstseksjon.locator('[data-placeholder="fyll ut/vis tilbake til konklusjonen øverst"]').first().click();
      await page.keyboard.type('får igjen masse penger!');

      expect(maltekstseksjon.getByText('Derfor har vi kommet fram til at du får igjen masse penger!')).toBeVisible();
    });

    await test.step('Sett hjemmel', async () => {
      await page.getByTestId('lovhjemmel-button').click();
      const folketrygdloven = page.locator('li[data-groupname="Folketrygdloven"]');
      await folketrygdloven.getByText('§ 2-14').click();
    });

    await test.step('Sett inn regelverk', async () => {
      const regelverk = smartEditor
        .locator('[data-slate-node="element"]')
        .filter({ hasText: 'Regelverket som gjelder i saken' });
      const firstParagraph = regelverk.locator('p').first();

      const sistLagret = page.locator('span').filter({ hasText: 'Sist lagret' });
      const sistLagretText = (await sistLagret.textContent()) ?? '';

      await firstParagraph.click();

      const button = regelverk.getByLabel('Oppdater regelverk');
      await button.scrollIntoViewIfNeeded();

      await firstParagraph.hover();

      await button.click();

      expect(firstParagraph).toHaveText('Folketrygdloven § 2-14');

      await expect(sistLagret).not.toHaveText(sistLagretText);
    });

    await test.step('Send ut', async () => {
      const newName = `Klagevedtak - ${new Date().toISOString()}`;

      await behandling.renameDocument('Klagevedtak', newName);
      await behandling.finishAndVerifyDocument(newName);
    });
  });
});

const NO_MALTEKSTSEKSJON_TEXT = 'Velg utfall/resultat og hjemmel for å se tekst her.';
