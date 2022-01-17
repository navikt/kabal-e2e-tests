import { URL } from 'url';

export const isNotUndefined = <T>(v: T | undefined): v is T => typeof v !== 'undefined';

export const getParsedUrl = (url: string): URL => new URL(url);
