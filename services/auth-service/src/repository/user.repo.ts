import { eq } from 'drizzle-orm';
import { db } from '../config';
import { users } from '@workspace/db/src/schema';
import type { RegisterInput, User } from '../types/auth.types';

export const userRepo = {
  async findByEmail(email: string): Promise<User | null> {
    const rows = await db.select().from(users).where(eq(users.email, email));
    return (rows[0] as User) ?? null;
  },

  async findById(id: string): Promise<User | null> {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return (rows[0] as User) ?? null;
  },

  async create(input: RegisterInput & { passwordHash: string }): Promise<User> {
    const now = new Date();
    const [user] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return user as User;
  }
};
