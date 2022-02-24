import { Page } from '@playwright/test';
import { makeDirectApiRequest } from './direct-api-request';
import { Oppgave } from './oppgave';

export const generateOppgave = async (page: Page, type: 'anke' | 'klage'): Promise<Oppgave> => {
  const res = await makeDirectApiRequest(page, 'kabal-api', `/mockdata/random${type}`, 'POST');

  if (!res.ok) {
    throw new Error(`Failed to generate "${type}" oppgave. ${res.status} - ${res.statusText}`);
  }

  const id: unknown = await res.json();

  if (typeof id === 'string' && id.length !== 0) {
    return new Oppgave(page, id);
  }

  throw new Error(`Invalid response from mock endpoint: ${res.statusText} - Status code: ${res.status}`);
};
