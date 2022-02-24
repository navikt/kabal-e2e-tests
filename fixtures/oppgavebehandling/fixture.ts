import { test as base } from '@playwright/test';
import { KabalPage } from './page';

export interface OppgavebehandlingFixture {
  kabalPage: KabalPage;
}

export const test = base.extend<OppgavebehandlingFixture>({
  kabalPage: async ({ page }, use) => {
    const kabalPage = new KabalPage(page);

    await use(kabalPage);
  },
});
