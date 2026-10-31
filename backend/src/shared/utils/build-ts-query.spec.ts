import { describe, expect, it } from 'vitest';
import { buildTsQuery, countSearchCharacters } from './build-ts-query';

describe('buildTsQuery', () => {
  it('should keep nickname tokens intact', () => {
    expect(buildTsQuery('John_Doe.99')).toBe('john_doe.99:*');
  });

  it('should remove tsquery special characters', () => {
    expect(buildTsQuery("john' & (doe):* | !x")).toBe('john:* & doe:* & x:*');
  });

  it('should keep e-mail tokens intact', () => {
    expect(buildTsQuery('John.Doe@example.com')).toBe('john.doe@example.com:*');
  });

  it('should return undefined when no token remains', () => {
    expect(buildTsQuery('')).toBeUndefined();
    expect(buildTsQuery('&|!')).toBeUndefined();
  });
});

describe('countSearchCharacters', () => {
  it('should ignore spaces and tsquery special characters', () => {
    expect(countSearchCharacters(' a & (b) ')).toBe(2);
    expect(countSearchCharacters('&|!')).toBe(0);
  });
});
