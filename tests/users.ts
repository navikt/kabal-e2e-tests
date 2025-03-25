import { requiredEnvString } from '../config/env';
import { formatIdNumber } from './format-id';

export interface User {
  username: string;
  password: string;
}

export const userSaksbehandler: User = {
  username: requiredEnvString('SAKSBEHANDLER_USERNAME'),
  password: requiredEnvString('SAKSBEHANDLER_PASSWORD'),
};

enum PartType {
  PERSON = 'PERSON',
  VIRKSOMHET = 'VIRKSOMHET',
}

interface Id {
  type: PartType;
  verdi: string;
}

interface Part {
  id: Id;
}

export const SAKEN_GJELDER: Part = { id: { type: PartType.PERSON, verdi: '08509328251' } };
export const KLAGER: Part = { id: { type: PartType.PERSON, verdi: '20840899684' } };
export const FULLMEKTIG: Part = { id: { type: PartType.PERSON, verdi: '19900598796' } };

export const SAKEN_GJELDER_DATA = { id: formatIdNumber(SAKEN_GJELDER.id.verdi), name: 'DOBBEL NETTHINNE' };
export const KLAGER_DATA = { id: formatIdNumber(KLAGER.id.verdi), name: 'PRATSOM KLUT' };
export const FULLMEKTIG_DATA = { id: formatIdNumber(FULLMEKTIG.id.verdi), name: 'BEGEISTRET FLEKK' };
