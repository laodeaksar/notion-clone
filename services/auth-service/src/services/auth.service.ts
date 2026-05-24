import jwt from 'jsonwebtoken';
import { userRepo } from '../repository/user.repo';
import { RegisterSchema, LoginSchema } from '../types/auth.types';
import { JWT_SECRET } from '../config';
import type { PublicUser } from '../types/auth.types';

function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}

export const authService = {
  async register(input: unknown): Promise<PublicUser> {
    const parsed = RegisterSchema.parse(input);
    const existing = await userRepo.findByEmail(parsed.email);
    if (existing) {
      const err = new Error('Email already exists');
      (err as any).status = 409;
      throw err;
    }
    const user = await userRepo.create({
      ...parsed,
      passwordHash: hashPassword(parsed.password)
    });
    return { id: user.id, email: user.email, name: user.name };
  },

  async login(input: unknown): Promise<string> {
    const parsed = LoginSchema.parse(input);
    const user = await userRepo.findByEmail(parsed.email);
    if (!user || user.passwordHash !== hashPassword(parsed.password)) {
      const err = new Error('Invalid credentials');
      (err as any).status = 401;
      throw err;
    }
    return jwt.sign(
      { sub: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
};
