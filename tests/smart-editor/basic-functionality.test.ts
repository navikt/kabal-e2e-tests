import { expect } from 'playwright/test';
import { test } from '../../fixtures/behandling/fixture';

test.describe('Smart editor - Grunnleggende funksjonalitet', () => {
  test('Skrive et avsnitt', async ({ page, klagebehandling }) => {
    const smartEditor = await klagebehandling.behandling.initSmartEditor('Generelt brev');

    const p = smartEditor.locator('.slate-p').last();
    await p.click();

    const text = 'Dette er et avsnitt';
    await page.keyboard.type(text);

    expect(await p.textContent()).toBe(text);
  });

  test('Lage en liste', async ({ page, klagebehandling }) => {
    const smartEditor = await klagebehandling.behandling.initSmartEditor('Generelt brev');

    const p = smartEditor.locator('.slate-p').last();
    await p.click();

    await page.keyboard.type('- Dette er et punkt');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Dette er et annet punkt');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Dette er et underpunkt');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Dette er et underunderpunkt');

    const list = smartEditor.locator('ul');

    const a1 = list.locator('li').nth(0);
    const b1 = list.locator('li').nth(1);
    const a1Text = a1.locator('> div');
    const b1Text = b1.locator('> div');

    const b2 = b1.locator('ul').locator('li').first();
    const b2Text = b2.locator('> div');

    const b3 = b2.locator('ul').locator('li').first();
    const b3Text = b3.locator('> div');

    expect(await a1Text.textContent()).toBe('Dette er et punkt');
    expect(await b1Text.textContent()).toBe('Dette er et annet punkt');
    expect(await b2Text.textContent()).toBe('Dette er et underpunkt');
    expect(await b3Text.textContent()).toBe('Dette er et underunderpunkt');
  });
});
