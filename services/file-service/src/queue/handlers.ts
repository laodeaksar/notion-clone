import { createDb, blocks, sql } from '@workspace/db';
import type { FileEvent } from '@workspace/shared';
import type { Bindings } from '../types/env';

/**
 * Handles incoming FileEvents from the Cloudflare Queue.
 *
 * file.uploaded → audit log (quota + DB record already written synchronously
 *                 in file.service.ts; this is the place to add CDN pre-warming
 *                 or async thumbnail generation in the future).
 *
 * file.deleted  → audit log (quota release + DB record deletion already done
 *                 synchronously; add CDN cache-purge hooks here when needed).
 *
 * file.moved    → rewrites every block whose JSONB content still references
 *                 the old publicId / URL, replacing it with the new values.
 *                 Uses Postgres text-replacement on the JSONB column so the
 *                 update is atomic and does not require loading every block
 *                 into application memory.
 */
export async function handleFileEvent(event: FileEvent, env: Bindings): Promise<void> {
  switch (event.type) {
    case 'file.uploaded': {
      const { publicId, url, provider } = event.payload;
      console.log(
        `[file-service] file.uploaded: ${provider} asset ready`,
        `publicId=${publicId}`,
        `url=${url}`
      );
      break;
    }

    case 'file.deleted': {
      const { publicId } = event.payload;
      console.log(`[file-service] file.deleted: asset removed publicId=${publicId}`);
      break;
    }

    case 'file.moved': {
      const { oldPublicId, publicId: newPublicId, url: newUrl } = event.payload;
      const db = createDb(env.DATABASE_URL);

      // Replace the old publicId string anywhere it appears inside the JSONB
      // content column. We cast to text, run replace(), then cast back to jsonb.
      // The WHERE clause pre-filters rows so we only touch affected blocks.
      await db.execute(
        sql`
          UPDATE ${blocks}
          SET    content    = replace(content::text, ${oldPublicId}, ${newPublicId})::jsonb,
                 updated_at = now()
          WHERE  content::text LIKE ${'%' + oldPublicId + '%'}
        `
      );

      console.log(
        `[file-service] file.moved: updated block content references`,
        `${oldPublicId} → ${newPublicId} (${newUrl})`
      );
      break;
    }
  }
}
