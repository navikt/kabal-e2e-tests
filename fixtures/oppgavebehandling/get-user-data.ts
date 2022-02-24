import { Page } from '@playwright/test';
import { makeDirectApiRequest } from './direct-api-request';

let cachedBrukerdata: IBrukerdata | null = null;

const userProperties = ['info', 'roller', 'enheter', 'ansattEnhet', 'innstillinger'];

export const getBrukerData = async (page: Page) => {
  if (cachedBrukerdata !== null) {
    return cachedBrukerdata;
  }

  const brukerInfo = await makeDirectApiRequest(page, 'kabal-innstillinger', `/me/brukerdata`, 'GET');
  const json: unknown = await brukerInfo.json();

  if (isBrukerdata(json)) {
    cachedBrukerdata = json;
    return json;
  }

  return null;
};

const isBrukerdata = (json: unknown): json is IBrukerdata =>
  json !== null && typeof json === 'object' && userProperties.every((p) => p in json);

interface IBrukerdata {
  info: {
    navIdent: string;
    azureId: string;
    fornavn: string;
    etternavn: string;
    sammensattNavn: string;
    epost: string;
  };
  roller: string[];
  enheter: IEnhet[];
  ansattEnhet: IEnhet;
  innstillinger: {
    hjemler: string[];
    ytelser: string[];
    typer: string[];
  };
}

interface IEnhet {
  id: string;
  navn: string;
  lovligeYtelser: string[];
}
