export type Bindings = {
  DATABASE_URL:              string;
  JWT_SECRET:                string;
  UPSTASH_REDIS_REST_URL?:   string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};

export type Variables = {
  userId: string;
  userEmail: string;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
