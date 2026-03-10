import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { KODEVERK_URL } from '@/tests/functions';

const DATA_DIR = '/tmp/klage-e2e-tests-kodeverk';
export const HJEMMEL_MAP_PATH = `${DATA_DIR}/hjemler.json`;

export const getHjemler = async () => {
  try {
    const res = await fetch(`${KODEVERK_URL}/hjemler`);

    if (!res.ok) {
      throw new Error(`Failed to fetch kodeverk. ${res.status} - ${res.statusText}`);
    }

    const data = await res.json();

    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR);
    }

    writeFileSync(HJEMMEL_MAP_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    throw new Error(`Error fetching hjemler: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};
