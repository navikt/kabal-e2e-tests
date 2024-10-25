import type { Page } from '@playwright/test';
import { createApiUrl } from '../../tests/functions';
import { makeDirectApiRequest } from '../direct-api-request';

export const deleteBehandling = async (page: Page, behandlingId: string) => {
  const api = 'kabal-api';
  const path = `/internal/behandlinger/${behandlingId}`;
  const method = 'DELETE';

  const res = await makeDirectApiRequest(page, api, path, method);

  if (!res.ok) {
    const responseText = await res.text();

    throw new Error(`${res.status} - ${res.statusText}\n\n${responseText}\n\n${method} ${createApiUrl(api, path)}`);
  }
};
