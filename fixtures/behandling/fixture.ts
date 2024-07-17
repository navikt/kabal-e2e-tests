import { Page, test as base } from '@playwright/test';
import { SaksTypeName, generateBehandling } from './generate';
import { AnkebehandlingPage, KabalPage, KlagebehandlingPage } from './page';

export interface Pages {
  index: KabalPage;
  klagebehandling: KlagebehandlingPage;
  ankebehandling: AnkebehandlingPage;
}

export const test = base.extend<Pages>({
  index: async ({ page }, use) => {
    const kabalPage = new KabalPage(page);

    await use(kabalPage);
  },
  klagebehandling: async ({ page }, use) => {
    const klagePage = await getKlageBehandling(page);

    await use(klagePage);

    await klagePage.behandling.delete();
  },
  ankebehandling: async ({ page }, use) => {
    const ankePage = await getAnkeBehandling(page);

    await use(ankePage);

    await ankePage.behandling.delete();
  },
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getKlageBehandling = async (page: Page) => {
  const behandling = await generateBehandling(page, SaksTypeName.KLAGE);

  const behandlingPage = new KlagebehandlingPage(page, behandling);

  await wait(3000);

  await behandling.assign();
  await behandling.navigateTo();

  return behandlingPage;
};

const getAnkeBehandling = async (page: Page) => {
  const behandling = await generateBehandling(page, SaksTypeName.ANKE);

  const behandlingPage = new AnkebehandlingPage(page, behandling);

  await wait(3000);

  await behandling.assign();
  await behandling.navigateTo();

  return behandlingPage;
};
