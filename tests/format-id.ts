export const formatIdNumber = (id: string | undefined | null): string => {
  if (typeof id === 'undefined' || id === null) {
    return '';
  }

  const array = id.split('');

  if (isOrgNum(array)) {
    return unsafeFormatOrgNum(array);
  }

  if (isFoedselsnummer(array)) {
    return unsafeFormatFoedselsnummer(array);
  }

  return id;
};

type OrgNum = [string, string, string, string, string, string, string, string, string];
type Foedselsnummer = [string, string, string, string, string, string, string, string, string, string, string];

const isOrgNum = (id: string[]): id is OrgNum => id.length === 9;
const isFoedselsnummer = (id: string[]): id is Foedselsnummer => id.length === 11;

const unsafeFormatOrgNum = ([a, b, c, d, e, f, g, h, i]: OrgNum): string => `${a}${b}${c} ${d}${e}${f} ${g}${h}${i}`;

export const formatOrgNum = (n: string): string => {
  const array = n.split('');

  if (isOrgNum(array)) {
    return unsafeFormatOrgNum(array);
  }

  return n;
};

const unsafeFormatFoedselsnummer = ([a, b, c, d, e, f, g, h, i, j, k]: Foedselsnummer) =>
  `${a}${b}${c}${d}${e}${f} ${g}${h}${i}${j}${k}`;

export const formatFoedselsnummer = (n: string | undefined | null): string => {
  if (n === null || typeof n === 'undefined') {
    return '';
  }

  const array = n.split('');

  if (isFoedselsnummer(array)) {
    return unsafeFormatFoedselsnummer(array);
  }

  return n;
};
