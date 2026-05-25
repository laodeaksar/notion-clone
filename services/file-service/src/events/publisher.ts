import { createPublisher } from '@workspace/shared';
import type { CfQueue, Publisher } from '@workspace/shared';
import type { FileEvent } from '@workspace/shared';

export function createFilePublisher(
  queue: CfQueue<FileEvent> | null | undefined
): Publisher<FileEvent> {
  return createPublisher<FileEvent>(queue);
}
