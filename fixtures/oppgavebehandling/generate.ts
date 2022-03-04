import { Page } from '@playwright/test';
import { makeDirectApiRequest } from './direct-api-request';
import { Oppgave } from './oppgave';

export const generateOppgave = async (page: Page, type: 'anke' | 'klage'): Promise<Oppgave> => {
  const res = await makeDirectApiRequest(page, 'kabal-api', `/mockdata/random${type}`, 'POST');

  if (!res.ok) {
    throw new Error(`Failed to generate "${type}" oppgave. ${res.status} - ${res.statusText}`);
  }

  const response: unknown = await res.json();

  if (isGenerateOppgaveResponse(response)) {
    return new Oppgave(page, response);
  }

  throw new Error(`Invalid response from mock endpoint: ${res.statusText} - Status code: ${res.status}`);
};

const RESPONSE_PROPERTIES = ['id', 'typeId', 'ytelseId', 'hjemmelId'];

const isGenerateOppgaveResponse = (json: unknown): json is IGenerateOppgaveResponse =>
  json !== null && typeof json === 'object' && RESPONSE_PROPERTIES.every((prop) => prop in json);

export enum Sakstype {
  KLAGE = '1',
  ANKE = '2',
}

export interface IGenerateOppgaveResponse {
  id: string;
  typeId: Sakstype;
  ytelseId: string;
  hjemmelId: string;
}
