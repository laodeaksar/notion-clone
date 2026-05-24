import { createPublisher } from '@workspace/shared/src/events/publisher';
import type { FileEvent } from '@workspace/shared/src/events/events';

export type { FileEvent } from '@workspace/shared/src/events/events';

export const publisher = createPublisher<FileEvent>('file-events');
