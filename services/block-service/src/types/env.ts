import type { CfQueue } from '@workspace/shared';
import type { BlockEvent } from '@workspace/shared';

export type Bindings = {
  DATABASE_URL:  string;
  JWT_SECRET:    string;
  EVENTS_QUEUE?: CfQueue<BlockEvent>;
};

export type Variables = {
  userId:    string;
  userEmail: string;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
