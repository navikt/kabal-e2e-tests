import { fail } from 'assert';
import { Page, expect, test } from '@playwright/test';
import EventSource from 'eventsource';
import { UI_DOMAIN } from './functions';

const NUMBER_OF_CONNECTIONS = 500;
const MESSAGE_TEXT = 'Hello world!';
const BEHANDLING_ID = '563b9561-a46d-4aa2-95df-a187aad10834';
const SSE_TIMEOUT = 25;
const WAIT_FOR_TIMEOUT = 25;
const CONNECT_STAGGER = 10;

test.describe('Events', () => {
  test.only(`Alle (${NUMBER_OF_CONNECTIONS}) SSE subscribers får events`, async ({ page }) => {
    console.log(`Connecting ${NUMBER_OF_CONNECTIONS} SSE clients...`);
    const connectStart = performance.now();

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    const prefix = `${year}_${month}_${date}_${hour}_${minute}_${second}`;

    console.log(`Prefix: ${prefix}`);

    const sseClients = await connectSSE(
      page,
      `${UI_DOMAIN}/api/kabal-api/behandlinger/${BEHANDLING_ID}/events`,
      prefix,
    );

    console.log(`Connected ${NUMBER_OF_CONNECTIONS} SSE clients in ${time(connectStart)}.`);

    const timeout = Math.max(WAIT_FOR_TIMEOUT * NUMBER_OF_CONNECTIONS, 3_000);

    console.log(`Waiting for ${formatTime(timeout)}...`);
    await page.waitForTimeout(timeout);
    console.log(`Waited for ${formatTime(timeout)}.`);

    sendMessage(page);

    await test.step(`Wait for ${NUMBER_OF_CONNECTIONS} SSE messages`, async () => {
      console.log(`Waiting for ${NUMBER_OF_CONNECTIONS} SSE messages...`);
      const start = performance.now();

      try {
        await waitForSSE(sseClients);
        console.log(`Received ${NUMBER_OF_CONNECTIONS} messages in ${time(start)}.`);
      } catch (e) {
        if (e instanceof Error) {
          fail(e);
        } else {
          fail(new Error(`Failed to receive ${NUMBER_OF_CONNECTIONS} messages in ${time(start)}.`));
        }
      } finally {
        await closeSSE(sseClients);
      }
    });
  });
});

const sendMessage = async (page: Page): Promise<void> => {
  console.log(`Sending message...`);
  const start = performance.now();

  const res = await fetch(`${UI_DOMAIN}/api/kabal-api/behandlinger/${BEHANDLING_ID}/meldinger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: (await page.context().cookies()).map(({ name, value }) => `${name}=${value}`).join('; '),
    },
    body: JSON.stringify({ text: MESSAGE_TEXT }),
  });

  expect(res.status).toBe(201);

  console.log(`Message sent successfully in ${time(start)}`);
};

const connectSSE = async (page: Page, url: string, prefix: string): Promise<EventSource[]> => {
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    Connection: 'keep-alive',
    Cookie: (await page.context().cookies()).map(({ name, value }) => `${name}=${value}`).join('; '),
  };

  const sseOptions: EventSource.EventSourceInitDict = {
    rejectUnauthorized: true,
    withCredentials: true,
    headers,
  };

  const sseClients: EventSource[] = [];

  return new Promise<EventSource[]>((resolve, reject) => {
    for (let i = 0; i < NUMBER_OF_CONNECTIONS; i++) {
      setTimeout(() => {
        const start = performance.now();

        try {
          const sse = new EventSource(`${url}?test-id=${prefix}-${i}`, sseOptions);

          sse.addEventListener('open', () => {
            console.log(`SSE client ${i + 1} connected in ${time(start)}.`);

            if (sseClients.push(sse) === NUMBER_OF_CONNECTIONS) {
              resolve(sseClients);
            }
          });

          sse.addEventListener('error', (event) => {
            console.error(`SSE client ${i + 1} error after ${time(start)}`, event);
            reject(event);
          });
        } catch (e) {
          console.error(`Failed to connect SSE client ${i + 1} after ${time(start)}`, e);
          reject(e);
        }
      }, CONNECT_STAGGER * i);
    }
  }).catch((e) => {
    closeSSE(sseClients);
    throw e;
  });
};

const waitForSSE = async (sseClients: EventSource[]): Promise<void> => {
  let received = 0;

  return new Promise<void>((resolve, reject) => {
    const timeoutMs = Math.max(SSE_TIMEOUT * NUMBER_OF_CONNECTIONS, 3_000);
    const timeout = setTimeout(() => {
      for (const sse of sseClients) {
        sse.close();
      }

      reject(new Error(`Timed out waiting for SSE after ${timeoutMs} ms. Got ${received} of ${NUMBER_OF_CONNECTIONS}`));
    }, timeoutMs);

    for (const sse of sseClients) {
      const start = performance.now();
      sse.addEventListener('MESSAGE_ADDED', (event) => {
        const index = sseClients.indexOf(sse);
        console.log(`SSE client ${index} received message in ${time(start)}.`);

        if (isServerSentEvent(event)) {
          const data = parseJSON<IMessage>(event.data);

          if (data?.text === MESSAGE_TEXT) {
            received += 1;

            if (received === NUMBER_OF_CONNECTIONS) {
              clearTimeout(timeout);
              resolve();
            }
          }
        }
      });
    }
  });
};

const closeSSE = async (sseClients: EventSource[]): Promise<void> => {
  const startClose = performance.now();
  console.log(`Closing ${sseClients.length} SSE clients...`);

  for (const sse of sseClients) {
    sse.close();
  }

  console.log(`Closed ${sseClients.length} SSE clients in ${time(startClose)}.`);
};

const time = (start: number): string => {
  const ms = performance.now() - start;

  return formatTime(ms);
};

const formatTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms.toFixed(2)} ms`;
  }

  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }

  return `${Math.floor(ms / 60_000)} min, ${((ms % 60_000) / 1_000).toFixed(2)} s`;
};

interface IMessage {
  author: {
    name: string;
    saksbehandlerIdent: string;
  };
  created: string;
  id: string;
  modified: string;
  text: string;
}

type ServerSentEvent = MessageEvent<string>;

const isServerSentEvent = (event: Event): event is ServerSentEvent =>
  'data' in event && typeof event.data === 'string' && 'lastEventId' in event && typeof event.lastEventId === 'string';

const parseJSON = <T>(json: string): T | null => {
  try {
    return JSON.parse(json);
  } catch (e) {
    console.warn('Failed to parse JSON', json, e);

    return null;
  }
};
