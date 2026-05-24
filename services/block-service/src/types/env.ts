export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
};

export type Variables = {
  userId: string;
  userEmail: string;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
