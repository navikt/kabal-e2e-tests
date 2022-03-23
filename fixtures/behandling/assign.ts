import { Page } from '@playwright/test';
import { makeDirectApiRequest } from '../direct-api-request';
import { getBrukerData } from './get-user-data';

export const assignBehandling = async (page: Page, behandlingId: string) => {
  const brukerData = await getBrukerData(page);

  if (brukerData === null) {
    throw new Error('Failed to get brukerdata.');
  }

  const res = await makeDirectApiRequest(
    page,
    'kabal-api',
    `/ansatte/${brukerData.navIdent}/klagebehandlinger/${behandlingId}/saksbehandlertildeling`,
    'POST',
    { navIdent: brukerData.navIdent, enhetId: brukerData.ansattEnhet.id }
  );

  if (!res.ok) {
    throw new Error(`Failed to assign behandling "${behandlingId}". ${res.status} - ${res.statusText}`);
  }
};

export const deAssignBehandling = async (page: Page, behandlingId: string) => {
  const brukerData = await getBrukerData(page);

  if (brukerData === null) {
    throw new Error('Failed to get brukerdata.');
  }

  const res = await makeDirectApiRequest(
    page,
    'kabal-api',
    `/ansatte/${brukerData.navIdent}/klagebehandlinger/${behandlingId}/saksbehandlerfradeling`,
    'POST'
  );

  if (!res.ok) {
    throw new Error(`Failed to deassign behandling "${behandlingId}". ${res.status} - ${res.statusText}`);
  }
};
