import { createPublisher } from '@workspace/shared/src/events/publisher';
import type { BlockEvent } from '@workspace/shared/src/events/events';

export type { BlockEvent } from '@workspace/shared/src/events/events';

export const publisher = createPublisher<BlockEvent>('block-events');
