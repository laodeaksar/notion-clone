import type { CfQueue } from '@workspace/shared';
import type { FileEvent } from '@workspace/shared';

export type Bindings = {
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY:    string;
  CLOUDINARY_API_SECRET: string;
  JWT_SECRET:            string;
  DATABASE_URL:          string;
  EVENTS_QUEUE?:         CfQueue<FileEvent>;
};

export type Variables = {
  userId:    string;
  userEmail: string;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
