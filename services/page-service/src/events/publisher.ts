import { createPublisher } from '@workspace/shared';
import type { PageEvent } from '@workspace/shared';

export const publisher = createPublisher<PageEvent>('page-events');
