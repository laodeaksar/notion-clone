import type { CfQueue } from '@workspace/shared';
import type { PageEvent } from '@workspace/shared';

export type Bindings = {
  DATABASE_URL:  string;
  JWT_SECRET:    string;
  EVENTS_QUEUE?: CfQueue<PageEvent>;
};

export type Variables = {
  userId:    string;
  userEmail: string;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
