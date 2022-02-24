import { URL } from 'url';

export const isNotUndefined = <T>(v: T | undefined): v is T => typeof v !== 'undefined';

export const getParsedUrl = (url: string): URL => new URL(url);

export const IS_DEV = process.env.NODE_ENV === 'development';

export const ROOT_URL = IS_DEV ? 'http://localhost:8061' : 'https://kabal.dev.nav.no';
