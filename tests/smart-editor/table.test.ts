import { expect } from 'playwright/test';
import { test } from '../../fixtures/behandling/fixture';

test.describe('Smart editor -Tabell', () => {
  test('Enkel innfylling', async ({ page, klagebehandling }) => {
    const smartEditor = await klagebehandling.behandling.initSmartEditor('Generelt brev');

    const p = smartEditor.locator('.slate-p').last();
    await p.click();

    await page.getByLabel('Sett inn tabell').click();

    const table = smartEditor.locator('table');
    const row1 = table.locator('tr').nth(0);
    const row2 = table.locator('tr').nth(1);

    const a1 = row1.locator('td').nth(0);
    const a2 = row1.locator('td').nth(1);
    const b1 = row2.locator('td').nth(0);
    const b2 = row2.locator('td').nth(1);

    await a1.click();
    await a1.fill('A1');
    await page.keyboard.press('Tab');
    await a2.fill('A2');
    await page.keyboard.press('Tab');
    await b1.fill('B1');
    await page.keyboard.press('Tab');
    await b2.fill('B2');

    expect(await table.locator('tr').count()).toBe(2);
    expect(await row1.locator('td').count()).toBe(2);
    expect(await row2.locator('td').count()).toBe(2);

    expect(await a1.textContent()).toBe('A1');
    expect(await a2.textContent()).toBe('A2');
    expect(await b1.textContent()).toBe('B1');
    expect(await b2.textContent()).toBe('B2');
  });

  test('Manipulering av rader', async ({ page, klagebehandling }) => {
    const smartEditor = await klagebehandling.behandling.initSmartEditor('Generelt brev');

    const p = smartEditor.locator('.slate-p').last();
    await p.click();

    await page.getByLabel('Sett inn tabell').click();

    const table = smartEditor.locator('table');
    const row1 = table.locator('tr').nth(0);
    const row2 = table.locator('tr').nth(1);
    const row3 = table.locator('tr').nth(2);

    const a1 = row1.locator('td').nth(0);
    const a2 = row1.locator('td').nth(1);
    const b1 = row2.locator('td').nth(0);
    const b2 = row2.locator('td').nth(1);
    const c1 = row3.locator('td').nth(0);
    const c2 = row3.locator('td').nth(1);

    await a1.click();

    await test.step('Fyll inn data i initiell 2x2-tabell', async () => {
      await a1.fill('A1');
      await page.keyboard.press('Tab');
      await a2.fill('A2');
      await page.keyboard.press('Tab');
      await b1.fill('B1');
      await page.keyboard.press('Tab');
      await b2.fill('B2');
    });

    await test.step('Legg til rad over', async () => {
      await page.getByLabel('Legg til rad over').click();
    });

    await test.step('Naviger til starten av den nye raden', async () => {
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Shift+Tab');
    });

    await test.step('Fyll inn data', async () => {
      await b1.fill('New B1');
      await page.keyboard.press('Tab');
      await b2.fill('New B2');
    });

    await test.step('Gå til den nederste raden og slett den', async () => {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      await page.getByLabel('Fjern rad').click();
    });

    await test.step('Legg til rad under', async () => {
      await page.getByLabel('Legg til rad under').click();
    });

    await test.step('Fyll inn data i den nye raden', async () => {
      await page.keyboard.press('Tab');
      await c1.fill('C1');
      await page.keyboard.press('Tab');
      await c2.fill('C2');
    });

    expect(await table.locator('tr').count()).toBe(3);
    expect(await row1.locator('td').count()).toBe(2);
    expect(await row2.locator('td').count()).toBe(2);
    expect(await row3.locator('td').count()).toBe(2);

    expect(await a1.textContent()).toBe('A1');
    expect(await a2.textContent()).toBe('A2');
    expect(await b1.textContent()).toBe('New B1');
    expect(await b2.textContent()).toBe('New B2');
    expect(await c1.textContent()).toBe('C1');
    expect(await c2.textContent()).toBe('C2');
  });

  test('Manipulering av kolonner', async ({ page, klagebehandling }) => {
    const smartEditor = await klagebehandling.behandling.initSmartEditor('Generelt brev');

    const p = smartEditor.locator('.slate-p').last();
    await p.click();

    await page.getByLabel('Sett inn tabell').click();

    const table = smartEditor.locator('table');
    const row1 = table.locator('tr').nth(0);
    const row2 = table.locator('tr').nth(1);

    const a1 = row1.locator('td').nth(0);
    const a2 = row1.locator('td').nth(1);
    const a3 = row1.locator('td').nth(2);
    const b1 = row2.locator('td').nth(0);
    const b2 = row2.locator('td').nth(1);
    const b3 = row2.locator('td').nth(2);

    await a1.click();

    await test.step('Fyll inn data i initiell 2x2-tabell', async () => {
      await a1.fill('A1');
      await page.keyboard.press('Tab');
      await a2.fill('A2');
      await page.keyboard.press('Tab');
      await b1.fill('B1');
      await page.keyboard.press('Tab');
      await b2.fill('B2');
    });

    await test.step('Legg til kolonne til venstre', async () => {
      await page.getByLabel('Legg til kolonne til venstre').click();
    });

    await test.step('Naviger til starten av ny kolonne', async () => {
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);
    });

    await test.step('Fyll inn data i den nye kolonnen', async () => {
      await a2.fill('New A2');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      await b2.fill('New B2');
    });

    await test.step('Naviger til den gamle kolonnen og slett den', async () => {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      await page.getByLabel('Fjern kolonne').click();
    });

    await test.step('Legg til kolonne til høyre', async () => {
      await page.getByLabel('Legg til kolonne til høyre').click();
    });

    await test.step('Naviger til toppen av den nye kolonnen', async () => {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);
    });

    await test.step('Fyll inn data i den nye kolonnen', async () => {
      await a3.fill('A3');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      await b3.fill('B3');
    });

    expect(await table.locator('tr').count()).toBe(2);
    expect(await row1.locator('td').count()).toBe(3);
    expect(await row2.locator('td').count()).toBe(3);

    expect(await a1.textContent()).toBe('A1');
    expect(await a2.textContent()).toBe('New A2');
    expect(await a3.textContent()).toBe('A3');
    expect(await b1.textContent()).toBe('B1');
    expect(await b2.textContent()).toBe('New B2');
    expect(await b3.textContent()).toBe('B3');
  });
});
