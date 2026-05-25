import { createPublisher } from '@workspace/shared';
import type { CfQueue, Publisher } from '@workspace/shared';
import type { BlockEvent } from '@workspace/shared';

export function createBlockPublisher(
  queue: CfQueue<BlockEvent> | null | undefined
): Publisher<BlockEvent> {
  return createPublisher<BlockEvent>(queue);
}
