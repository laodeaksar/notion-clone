import { createPublisher } from '@workspace/shared';
import type { BlockEvent } from '@workspace/shared';

export const publisher = createPublisher<BlockEvent>('block-events');
