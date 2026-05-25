export type Bindings = {
  R2_BUCKET:    R2Bucket;
  R2_PUBLIC_URL: string;
  JWT_SECRET:   string;
  DATABASE_URL: string;
};

export type Variables = {
  userId: string;
  userEmail: string;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
