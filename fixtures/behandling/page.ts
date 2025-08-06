import type { Page } from '@playwright/test';
import type { Behandling } from './behandling';
import { generateBehandling, SaksTypeName } from './generate';

export class KabalPage {
  constructor(public readonly page: Page) {}

  public generateKlage = () => generateBehandling(this.page, SaksTypeName.KLAGE);
  public generateAnke = () => generateBehandling(this.page, SaksTypeName.ANKE);
}

export class BehandlingPage {
  constructor(
    public readonly page: Page,
    public readonly behandling: Behandling,
  ) {}
}

export class AnkebehandlingPage extends BehandlingPage {
  public readonly type: SaksTypeName = SaksTypeName.ANKE;
}

export class KlagebehandlingPage extends BehandlingPage {
  public readonly type: SaksTypeName = SaksTypeName.KLAGE;
}
