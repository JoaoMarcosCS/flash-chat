import { describe, expect, it } from 'vitest';
import { sign } from 'jsonwebtoken';
import { generateTokens, verifyAccessToken } from './token';
import { env } from '@/shared/environment/env';

const user = { id: '0199b7a0-0000-7000-8000-000000000001', name: 'Ana Souza', nickname: 'ana' };

describe('verifyAccessToken', () => {
  it('should return the user and the expiration of a valid access token', () => {
    const { accessToken } = generateTokens(user);

    const payload = verifyAccessToken(accessToken);

    expect(payload).toMatchObject(user);
    expect(payload?.expiresAt).toBeGreaterThan(Date.now());
  });

  it('should reject a refresh token', () => {
    expect(verifyAccessToken(generateTokens(user).refreshToken)).toBeNull();
  });

  it('should reject an expired token', () => {
    const token = sign({ name: user.name, nickname: user.nickname }, env.JWT_SECRET, {
      subject: user.id,
      algorithm: 'HS256',
      expiresIn: -1,
    });

    expect(verifyAccessToken(token)).toBeNull();
  });

  it('should reject a token without subject', () => {
    expect(verifyAccessToken(sign({}, env.JWT_SECRET, { algorithm: 'HS256' }))).toBeNull();
  });

  it('should reject a malformed token', () => {
    expect(verifyAccessToken('invalid')).toBeNull();
  });
});
