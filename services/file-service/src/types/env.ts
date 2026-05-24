export type Bindings = {
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
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
