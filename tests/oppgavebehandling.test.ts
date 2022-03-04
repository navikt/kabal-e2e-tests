import { expect } from '@playwright/test';
import { test } from '../fixtures/oppgavebehandling/fixture';

test.describe('Tildelt oppgave', () => {
  test('Saksbehandler kan endre utfall', async ({ kabalPage }) => {
    const { page } = kabalPage;
    const oppgave = await kabalPage.generateKlage();
    await oppgave.assign();
    await oppgave.navigateTo();

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

    await oppgave.deAssign();
  });

  test('Saksbehandler kan endre hjemmel', async ({ kabalPage }) => {
    const { page } = kabalPage;
    const oppgave = await kabalPage.generateKlage();
    await oppgave.assign();
    await oppgave.navigateTo();

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

    await oppgave.deAssign();
  });

  test('Saksbehandler kan endre medunderskriver', async ({ kabalPage }) => {
    const { page } = kabalPage;
    const oppgave = await kabalPage.generateKlage();
    await oppgave.assign();
    await oppgave.navigateTo();

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

    await oppgave.deAssign();
  });

  test('Skal vise feilmelding når en behandling uten utfall/resultat ferdigstilles', async ({ kabalPage }) => {
    const { page } = kabalPage;
    const oppgave = await kabalPage.generateKlage();
    await oppgave.assign();
    await oppgave.navigateTo();

    const select = page.locator('data-testid=select-utfall');
    await select.scrollIntoViewIfNeeded();

    await select.selectOption({ index: 0 });
    await page.click('data-testid=complete-button');

    const ERROR_TEXT = 'Sett et utfall på vedtaket.';

    const summary = page.locator('data-testid=validation-summary');
    await summary.locator(`text="${ERROR_TEXT}"`).waitFor();

    const utfallSection = page.locator('data-testid=utfall-section');
    await utfallSection.locator(`text="${ERROR_TEXT}"`).waitFor();

    await oppgave.deAssign();
  });
});
