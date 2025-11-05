import { join } from 'node:path';
import { URL } from 'node:url';

export const isNotUndefined = <T>(v: T | undefined): v is T => v !== undefined;

export const getParsedUrl = (url: string): URL => new URL(url);

export const USE_LOCALHOST = process.env.TARGET === 'local';

export const LOCAL_DOMAIN = 'http://localhost:8061';
export const DEV_DOMAIN = 'https://kabal.intern.dev.nav.no';

export const UI_DOMAIN = USE_LOCALHOST ? LOCAL_DOMAIN : DEV_DOMAIN;

export const createApiUrl = (api: string, path: string) => `${DEV_DOMAIN}/${join('api', api, path)}`;
