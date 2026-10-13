import { describe, expect, it } from 'vitest';
import { LoginSchema } from './login.schema';

const email = 'john.doe@example.com';

describe('LoginSchema', () => {
  it('should reject an empty password', () => {
    const result = LoginSchema.safeParse({ email, password: '' });

    expect(result.error?.issues[0].message).toBe('Senha é obrigatória');
  });

  it('should reject password longer than 15 characters', () => {
    const result = LoginSchema.safeParse({ email, password: 'Abcdefgh1234@xyz' });

    expect(result.error?.issues[0].message).toBe('Senha deve ter no máximo 15 caracteres');
  });

  it('should accept password with exactly 15 characters', () => {
    expect(LoginSchema.safeParse({ email, password: 'Abcdefgh1234@xy' }).success).toBe(true);
  });
});
