// para evitar que caracteres especiais digitados pelo usuário interfiram na construção da consulta de pesquisa.
// como João & Maria
export const TSQUERY_SPECIAL_CHARACTERS = /[&|!():*<>'"\\]/g;

export const countSearchCharacters = (search: string): number =>
  search.replace(TSQUERY_SPECIAL_CHARACTERS, '').replace(/\s+/g, '').length;

// monta a query de pesquisa para o PostgreSQL a partir da string de pesquisa fornecida pelo usuário.
// a pesquisa usa :* não é uma pesquisa por qualquer
// trecho da palavra, mas por seu prefixo. Por exemplo, mar:* encontra marcos e joão marcos. arc não encontra "marcos"
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
