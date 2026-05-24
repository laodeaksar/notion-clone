import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional()
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = Pick<User, 'id' | 'email' | 'name'>;
