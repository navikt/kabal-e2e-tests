import { Page } from '@playwright/test';
import { makeDirectApiRequest } from './direct-api-request';
import { getBrukerData } from './get-user-data';

export const assignTask = async (page: Page, oppgaveId: string) => {
  const brukerData = await getBrukerData(page);

  if (brukerData === null) {
    throw new Error('Failed to get brukerdata.');
  }

  const res = await makeDirectApiRequest(
    page,
    'kabal-api',
    `/ansatte/${brukerData.info.navIdent}/klagebehandlinger/${oppgaveId}/saksbehandlertildeling`,
    'POST',
    { navIdent: brukerData.info.navIdent, enhetId: brukerData.ansattEnhet.id }
  );

  if (!res.ok) {
    throw new Error(`Failed to assign task "${oppgaveId}". ${res.status} - ${res.statusText}`);
  }
};

export const deAssignTask = async (page: Page, oppgaveId: string) => {
  const brukerData = await getBrukerData(page);

  if (brukerData === null) {
    throw new Error('Failed to get brukerdata.');
  }

  const res = await makeDirectApiRequest(
    page,
    'kabal-api',
    `/ansatte/${brukerData.info.navIdent}/klagebehandlinger/${oppgaveId}/saksbehandlerfradeling`,
    'POST'
  );

  if (!res.ok) {
    throw new Error(`Failed to deassign task "${oppgaveId}". ${res.status} - ${res.statusText}`);
  }
};
