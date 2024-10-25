import type { Page } from '@playwright/test';
import { makeDirectApiRequest } from '../direct-api-request';
import { getBrukerData } from './get-user-data';

enum FradelReason {
  FEIL_HJEMMEL = 1,
  MANGLER_KOMPETANSE = 2,
  INHABIL = 3,
  LENGRE_FRAVÆR = 4,
  ANNET = 5,
  LEDER = 6,
}

export const assignBehandling = async (page: Page, behandlingId: string) => {
  const brukerData = await getBrukerData(page);

  if (brukerData === null) {
    throw new Error('Failed to get brukerdata.');
  }

  const res = await makeDirectApiRequest(page, 'kabal-api', `/behandlinger/${behandlingId}/saksbehandler`, 'PUT', {
    navIdent: brukerData.navIdent,
  });

  if (!res.ok) {
    throw new Error(`Failed to assign behandling "${behandlingId}". ${res.status} - ${res.statusText}`);
  }
};

export const deAssignBehandling = async (page: Page, behandlingId: string) => {
  const brukerData = await getBrukerData(page);

  if (brukerData === null) {
    throw new Error('Failed to get brukerdata.');
  }

  const res = await makeDirectApiRequest(page, 'kabal-api', `/behandlinger/${behandlingId}/fradel`, 'POST', {
    reasonId: FradelReason.ANNET,
  });

  if (!res.ok) {
    throw new Error(`Failed to deassign behandling "${behandlingId}". ${res.status} - ${res.statusText}`);
  }
};
