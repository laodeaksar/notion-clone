import { createPublisher } from '@workspace/shared';
import type { CfQueue, Publisher } from '@workspace/shared';
import type { PageEvent } from '@workspace/shared';

export function createPagePublisher(
  queue: CfQueue<PageEvent> | null | undefined
): Publisher<PageEvent> {
  return createPublisher<PageEvent>(queue);
}
