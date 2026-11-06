export const SEARCH_MIN_CHARACTERS = 2;

export const SEARCH_MAX_LENGTH = 100;

export function toSearchTerm(value: string): string {
  const term = value.trim();
  const characters = term.replace(/[^\p{L}\p{N}]/gu, '').length;
  return characters >= SEARCH_MIN_CHARACTERS ? term : '';
}
