import { Page } from '@playwright/test';
import { generateOppgave } from './generate';

export class KabalPage {
  public page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  public generateKlage = () => generateOppgave(this.page, 'klage');
  public generateAnke = () => generateOppgave(this.page, 'anke');
}
