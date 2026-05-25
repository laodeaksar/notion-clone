import { createPublisher } from '@workspace/shared';
import type { FileEvent } from '@workspace/shared';

export const publisher = createPublisher<FileEvent>('file-events');
