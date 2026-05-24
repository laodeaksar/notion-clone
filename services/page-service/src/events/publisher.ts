import { createPublisher } from '@workspace/shared/src/events/publisher';
import type { PageEvent } from '@workspace/shared/src/events/events';

export type { PageEvent } from '@workspace/shared/src/events/events';

export const publisher = createPublisher<PageEvent>('page-events');
