import type { CfQueue } from '@workspace/shared';
import type { FileEvent } from '@workspace/shared';

export type Bindings = {
  R2_BUCKET:     R2Bucket;
  R2_PUBLIC_URL: string;
  JWT_SECRET:    string;
  DATABASE_URL:  string;
  EVENTS_QUEUE?: CfQueue<FileEvent>;
};

export type Variables = {
  userId:    string;
  userEmail: string;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
