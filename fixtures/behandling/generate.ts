import type { Page } from '@playwright/test';
import { FULLMEKTIG, KLAGER, SAKEN_GJELDER } from '../../tests/users';
import { makeDirectApiRequest } from '../direct-api-request';
import { Behandling } from './behandling';

export const generateBehandling = async (page: Page, type: SaksTypeName): Promise<Behandling> => {
  const res = await makeDirectApiRequest(page, 'kabal-api', `/mockdata/random${type}`, 'POST', {
    ytelse: 'SYK_SYK',
    sakenGjelder: SAKEN_GJELDER,
    klager: { ...KLAGER, klagersProsessfullmektig: FULLMEKTIG },
  });

  if (!res.ok) {
    throw new Error(`Failed to generate "${type}" behandling. ${res.status} - ${res.statusText}`);
  }

  const response: unknown = await res.json();

  if (isGenerateResponse(response)) {
    return new Behandling(page, response);
  }

  throw new Error(`Invalid response from mock endpoint: ${res.statusText} - Status code: ${res.status}`);
};

const RESPONSE_PROPERTIES = ['id', 'typeId', 'ytelseId', 'hjemmelId'];

const isGenerateResponse = (json: unknown): json is IGenerateResponse =>
  json !== null && typeof json === 'object' && RESPONSE_PROPERTIES.every((prop) => prop in json);

export enum Sakstype {
  KLAGE = '1',
  ANKE = '2',
}

export enum SaksTypeName {
  KLAGE = 'klage',
  ANKE = 'anke',
}

export interface IGenerateResponse {
  id: string;
  typeId: Sakstype;
  ytelseId: string;
  hjemmelId: string;
}
