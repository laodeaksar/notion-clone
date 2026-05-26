import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { Logger } from '@hocuspocus/extension-logger';
import { Redis } from '@hocuspocus/extension-redis';
import { fetchDocument, storeDocument } from './persistence';

const PORT             = Number(process.env.PORT) || 1234;
const AUTH_REQUIRED    = process.env.AUTH_REQUIRED !== 'false';
const REDIS_URL        = process.env.REDIS_URL;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:8083';

const server = new Server({
  port: PORT,
  name: 'hocuspocus-service',

  extensions: [
    new Logger(),

    new Database({
      fetch: async ({ documentName }) => {
        const state = await fetchDocument(documentName);
        if (state) {
          console.log(`[hocuspocus:db] Loaded "${documentName}" (${state.byteLength} bytes)`);
        } else {
          console.log(`[hocuspocus:db] New document "${documentName}"`);
        }
        return state;
      },

      store: async ({ documentName, state }) => {
        await storeDocument(documentName, state);
        console.log(`[hocuspocus:db] Stored "${documentName}" (${state.byteLength} bytes)`);
      }
    }),

    ...(REDIS_URL
      ? [new Redis({ url: REDIS_URL })]
      : []
    )
  ],

  async onAuthenticate({ token }) {
    if (!AUTH_REQUIRED) return { userId: 'anonymous' };
    if (!token) throw new Error('Unauthorized — no token provided');

    let res: Response;
    try {
      res = await fetch(`${AUTH_SERVICE_URL}/api/auth/get-session`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      throw new Error('Unauthorized — auth service unreachable');
    }

    if (!res.ok) throw new Error('Unauthorized — invalid or expired session');

    const data = await res.json() as {
      user?:    { id: string; email: string };
      session?: { id: string };
    };
    if (!data.user || !data.session) throw new Error('Unauthorized — no session');

    return {
      userId:    data.user.id,
      userEmail: data.user.email
    };
  },

  async onConnect({ documentName }) {
    console.log(`[hocuspocus] Client connected to "${documentName}"`);
  },

  async onDisconnect({ documentName }) {
    console.log(`[hocuspocus] Client disconnected from "${documentName}"`);
  }
});

server.listen();
console.log(
  `[hocuspocus] WebSocket server on ws://0.0.0.0:${PORT}` +
  (REDIS_URL ? ' (Redis sync enabled)' : ' (single-instance mode)')
);
