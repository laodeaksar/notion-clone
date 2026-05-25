import * as v from 'valibot';

export const RegisterSchema = v.object({
  email:    v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
  name:     v.optional(v.string())
});

export const LoginSchema = v.object({
  email:    v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8))
});

export type RegisterInput = v.InferInput<typeof RegisterSchema>;
export type LoginInput    = v.InferInput<typeof LoginSchema>;

export type User = {
  id:           string;
  email:        string;
  passwordHash: string;
  name:         string | null | undefined;
  createdAt:    Date;
  updatedAt:    Date;
};

export type PublicUser = Pick<User, 'id' | 'email' | 'name'>;
