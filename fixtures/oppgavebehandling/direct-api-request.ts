import { join } from 'path';
import { Page } from '@playwright/test';
import fetch from 'node-fetch';
import { ROOT_URL } from '../../tests/functions';

export const makeDirectApiRequest = async <T>(
  page: Page,
  api: 'kabal-api' | 'kabal-innstillinger',
  path: string,
  method: 'POST' | 'GET' | 'PUT' | 'DELETE',
  body?: T
) => {
  try {
    return fetch(join(ROOT_URL, 'api', api, path), {
      method,
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cookie: (await page.context().cookies()).map(({ name, value }) => `${name}=${value}`).join('; '),
      },
    });
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`${method} ${path} to ${api} - ${e.message}.`);
    }

    throw new Error(`${method} ${path} to ${api} - Unkown error.`);
  }
};
