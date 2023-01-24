import { Page } from '@playwright/test';
import { makeDirectApiRequest } from '../direct-api-request';
import { getBrukerData } from './get-user-data';

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

  const res = await makeDirectApiRequest(page, 'kabal-api', `/behandlinger/${behandlingId}/saksbehandler`, 'PUT', {
    navIdent: null,
  });

  if (!res.ok) {
    throw new Error(`Failed to deassign behandling "${behandlingId}". ${res.status} - ${res.statusText}`);
  }
};
