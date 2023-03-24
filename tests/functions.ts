import { join } from 'path';
import { URL } from 'url';

export const isNotUndefined = <T>(v: T | undefined): v is T => typeof v !== 'undefined';

export const getParsedUrl = (url: string): URL => new URL(url);

export const USE_DEV = process.env.NODE_ENV === 'test';

export const DEV_DOMAIN = 'https://kabal.intern.dev.nav.no';
export const LOCAL_DOMAIN = 'http://localhost:8061';

export const UI_DOMAIN = USE_DEV ? DEV_DOMAIN : LOCAL_DOMAIN;

export const createApiUrl = (api: string, path: string) => `${DEV_DOMAIN}/${join('api', api, path)}`;
