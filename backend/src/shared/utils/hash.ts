import { compare, hash as bcryptHash } from 'bcryptjs';

export const hash = {
  async generate(data: string): Promise<string> {
    return bcryptHash(data, 10);
  },

  async compare(data: string, hashed: string): Promise<boolean> {
    return compare(data, hashed);
  },
};
