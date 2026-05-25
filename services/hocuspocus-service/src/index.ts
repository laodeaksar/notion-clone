import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
import { verifyJWT } from './auth';
import { loadDocument, storeDocument } from './persistence';

const PORT   = Number(process.env.PORT)       || 1234;
const SECRET = process.env.JWT_SECRET         ?? '';
const AUTH_REQUIRED = process.env.AUTH_REQUIRED !== 'false';

const server = Server.configure({
  port: PORT,
  name: 'hocuspocus-service',

  async onAuthenticate({ token, connection }) {
    if (!AUTH_REQUIRED) {
      return { userId: 'anonymous' };
    }

    if (!token) {
      if (!AUTH_REQUIRED) return { userId: 'anonymous' };
      throw new Error('Unauthorized — no token provided');
    }

    const payload = await verifyJWT(token, SECRET);
    if (!payload) {
      throw new Error('Unauthorized — invalid or expired token');
    }

    return {
      userId:    payload.sub as string,
      userEmail: payload.email as string
    };
  },

  async onLoadDocument({ document, documentName }) {
    const state = await loadDocument(documentName);
    if (state) {
      Y.applyUpdate(document, state);
      console.log(`[hocuspocus] Loaded "${documentName}" from DB (${state.byteLength} bytes)`);
    } else {
      console.log(`[hocuspocus] New document "${documentName}"`);
    }
    return document;
  },

  async onStoreDocument({ document, documentName }) {
    await storeDocument(documentName, document);
    console.log(`[hocuspocus] Stored "${documentName}"`);
  },

  async onConnect({ connection, documentName }) {
    console.log(`[hocuspocus] Client connected to "${documentName}" (total: ${connection.document?.getConnections?.()?.length ?? '?'})`);
  },

  async onDisconnect({ documentName }) {
    console.log(`[hocuspocus] Client disconnected from "${documentName}"`);
  }
});

server.listen();
console.log(`[hocuspocus] WebSocket server listening on ws://0.0.0.0:${PORT}`);
