import type { Page } from '@playwright/test';
import { createApiUrl, UI_DOMAIN } from '@/tests/functions';

type Api = 'kabal-api' | 'kabal-innstillinger';
type Method = 'POST' | 'GET' | 'PUT' | 'DELETE';

interface Options<T> {
  body?: T;
  /** Defaults to `application/json`. Endpoints that return something else - a PDF, for instance -
   * answer `406 Not Acceptable` unless they are asked for what they actually produce. */
  accept?: string;
}

export const makeDirectApiRequest = async <T>(
  page: Page,
  api: Api,
  path: string,
  method: Method,
  { body, accept = 'application/json' }: Options<T> = {},
) => {
  const url = createApiUrl(api, path);

  try {
    return await fetch(url, {
      method,
      body: JSON.stringify(body),
      headers: {
        Accept: accept,
        'Content-Type': 'application/json',
        Cookie: await toCookieHeader(page),
      },
    });
  } catch (e) {
    throw new Error(`${method} ${url} - ${toMessage(e)}.`, { cause: e });
  }
};

/**
 * Builds a `Cookie` header from the cookies belonging to the Kabal instance under test.
 *
 * `BrowserContext.cookies()` without arguments returns every cookie in the context, across every
 * domain it has talked to - including the handful of large cookies the Azure sign-in leaves behind
 * on `login.microsoftonline.com` (`ESTSAUTHPERSISTENT` alone is several kilobytes). Sending those
 * to Nav's APIs is pointless, and together they push the request past the server's max header size,
 * which fails the request with `431 Request Header Fields Too Large` rather than anything that
 * hints at cookies.
 *
 * The filtering is by `UI_DOMAIN` rather than by the request URL, because the two differ when
 * running against localhost: `createApiUrl` always points at the dev API, while the session cookie
 * is moved to `localhost` by `setLocalhostCookie` in `setup/global-setup.ts`. The cookie value is
 * the same either way, so the dev API accepts it.
 */
const toCookieHeader = async (page: Page): Promise<string> =>
  (await page.context().cookies(UI_DOMAIN)).map(({ name, value }) => `${name}=${value}`).join('; ');

/** How many `cause` hops to follow. Also guards against a cyclic chain. */
const MAX_CAUSE_DEPTH = 4;

/**
 * Flattens an error and its `cause` chain into a single line.
 *
 * Node's `fetch` rejects with a bare `TypeError: fetch failed` and hides the part you actually
 * need - `ECONNREFUSED`, `ENOTFOUND`, certificate errors - one level down in `cause`. Without this,
 * a failing test reports only `fetch failed`.
 */
const toMessage = (e: unknown): string => {
  const parts = toParts(e);

  return parts.length === 0 ? 'Unknown error' : parts.join(': ');
};

/** The message of `e` followed by those of its `cause` chain, outermost first. Anything that is not
 * an `Error` contributes nothing, which doubles as the base case for an error without a cause. */
const toParts = (e: unknown, depth = 0): string[] => {
  if (!(e instanceof Error)) {
    return [];
  }

  if (depth >= MAX_CAUSE_DEPTH) {
    return [e.message];
  }

  const cause = e instanceof AggregateError ? [toAlternatives(e, depth)] : toParts(e.cause, depth + 1);

  // Drop empty messages - `AggregateError` has none by default - and any cause that merely repeats
  // its parent, so we never report `fetch failed: fetch failed`.
  return [e.message, ...cause].filter((part, i, all) => part !== '' && part !== all[i - 1]);
};

/** When a host resolves to several addresses, every attempt fails at once and the failures arrive
 * together in an `AggregateError`. They are alternatives rather than a chain, so they read as a
 * comma-separated list instead of being joined with the rest of the chain. */
const toAlternatives = (e: AggregateError, depth: number): string =>
  e.errors.map((error) => toParts(error, depth + 1).join(': ')).join(', ');
