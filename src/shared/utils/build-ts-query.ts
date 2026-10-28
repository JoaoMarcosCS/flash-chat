export const TSQUERY_SPECIAL_CHARACTERS = /[&|!():*<>'"\\]/g;

export const countSearchCharacters = (search: string): number =>
  search.replace(TSQUERY_SPECIAL_CHARACTERS, '').replace(/\s+/g, '').length;

export const buildTsQuery = (search?: string): string | undefined => {
  if (!search) {
    return undefined;
  }

  const tokens = search
    .toLowerCase()
    .replace(TSQUERY_SPECIAL_CHARACTERS, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => `${token}:*`);

  return tokens.length ? tokens.join(' & ') : undefined;
};
