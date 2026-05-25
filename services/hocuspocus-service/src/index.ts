import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { Logger } from '@hocuspocus/extension-logger';
import { verifyJWT } from './auth';
import { fetchDocument, storeDocument } from './persistence';

const PORT          = Number(process.env.PORT) || 1234;
const SECRET        = process.env.JWT_SECRET   ?? '';
const AUTH_REQUIRED = process.env.AUTH_REQUIRED !== 'false';

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
    })
  ],

  async onAuthenticate({ token }) {
    if (!AUTH_REQUIRED) return { userId: 'anonymous' };
    if (!token) throw new Error('Unauthorized — no token provided');

    const payload = await verifyJWT(token, SECRET);
    if (!payload) throw new Error('Unauthorized — invalid or expired token');

    return {
      userId:    payload.sub   as string,
      userEmail: payload.email as string
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
console.log(`[hocuspocus] WebSocket server listening on ws://0.0.0.0:${PORT}`);
