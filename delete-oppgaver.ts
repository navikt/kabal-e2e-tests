const BEHANDLINGER_URL = 'https://kabal.intern.dev.nav.no/api/kabal-search/oppgaver/uferdige';
const DELETE_BEHANDLING_URL = 'https://kabal.intern.dev.nav.no/api/kabal-api/internal/dev/behandlinger/';

interface StorageState {
  cookies: { name: string; value: string }[];
}

const deleteBehandlinger = async () => {
  const file = Bun.file('./state.json');
  const content: StorageState = await file.json();
  const cookie = content.cookies.find((c) => c.name === 'io.nais.wonderwall.session');

  if (cookie === undefined) {
    throw new Error('Could not find io.nais.wonderwall.session cookie in state.json. Is state.json up to date?');
  }

  const options = { headers: { cookie: `${cookie.name}=${cookie.value}` } };

  const res = await fetch(BEHANDLINGER_URL, options);

  if (!res.ok) {
    console.error(`Failed to fetch oppgaver: ${await res.text()} (${res.status}). Is state.json up to date?`);
    process.exit(1);
  }

  const oppgaver: { behandlinger: string[] } = await res.json();

  let deletedCount = 0;

  for (const behandlingId of oppgaver.behandlinger) {
    const res = await fetch(`${DELETE_BEHANDLING_URL}${behandlingId}`, { method: 'DELETE', ...options });

    if (!res.ok) {
      console.error(`Failed to delete behandling: ${behandlingId} (${res.status} - ${res.statusText})`);
      continue;
    }

    deletedCount++;
    console.info(`Deleted behandling: ${behandlingId}`);
  }

  console.info(`Deleted ${deletedCount} behandlinger.`);
};

console.info('Deleting behandlinger...');

try {
  await deleteBehandlinger();
} catch (err) {
  console.error('Error deleting behandlinger', err);
}
