import { expect } from '@playwright/test';
import { test } from '@/fixtures/behandling/fixture';
import { getSaksnummer } from '@/fixtures/behandling/regions';
import { SUBMIT_SHORTCUT } from '@/tests/helpers';
import { FULLMEKTIG_DATA, KLAGER_DATA, SAKEN_GJELDER_DATA } from '@/tests/users';

test.describe('Smart editor', () => {
  test('Klagevedtak', async ({ klagebehandling }) => {
    const { page, behandling } = klagebehandling;
    const smartEditor = await behandling.initSmartEditor('Vedtak/beslutning (klage)');

    await test.step('Topptekst', async () => {
      const header = smartEditor.locator('[data-element="header"]');

      await expect(header).toHaveText('Returadresse: Klageinstans Oslo, Postboks 7028 St. Olavs plass, 0130 Oslo');
    });

    await test.step('Bunntekst', async () => {
      const footer = smartEditor.locator('[data-element="footer"]');

      await expect(footer).toHaveText(
        'Postadresse: Klageinstans Oslo // Postboks 7028 St. Olavs plass // 0130 Oslo // Telefon: 55 55 33 33 // nav.no',
      );
    });

    await test.step('Parter og saksnummer', async () => {
      const saksnummer = await getSaksnummer(page).getByRole('button').textContent();

      await expect(smartEditor.getByText(`Saken gjelder: ${SAKEN_GJELDER_DATA.name}`)).toBeVisible();
      await expect(smartEditor.getByText(`Fødselsnummer: ${SAKEN_GJELDER_DATA.id}`)).toBeVisible();
      await expect(smartEditor.getByText(`Klager: ${KLAGER_DATA.name}`)).toBeVisible();

      const fullmektigElement = smartEditor.locator('[data-element="fullmektig"]');
      await expect(fullmektigElement.getByText('Fullmektig')).toBeVisible();
      await expect(fullmektigElement.getByText(FULLMEKTIG_DATA.name)).toBeVisible();
      await expect(smartEditor.getByText(`Saksnummer: ${saksnummer}`)).toBeVisible();
    });

    await test.step('Sett utfall', async () => {
      await expect(smartEditor.getByText(`Avgjørelse${NO_MALTEKSTSEKSJON_TEXT}`)).toBeVisible();
      await expect(smartEditor.getByText(`Ankeinfo${NO_MALTEKSTSEKSJON_TEXT}`)).toBeVisible();
      await expect(smartEditor.getByText(`Sakskostnader${NO_MALTEKSTSEKSJON_TEXT}`)).toBeVisible();

      await expect(smartEditor.getByText('Derfor har vi omgjort vedtaket.')).not.toBeVisible();
      await expect(smartEditor.getByText('Du har rett til å anke')).not.toBeVisible();
      await expect(smartEditor.getByText('Informasjon om dekning av sakskostnader')).not.toBeVisible();

      const utfallButton = page.getByRole('button', { name: 'Utfall/resultat', exact: true });
      await utfallButton.waitFor();
      await utfallButton.click();
      // Retry click if dropdown doesn't open (timing issue)
      const listbox = page.getByRole('listbox');
      try {
        await listbox.waitFor({ timeout: 3000 });
      } catch {
        await utfallButton.click();
        await listbox.waitFor();
      }
      await page.getByRole('option', { name: 'Medhold', exact: true }).click();

      await expect(smartEditor.getByText(`Avgjørelse${NO_MALTEKSTSEKSJON_TEXT}`)).not.toBeVisible();
      await expect(smartEditor.getByText(`Ankeinfo${NO_MALTEKSTSEKSJON_TEXT}`)).not.toBeVisible();
      await expect(smartEditor.getByText(`Sakskostnader${NO_MALTEKSTSEKSJON_TEXT}`)).not.toBeVisible();

      await expect(smartEditor.getByText('Derfor har vi omgjort vedtaket.')).toBeVisible();
      await expect(smartEditor.getByText('Du har rett til å anke')).toBeVisible();
      await expect(smartEditor.getByText('Informasjon om dekning av sakskostnader')).toBeVisible();
    });

    await test.step('Dokumenttittel', async () => {
      const maltekstseksjon = smartEditor
        .locator('div')
        .filter({ hasText: 'Klageinstans har fattet vedtak i klagesaken din' });

      await expect(maltekstseksjon.getByText('Klageinstans har fattet vedtak i klagesaken din')).toBeVisible();
    });

    await test.step('Introduksjon: Oppdatere innfyllingsfelter', async () => {
      const maltekstseksjon = smartEditor
        .locator('div')
        .filter({ has: page.locator('[data-raw-placeholder="dato"]') })
        .first();

      await maltekstseksjon.locator('[data-raw-placeholder="dato"]').first().click();
      await page.keyboard.type('13/37-1337');
      await page.keyboard.press('ControlOrMeta+J');
      await page.keyboard.type('Vikafossen');
      await page.keyboard.press('ControlOrMeta+J');
      await page.keyboard.type('14/37-1337.');
      await page.keyboard.press('ControlOrMeta+J');
      await page.keyboard.type('Ønsker å få tilbake penger.');

      await expect(
        maltekstseksjon.getByText('Saken gjelder: Klagen din 13/37-1337 over Nav Vikafossen sitt vedtak 14/37-1337.'),
      ).toBeVisible();
      await expect(maltekstseksjon.getByText('Ønsker å få tilbake penger.')).toBeVisible();
    });

    await test.step('Avgjørelse: Slette innfyllingsfelter', async () => {
      const maltekstseksjon = smartEditor.locator('div').filter({ hasText: 'Derfor har vi omgjort vedtaket.' }).first();

      await maltekstseksjon
        .locator('[data-raw-placeholder*="Her formulerer du deg kortfattet og presist"]')
        .getByTitle('Slett innfyllingsfelt')
        .click();
      await maltekstseksjon.locator('[data-raw-placeholder="lov"]').getByTitle('Slett innfyllingsfelt').click();
      await maltekstseksjon.locator('[data-raw-placeholder="hjemmel"]').getByTitle('Slett innfyllingsfelt').click();

      await expect(maltekstseksjon.getByText('Vedtaket er gjort etter ')).toBeVisible();
      await expect(maltekstseksjon.getByText('og forvaltningsloven § 34.')).toBeVisible();
    });

    await test.step('Vurderingen: Fylle ut innfyllingsfelt', async () => {
      const maltekstseksjon = smartEditor
        .locator('div')
        .filter({ has: page.locator('[data-raw-placeholder*="Beskriv hovedpoengene"]') })
        .first();

      await maltekstseksjon.locator('[data-raw-placeholder*="Beskriv hovedpoengene"]').first().click();
      await page.keyboard.type('at du vil ha igjen masse penger.');

      await maltekstseksjon.locator('[data-raw-placeholder*="Forklar kort og presist"]').first().click();
      await page.keyboard.type('Reglene sier at du skal få igjen masse penger.');

      await maltekstseksjon.locator('[data-raw-placeholder*="fyll ut"]').first().click();
      await page.keyboard.type('kommet fram til at du får igjen masse penger!');

      await expect(maltekstseksjon.getByText('at du vil ha igjen masse penger.')).toBeVisible();
      await expect(maltekstseksjon.getByText('Reglene sier at du skal få igjen masse penger.')).toBeVisible();
      await expect(maltekstseksjon.getByText('kommet fram til at du får igjen masse penger!')).toBeVisible();
    });

    await test.step('Sett hjemmel', async () => {
      const container = page
        .locator('div')
        .filter({ hasText: 'Utfallet er basert på lovhjemmel' })
        .filter({ has: page.getByLabel('Hjemmel') });

      await page.getByText('Velg hjemler').click();

      const hjemmel = 'Folketrygdloven - § 8-9';

      await container.getByPlaceholder('Filtrer...').filter({ visible: true }).fill(hjemmel);

      const option = container.getByText(hjemmel);
      await option.click({ force: true });
      await option.press(SUBMIT_SHORTCUT);
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

      await expect(firstParagraph).toHaveText('Forvaltningsloven § 34:');

      const sixthParagraph = regelverk.locator('p').nth(5);
      await expect(sixthParagraph).toHaveText('Folketrygdloven § 8-9:');

      await expect(sistLagret).not.toHaveText(sistLagretText);
    });

    await test.step('Send ut', async () => {
      await page.waitForTimeout(1000);
      const newName = `Klagevedtak - ${new Date().toISOString()}`;

      await behandling.renameDocument('Klagevedtak', newName);
      await behandling.downloadPdf(newName);
      await behandling.finishAndVerifyDocument(newName);
    });
  });
});

const NO_MALTEKSTSEKSJON_TEXT = 'Velg utfall/resultat og hjemmel for å se tekst her.';
