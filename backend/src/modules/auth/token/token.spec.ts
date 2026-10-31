import { describe, expect, it } from 'vitest';
import { sign } from 'jsonwebtoken';
import { generateTokens, verifyAccessToken, verifyRefreshToken } from './token';
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

describe('verifyRefreshToken', () => {
  it('should return the user and the session of a valid refresh token', () => {
    const { refreshToken, sessionId } = generateTokens(user);

    expect(verifyRefreshToken(refreshToken)).toEqual({ userId: user.id, sessionId });
  });

  it('should generate a new session on each call', () => {
    expect(generateTokens(user).sessionId).not.toBe(generateTokens(user).sessionId);
  });

  it('should return the refresh token expiration', () => {
    const { refreshExpiresAt } = generateTokens(user);

    expect(Math.round((refreshExpiresAt - Date.now()) / 1000)).toBe(7 * 24 * 60 * 60);
  });

  it('should reject a refresh token without session', () => {
    const token = sign({}, env.JWT_REFRESH_SECRET, { subject: user.id, algorithm: 'HS256' });

    expect(verifyRefreshToken(token)).toBeNull();
  });

  it('should reject an access token', () => {
    expect(verifyRefreshToken(generateTokens(user).accessToken)).toBeNull();
  });
});
