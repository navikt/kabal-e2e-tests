import type { Page } from '@playwright/test';
import { getRegion } from '@/fixtures/regions';

export const getDokumenter = (page: Page) => getRegion(page, 'Dokumenter');

export const getDokumenterUnderArbeid = (page: Page) => getRegion(page, 'Dokumenter under arbeid');

const JOURNALFOERTE_DOKUMENTER_REGEX = /^Journalførte dokumenter/;

export const getJournalfoerteDokumenter = (page: Page) => getRegion(page, JOURNALFOERTE_DOKUMENTER_REGEX);

const UTFALL_REGEX = /Utfall/;

export const getUtfallResultat = (page: Page) => getRegion(page, UTFALL_REGEX);

export const getSaksnummer = (page: Page) => getRegion(page, 'Saksnummer');
